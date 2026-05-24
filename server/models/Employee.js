const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeCode: { type: String, required: true, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, trim: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  designation: { type: String, required: true },
  employmentType: { type: String, enum: ['full-time', 'part-time', 'contract', 'intern'], default: 'full-time' },
  joiningDate: { type: Date, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    accountHolderName: String,
  },
  salary: {
    basic: { type: Number, required: true, default: 0 },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    transportAllowance: { type: Number, default: 0 },
  },
  deductions: {
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    loanDeduction: { type: Number, default: 0 },
  },
  status: { type: String, enum: ['active', 'inactive', 'on-leave', 'terminated'], default: 'active' },
  profileImage: { type: String, default: '' },
}, { timestamps: true });

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

employeeSchema.virtual('grossSalary').get(function () {
  const s = this.salary;
  return (s.basic || 0) + (s.hra || 0) + (s.da || 0) + (s.specialAllowance || 0) + (s.medicalAllowance || 0) + (s.transportAllowance || 0);
});

employeeSchema.virtual('totalDeductions').get(function () {
  const d = this.deductions;
  return (d.pf || 0) + (d.esi || 0) + (d.tds || 0) + (d.professionalTax || 0) + (d.loanDeduction || 0);
});

employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Employee', employeeSchema);
