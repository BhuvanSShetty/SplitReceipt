import express from 'express';
import multer from 'multer';
import { analyzeReceipt, splitReceipt } from '../controllers/receiptController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', requireAuth, upload.single('image'), analyzeReceipt);
router.post('/split', requireAuth, splitReceipt);

export default router;
