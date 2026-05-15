import express from 'express';
import multer from 'multer';
import { analyzeReceipt, splitReceipt, getReceiptHistory } from '../../controllers/receiptController.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — mobile photos can be large
});

router.post('/analyze', requireAuth, upload.single('image'), analyzeReceipt);
router.post('/split', requireAuth, splitReceipt);
router.get('/history', requireAuth, getReceiptHistory);

export default router;
