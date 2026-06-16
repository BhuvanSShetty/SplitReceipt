import OpenAI from 'openai';
import sharp from 'sharp';
import { computeSplit } from '../services/splitService.js';
import User from '../models/User.js';

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const OCR_LANGUAGE = process.env.OCR_LANGUAGE || 'eng';
const OCR_SPACE_ENDPOINT = process.env.OCR_SPACE_ENDPOINT || 'https://api.ocr.space/parse/image';
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
  // Find the first JSON object inside the model response text.
  const match = text.match(/\{[\s\S]*\}/); //\s → any whitespace character \S → any non-whitespace character * Match any character 0 or more times
  if (!match) {
    throw new Error('AI response did not contain JSON.');
  }

  const candidate = match[0];
  try {
    // Parse the extracted JSON candidate.
    return JSON.parse(candidate);
  } catch (error) {
    // Remove trailing commas and try parsing again.
    const repaired = candidate.replace(/,\s*([}\]])/g, '$1');
    try {
      // Parse the repaired JSON candidate.
      return JSON.parse(repaired);
    } catch (repairError) {
      throw error;
    }
  }
};

const normalizeTaxes = (parsed) => {
  if (Array.isArray(parsed?.taxes)) {
    // Normalize each tax entry into a consistent shape.
    return parsed.taxes.map((tax, index) => ({
        label: tax.label || `Tax ${index + 1}`,
        // Convert the tax amount into a numeric value.
        amount: Number(tax.amount ?? tax.value ?? 0) || 0,
      })).filter((tax) => tax.amount > 0);
  }

  if (typeof parsed?.tax === 'number') {
    // Convert a single numeric tax field into the array shape.
    return parsed.tax > 0 ? [{ label: 'Tax', amount: parsed.tax }] : [];
  }

  return [];
};

const buildReceiptFromParsed = (parsed) => {
  const extraTaxes = [];
  // Convert parsed items into receipt items and separate tax-like rows.
  const items = Array.isArray(parsed?.items)? parsed.items.map((item, index) => ({
        id: `item-${index + 1}`,
        // Trim and coerce the parsed item name into a string.
        name: String(item.name || `Item ${index + 1}`).trim(),
        // Coerce the parsed item price into a number.
        price: Number(item.price ?? item.amount ?? 0) || 0,
        // Coerce the parsed item quantity into a number.
        quantity: Number(item.quantity ?? 1) || 1,
      }))
      .filter((item) => {
        // Keep rows that look like real item names.
        const hasLetters = /[A-Za-z]/.test(item.name);
        // Detect rows that actually represent tax or service charges.
        const isTaxLine = /(gst|tax|vat|service)/i.test(item.name);
        if (isTaxLine && item.price > 0) {
          // Move tax-like rows into the extra tax bucket.
          extraTaxes.push({ label: item.name, amount: item.price });
          return false;
        }
        return hasLetters && item.price > 0;
      })
    : [];

  // Combine parsed taxes with any tax rows detected from the item list.
  const taxes = [...normalizeTaxes(parsed), ...extraTaxes];
  const serviceCharges = [];
  // Sum item prices to compute the base item total.
  const itemTotal = items.reduce((sum, item) => sum + item.price, 0);
  // Sum all tax amounts into a single total.
  const taxTotal = taxes.reduce((sum, tax) => sum + (Number(tax.amount) || 0), 0);
  // Use parsed subtotal when available, otherwise fall back to item total.
  const subtotal = Number(parsed?.subtotal ?? itemTotal) || itemTotal;
  // Use parsed total when available, otherwise add subtotal and taxes.
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

  // Encode the preprocessed image as base64 for OCR.Space.
  const base64Image = imageBuffer.toString('base64');
  // Build the OCR.Space form payload.
  const params = new URLSearchParams({
    apikey: OCR_SPACE_API_KEY,
    language: OCR_LANGUAGE,
    base64Image: `data:image/png;base64,${base64Image}`,
    isOverlayRequired: 'false',
    OCREngine: '2',
    scale: 'true', //Upscales image before OCR.
    isTable: 'true', //This image contains rows and columns.
    detectOrientation: 'true',
  });

  // Send the OCR request to the external OCR service.
  const response = await fetch(OCR_SPACE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`OCR.Space request failed with ${response.status}.`);
  }

  // Read the OCR.Space JSON payload.
  const payload = await response.json();
  if (payload?.IsErroredOnProcessing) {
    // Surface the OCR provider error message when available.
    const message = payload?.ErrorMessage?.[0] || 'OCR.Space processing failed.';
    throw new Error(message);
  }

  // Concatenate all OCR text fragments into one string.
  const parsedResults = payload?.ParsedResults || [];
  const text = parsedResults.map((result) => result.ParsedText || '').join('\n');
  // Trim the final OCR text before returning it.
  return text.trim();
};

const preprocessImage = async (imageBuffer) => {
  // Resize and enhance the image before OCR.
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
  // Detect quantity patterns like (Q) 2.
  const hasQuantity = /\(Q\)\s*\d+(?:\.\d+)?/i.test(line);
  // Detect lines that contain an equals-sign price.
  const hasEqualsPrice = /=\s*-?\d+(?:\.\d+)?/.test(line);
  // Detect multiplier-style quantity patterns like x 2.
  const hasUnitPrice = /x\s*\d+(?:\.\d+)?/i.test(line);
  return hasQuantity || hasEqualsPrice || hasUnitPrice;
};

const sanitizeOcrText = (rawText) => {
  // Split OCR text into cleaned, non-empty, filtered lines.
  const lines = rawText
    .split(/\r?\n/)
    // Trim whitespace from each OCR line.
    .map((line) => line.trim())
    // Remove empty lines.
    .filter(Boolean)
    // Drop receipt boilerplate and noise lines.
    .filter((line) =>
      OCR_IGNORE_LINES.every((token) => !line.toLowerCase().includes(token.toLowerCase()))
    );

  const merged = [];
  for (let index = 0; index < lines.length; index += 1) {
    let current = lines[index];
    const next = lines[index + 1];
    if (
      next &&
      // Merge a lowercase continuation line into the current line.
      /^[a-z]/.test(next) &&
      // Only merge if the next line does not already look like an item row.
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
  // Split the raw OCR text into lines for pattern matching.
  const lines = rawText.split(/\r?\n/);

  lines.forEach((line) => {
    // Capture quantity from lines that use the (Q) pattern.
    const qtyMatch = line.match(/\(Q\)\s*(\d+(?:\.\d+)?)/i);
    // Capture the line total from equals-sign price rows.
    const priceMatch = line.match(/=\s*(-?\d+(?:\.\d+)?)/);
    if (!qtyMatch || !priceMatch) return;

    // Remove the quantity suffix to isolate the item name.
    const name = line
      .split(/\(Q\)/i)[0]
      .trim()
      .replace(/[-–—]+$/, '')
      .trim();
    // Convert the captured quantity to a number.
    const quantity = Number(qtyMatch[1]);
    // Convert the captured price to a positive number.
    const price = Math.abs(parseFloat(priceMatch[1]));

    if (!name || !Number.isFinite(quantity) || !Number.isFinite(price)) return;
    // Store the parsed item candidate.
    items.push({ name, quantity, price });
  });

  return items;
};

const parseWithGroq = async (rawText) => {
  // Create the Groq-compatible OpenAI client.
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: GROQ_BASE_URL,
  });
  // Clean the OCR text before sending it to the model.
  const cleanedText = sanitizeOcrText(rawText);
  // Pull out deterministic item candidates from the OCR text.
  const regexItems = extractRegexItems(cleanedText);
  // Ask Groq to normalize the OCR text into structured JSON.
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

  // Extract the JSON payload from the model response.
  const content = response.choices?.[0]?.message?.content || '';
  return extractJson(content);
};

export const analyzeReceipt = async (req, res) => {
  if (!req.file) {
    // Reject requests that do not include an uploaded image.
    return res.status(400).json({ error: 'No image uploaded.' });
  }

  if (!process.env.GROQ_API_KEY) {
    // Reject requests when the model API key is missing.
    return res.status(500).json({ error: 'Missing GROQ_API_KEY.' });
  }

  try {
    // Preprocess the uploaded image for OCR.
    const preprocessed = await preprocessImage(req.file.buffer);
    // Run OCR over the preprocessed image.
    const rawText = await runOcr(preprocessed);
    // Convert OCR text into structured receipt data.
    const parsed = await parseWithGroq(rawText);
    // Build the canonical receipt object used by the app.
    const receipt = buildReceiptFromParsed(parsed);
    // Warn when no line items were detected.
    const warnings = receipt.items.length === 0 ? ['No items detected.'] : [];

    // Load the authenticated user from the request or database.
    const user = req.user || (await User.findById(req.userId));
    if (!user) {
      // Reject unauthenticated users.
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    // Persist the analyzed receipt on the user record.
    user.receipts.push({
      ...receipt,
      rawText,
      parsed,
      warnings,
    });
    // Save the updated user document.
    await user.save();
    // Read back the saved receipt subdocument.
    const savedReceipt = user.receipts[user.receipts.length - 1];

    // Return the processed receipt payload to the client.
    res.json({
      receiptId: savedReceipt._id,
      receipt,
      rawText,
      parsed,
      warnings,
    });
  } catch (error) {
    // Log analysis failures for debugging.
    console.error('[analyze] Error:', error.message);
    res.status(500).json({ error: error.message || 'OCR parsing failed.' });
  }
};

export const splitReceipt = async (req, res) => {
  try {
    const { receiptId, receipt, people, assignments } = req.body || {};

    if (!receipt || !Array.isArray(people)) {
      // Reject split requests without the required payload.
      return res.status(400).json({ error: 'Missing receipt or people list.' });
    }

    // Compute the split result for the receipt.
    const result = computeSplit({ receipt, people, assignments });

    // Use the authenticated user record when saving split history.
    const user = req.user;
    if (receiptId && user) {
      // Find the stored receipt subdocument by id.
      const receiptSubdoc = user.receipts.id(receiptId);

      if (receiptSubdoc) {
        // Keep the stored receipt data in sync with the latest split input.
        receiptSubdoc.items = receipt.items;
        receiptSubdoc.taxes = receipt.taxes;
        receiptSubdoc.serviceCharges = receipt.serviceCharges;
        receiptSubdoc.subtotal = receipt.subtotal;
        receiptSubdoc.total = receipt.total;
        receiptSubdoc.assignments = assignments;
        receiptSubdoc.splitResult = result;
        // Save the receipt history update.
        await user.save();
      }
    }
    // Return the computed split result.
    res.json(result);
  } catch (error) {
    // Log persistence or split failures.
    console.error('Failed to save split history:', error);
    res.status(500).json({ error: 'Failed to process split.' });
  }
};

export const getReceiptHistory = async (req, res) => {
  try {
    // Read the authenticated user from the request.
    const user = req.user;
    if (!user) {
      // Reject requests when no user is attached.
      return res.status(401).json({ error: 'User not found.' });
    }

    // Parse the requested page number.
    const page = parseInt(req.query.page) || 1;
    // Parse the requested page size.
    const limit = parseInt(req.query.limit) || 5;
    // Compute the zero-based offset for the page.
    const skip = (page - 1) * limit;

    // Sort receipts by date (newest first)
    // Sort receipts so the newest history appears first.
    const sortedReceipts = user.receipts.sort((a, b) => b.createdAt - a.createdAt);

    // Count total receipts for pagination metadata.
    const totalReceipts = sortedReceipts.length;
    // Slice the requested page from the sorted receipts.
    const paginatedReceipts = sortedReceipts.slice(skip, skip + limit);

    // Return the paginated receipt history.
    res.json({
      receipts: paginatedReceipts,
      totalPages: Math.ceil(totalReceipts / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
