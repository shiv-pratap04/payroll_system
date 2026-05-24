const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { auth, authorize } = require('../middleware/auth');

// GET all employees
router.get('/', auth, async (req, res) => {
  try {
    const { status, department, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (page - 1) * limit;
    const [employees, total] = await Promise.all([
      Employee.find(filter).populate('department', 'name code').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Employee.countDocuments(filter),
    ]);
    res.json({ employees, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single employee
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('department', 'name code');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create employee
router.post('/', auth, authorize('admin', 'hr'), async (req, res) => {
  try {
    const count = await Employee.countDocuments();
    const employeeCode = req.body.employeeCode || `EMP${String(count + 1).padStart(3, '0')}`;
    const employee = await Employee.create({ ...req.body, employeeCode });
    await employee.populate('department', 'name code');
    res.status(201).json(employee);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Employee code or email already exists' });
    res.status(500).json({ message: err.message });
  }
});

// PUT update employee
router.put('/:id', auth, authorize('admin', 'hr'), async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('department', 'name code');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE employee
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, { status: 'terminated' }, { new: true });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee terminated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
