const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  payPeriod: { type: String }, // e.g. "January 2025"

  workingDays: { type: Number, default: 0 },
  presentDays: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  halfDays: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },

  earnings: {
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    transportAllowance: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    otherEarnings: { type: Number, default: 0 },
  },

  deductions: {
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    loanDeduction: { type: Number, default: 0 },
    leaveDedution: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
  },

  grossEarnings: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },

  status: { type: String, enum: ['draft', 'processed', 'paid', 'cancelled'], default: 'draft' },
  paymentDate: { type: Date },
  paymentMode: { type: String, enum: ['bank-transfer', 'cash', 'cheque', null], default: null },
  remarks: { type: String },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
