import OpenAI from 'openai';
import sharp from 'sharp';
import { computeSplit } from '../services/splitService.js';
import User from '../models/User.js';

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const OCR_LANGUAGE = process.env.OCR_LANGUAGE || 'eng';
const OCR_SPACE_ENDPOINT =
  process.env.OCR_SPACE_ENDPOINT || 'https://api.ocr.space/parse/image';
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || process.env.OCRSPACE_API_KEY;

const OCR_IGNORE_LINES = [
  'GST',
  'GSTIN',
  'Cashier',
  'Token',
  'Thank You',
  'Visit Again',
  'Date',
  'Bangalore',
  'BTM',
  'Taco Street',
  'Dine In',
  'Round off',
];

const extractJson = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('AI response did not contain JSON.');
  }

  const candidate = match[0];
  try {
    return JSON.parse(candidate);
  } catch (error) {
    const repaired = candidate.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(repaired);
    } catch (repairError) {
      throw error;
    }
  }
};

const normalizeTaxes = (parsed) => {
  if (Array.isArray(parsed?.taxes)) {
    return parsed.taxes
      .map((tax, index) => ({
        label: tax.label || `Tax ${index + 1}`,
        amount: Number(tax.amount ?? tax.value ?? 0) || 0,
      }))
      .filter((tax) => tax.amount > 0);
  }

  if (typeof parsed?.tax === 'number') {
    return parsed.tax > 0 ? [{ label: 'Tax', amount: parsed.tax }] : [];
  }

  return [];
};

const buildReceiptFromParsed = (parsed) => {
  const extraTaxes = [];
  const items = Array.isArray(parsed?.items)
    ? parsed.items
      .map((item, index) => ({
        id: `item-${index + 1}`,
        name: String(item.name || `Item ${index + 1}`).trim(),
        price: Number(item.price ?? item.amount ?? 0) || 0,
        quantity: Number(item.quantity ?? 1) || 1,
      }))
      .filter((item) => {
        const hasLetters = /[A-Za-z]/.test(item.name);
        const isTaxLine = /(gst|tax|vat|service)/i.test(item.name);
        if (isTaxLine && item.price > 0) {
          extraTaxes.push({ label: item.name, amount: item.price });
          return false;
        }
        return hasLetters && item.price > 0;
      })
    : [];

  const taxes = [...normalizeTaxes(parsed), ...extraTaxes];
  const serviceCharges = [];
  const itemTotal = items.reduce((sum, item) => sum + item.price, 0);
  const taxTotal = taxes.reduce((sum, tax) => sum + (Number(tax.amount) || 0), 0);
  const subtotal = Number(parsed?.subtotal ?? itemTotal) || itemTotal;
  const total = Number(parsed?.total ?? subtotal + taxTotal) || subtotal + taxTotal;

  return {
    currency: 'INR',
    source: 'tesseract+groq',
    items,
    taxes,
    serviceCharges,
    subtotal,
    total,
  };
};

const runOcr = async (imageBuffer) => {
  if (!OCR_SPACE_API_KEY) {
    throw new Error('Missing OCR_SPACE_API_KEY.');
  }

  const base64Image = imageBuffer.toString('base64');
  const params = new URLSearchParams({
    apikey: OCR_SPACE_API_KEY,
    language: OCR_LANGUAGE,
    base64Image: `data:image/png;base64,${base64Image}`,
    isOverlayRequired: 'false',
    OCREngine: '2',
    scale: 'true',
    isTable: 'true',
    detectOrientation: 'true',
  });

  const response = await fetch(OCR_SPACE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`OCR.Space request failed with ${response.status}.`);
  }

  const payload = await response.json();
  if (payload?.IsErroredOnProcessing) {
    const message = payload?.ErrorMessage?.[0] || 'OCR.Space processing failed.';
    throw new Error(message);
  }

  const parsedResults = payload?.ParsedResults || [];
  const text = parsedResults.map((result) => result.ParsedText || '').join('\n');
  return text.trim();
};

const preprocessImage = async (imageBuffer) => {
  return sharp(imageBuffer, { failOn: 'none' })
    .resize({ width: 1500 })
    .grayscale()
    .normalize()
    .sharpen()
    .threshold(170)
    .png()
    .toBuffer();
};

const lineHasQuantityOrPrice = (line) => {
  const hasQuantity = /\(Q\)\s*\d+(?:\.\d+)?/i.test(line);
  const hasEqualsPrice = /=\s*-?\d+(?:\.\d+)?/.test(line);
  const hasUnitPrice = /x\s*\d+(?:\.\d+)?/i.test(line);
  return hasQuantity || hasEqualsPrice || hasUnitPrice;
};

const sanitizeOcrText = (rawText) => {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) =>
      OCR_IGNORE_LINES.every((token) => !line.toLowerCase().includes(token.toLowerCase()))
    );

  const merged = [];
  for (let index = 0; index < lines.length; index += 1) {
    let current = lines[index];
    const next = lines[index + 1];
    if (
      next &&
      /^[a-z]/.test(next) &&
      !lineHasQuantityOrPrice(next)
    ) {
      current = `${current} ${next}`;
      index += 1;
    }
    merged.push(current);
  }

  return merged.join('\n');
};

const extractRegexItems = (rawText) => {
  const items = [];
  const lines = rawText.split(/\r?\n/);

  lines.forEach((line) => {
    const qtyMatch = line.match(/\(Q\)\s*(\d+(?:\.\d+)?)/i);
    const priceMatch = line.match(/=\s*(-?\d+(?:\.\d+)?)/);
    if (!qtyMatch || !priceMatch) return;

    const name = line
      .split(/\(Q\)/i)[0]
      .trim()
      .replace(/[-–—]+$/, '')
      .trim();
    const quantity = Number(qtyMatch[1]);
    const price = Math.abs(parseFloat(priceMatch[1]));

    if (!name || !Number.isFinite(quantity) || !Number.isFinite(price)) return;
    items.push({ name, quantity, price });
  });

  return items;
};

const parseWithGroq = async (rawText) => {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: GROQ_BASE_URL,
  });
  const cleanedText = sanitizeOcrText(rawText);
  const regexItems = extractRegexItems(cleanedText);
  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert receipt parser. Ignore garbage OCR text and return ONLY valid JSON.',
      },
      {
        role: 'user',
        content:
          'The OCR text may contain broken words, headers, GST info, and random noise. ' +
          'Ignore restaurant name/address/cashier info. Extract ONLY ordered items. ' +
          'Merge broken words and correct item names. Return ONLY valid JSON with shape: ' +
          '{"items":[{"name":"", "quantity":1, "price":0}], "taxes": [{"label":"", "amount":0}], "subtotal": 0, "total": 0}. ' +
          `OCR text:\n${cleanedText}\n\nRegex items (if any):\n${JSON.stringify(regexItems)}`,
      },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const content = response.choices?.[0]?.message?.content || '';
  return extractJson(content);
};

export const analyzeReceipt = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded.' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY.' });
  }

  try {
    const preprocessed = await preprocessImage(req.file.buffer);
    const rawText = await runOcr(preprocessed);
    const parsed = await parseWithGroq(rawText);
    const receipt = buildReceiptFromParsed(parsed);
    const warnings = receipt.items.length === 0 ? ['No items detected.'] : [];

    const user = req.user || (await User.findById(req.userId));
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    user.receipts.push({
      ...receipt,
      rawText,
      parsed,
      warnings,
    });
    await user.save();
    const savedReceipt = user.receipts[user.receipts.length - 1];

    res.json({
      receiptId: savedReceipt._id,
      receipt,
      rawText,
      parsed,
      warnings,
    });
  } catch (error) {
    console.error('[analyze] Error:', error.message);
    res.status(500).json({ error: error.message || 'OCR parsing failed.' });
  }
};

export const splitReceipt = async (req, res) => {
  try {
    const { receiptId, receipt, people, assignments } = req.body || {};

    if (!receipt || !Array.isArray(people)) {
      return res.status(400).json({ error: 'Missing receipt or people list.' });
    }

    const result = computeSplit({ receipt, people, assignments });

    const user = req.user;
    if (receiptId && user) {
      const receiptSubdoc = user.receipts.id(receiptId);

      if (receiptSubdoc) {
        receiptSubdoc.items = receipt.items;
        receiptSubdoc.taxes = receipt.taxes;
        receiptSubdoc.serviceCharges = receipt.serviceCharges;
        receiptSubdoc.subtotal = receipt.subtotal;
        receiptSubdoc.total = receipt.total;
        receiptSubdoc.assignments = assignments;
        receiptSubdoc.splitResult = result;
        await user.save();
      }
    }
    res.json(result);
  } catch (error) {
    console.error('Failed to save split history:', error);
    res.status(500).json({ error: 'Failed to process split.' });
  }
};

export const getReceiptHistory = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Sort receipts by date (newest first)
    const sortedReceipts = user.receipts.sort((a, b) => b.createdAt - a.createdAt);

    const totalReceipts = sortedReceipts.length;
    const paginatedReceipts = sortedReceipts.slice(skip, skip + limit);

    res.json({
      receipts: paginatedReceipts,
      totalPages: Math.ceil(totalReceipts / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
