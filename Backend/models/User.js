import mongoose from 'mongoose';

const receiptItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
  },
  { _id: false }
);

const receiptTaxSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const receiptSchema = new mongoose.Schema(
  {
    source: { type: String, default: 'ocr' },
    currency: { type: String, default: 'INR' },
    items: { type: [receiptItemSchema], default: [] },
    taxes: { type: [receiptTaxSchema], default: [] },
    serviceCharges: { type: [receiptTaxSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    rawText: { type: String, default: '' },
    parsed: { type: mongoose.Schema.Types.Mixed },
    warnings: { type: [String], default: [] },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    members: { type: [String], default: [] },
    receipts: { type: [receiptSchema], default: [] },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
