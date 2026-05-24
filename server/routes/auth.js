const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const { auth } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['admin', 'hr', 'employee']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, role: role || 'admin' });
    const token = generateToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/seed - seed demo data
router.post('/seed', async (req, res) => {
  try {
    // Create departments
    const depts = await Department.insertMany([
      { name: 'Engineering', code: 'ENG', description: 'Software Engineering team' },
      { name: 'Human Resources', code: 'HR', description: 'HR and People Ops' },
      { name: 'Finance', code: 'FIN', description: 'Finance and Accounts' },
      { name: 'Marketing', code: 'MKT', description: 'Marketing and Growth' },
      { name: 'Operations', code: 'OPS', description: 'Operations team' },
    ], { ordered: false }).catch(() => Department.find());

    const allDepts = Array.isArray(depts) ? depts : await Department.find();

    // Create employees
    const empData = [
      { employeeCode: 'EMP001', firstName: 'Arjun', lastName: 'Sharma', email: 'arjun@company.com', department: allDepts[0]._id, designation: 'Senior Developer', joiningDate: new Date('2022-01-15'), gender: 'male', salary: { basic: 60000, hra: 24000, da: 6000, specialAllowance: 10000, medicalAllowance: 1250, transportAllowance: 800 }, deductions: { pf: 7200, esi: 0, tds: 5000, professionalTax: 200 } },
      { employeeCode: 'EMP002', firstName: 'Priya', lastName: 'Mehta', email: 'priya@company.com', department: allDepts[1]._id, designation: 'HR Manager', joiningDate: new Date('2021-06-01'), gender: 'female', salary: { basic: 45000, hra: 18000, da: 4500, specialAllowance: 8000, medicalAllowance: 1250, transportAllowance: 800 }, deductions: { pf: 5400, esi: 0, tds: 3000, professionalTax: 200 } },
      { employeeCode: 'EMP003', firstName: 'Rohan', lastName: 'Verma', email: 'rohan@company.com', department: allDepts[2]._id, designation: 'Finance Analyst', joiningDate: new Date('2023-03-20'), gender: 'male', salary: { basic: 40000, hra: 16000, da: 4000, specialAllowance: 6000, medicalAllowance: 1250, transportAllowance: 800 }, deductions: { pf: 4800, esi: 0, tds: 2000, professionalTax: 200 } },
      { employeeCode: 'EMP004', firstName: 'Sneha', lastName: 'Patel', email: 'sneha@company.com', department: allDepts[3]._id, designation: 'Marketing Lead', joiningDate: new Date('2022-08-10'), gender: 'female', salary: { basic: 50000, hra: 20000, da: 5000, specialAllowance: 9000, medicalAllowance: 1250, transportAllowance: 800 }, deductions: { pf: 6000, esi: 0, tds: 4000, professionalTax: 200 } },
      { employeeCode: 'EMP005', firstName: 'Vikram', lastName: 'Singh', email: 'vikram@company.com', department: allDepts[0]._id, designation: 'Junior Developer', joiningDate: new Date('2024-01-08'), gender: 'male', salary: { basic: 30000, hra: 12000, da: 3000, specialAllowance: 5000, medicalAllowance: 1250, transportAllowance: 800 }, deductions: { pf: 3600, esi: 900, tds: 0, professionalTax: 200 } },
    ];

    const employees = [];
    for (const e of empData) {
      const emp = await Employee.findOneAndUpdate({ employeeCode: e.employeeCode }, e, { upsert: true, new: true });
      employees.push(emp);
    }

    // Create admin user
    await User.findOneAndDelete({ email: 'admin@payroll.com' });
    await User.create({
      name: 'Admin User', email: 'admin@payroll.com', password: 'admin123', role: 'admin'
    });

    await User.findOneAndDelete({ email: 'hr@payroll.com' });
    await User.create({
      name: 'HR Manager', email: 'hr@payroll.com', password: 'hr12345', role: 'hr', employeeId: employees[1]._id
    });

    res.json({ message: '✅ Seed data created successfully', departments: allDepts.length, employees: employees.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
