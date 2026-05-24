const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { auth, authorize } = require('../middleware/auth');

// GET payroll records
router.get('/', auth, async (req, res) => {
  try {
    const { month, year, status, employee, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (status) filter.status = status;
    if (employee) filter.employee = employee;

    const skip = (page - 1) * limit;
    const [payrolls, total] = await Promise.all([
      Payroll.find(filter).populate({ path: 'employee', populate: { path: 'department', select: 'name' } }).skip(skip).limit(Number(limit)).sort({ year: -1, month: -1 }),
      Payroll.countDocuments(filter),
    ]);
    res.json({ payrolls, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single payroll
router.get('/:id', auth, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate({ path: 'employee', populate: { path: 'department', select: 'name code' } });
    if (!payroll) return res.status(404).json({ message: 'Payroll record not found' });
    res.json(payroll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST generate payroll for all employees for a month/year
router.post('/generate', auth, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ message: 'Month and year are required' });

    const employees = await Employee.find({ status: 'active' });
    const results = [];

    for (const emp of employees) {
      // Check if already exists
      const existing = await Payroll.findOne({ employee: emp._id, month, year });
      if (existing) { results.push({ employee: emp.employeeCode, status: 'skipped', reason: 'Already generated' }); continue; }

      // Get attendance for that month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const attendances = await Attendance.find({ employee: emp._id, date: { $gte: startDate, $lte: endDate } });

      const workingDays = attendances.filter(a => !['holiday', 'weekend'].includes(a.status)).length || 26;
      const presentDays = attendances.filter(a => a.status === 'present').length;
      const absentDays = attendances.filter(a => a.status === 'absent').length;
      const halfDays = attendances.filter(a => a.status === 'half-day').length;
      const overtimeHours = attendances.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

      // Calculate proportional earnings
      const ratio = workingDays > 0 ? (presentDays + halfDays * 0.5) / workingDays : 1;
      const s = emp.salary;
      const earnings = {
        basic: Math.round(s.basic * ratio),
        hra: Math.round(s.hra * ratio),
        da: Math.round(s.da * ratio),
        specialAllowance: Math.round(s.specialAllowance * ratio),
        medicalAllowance: s.medicalAllowance || 0,
        transportAllowance: s.transportAllowance || 0,
        overtimePay: Math.round(overtimeHours * (s.basic / 26 / 8) * 1.5),
        bonus: 0,
        otherEarnings: 0,
      };

      const grossEarnings = Object.values(earnings).reduce((a, b) => a + b, 0);
      const d = emp.deductions;
      const deductions = {
        pf: d.pf || 0,
        esi: d.esi || 0,
        tds: d.tds || 0,
        professionalTax: d.professionalTax || 0,
        loanDeduction: d.loanDeduction || 0,
        leaveDedution: Math.round(absentDays * (s.basic / 26)),
        otherDeductions: 0,
      };
      const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
      const netSalary = grossEarnings - totalDeductions;

      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const payroll = await Payroll.create({
        employee: emp._id,
        month, year,
        payPeriod: `${months[month - 1]} ${year}`,
        workingDays, presentDays, absentDays, halfDays, overtimeHours,
        earnings, deductions, grossEarnings, totalDeductions, netSalary,
        generatedBy: req.user._id,
      });

      results.push({ employee: emp.employeeCode, status: 'generated', payrollId: payroll._id });
    }

    res.json({ message: 'Payroll generation complete', results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update payroll status
router.put('/:id/status', auth, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { status, paymentDate, paymentMode, remarks } = req.body;
    const payroll = await Payroll.findByIdAndUpdate(req.params.id, { status, paymentDate, paymentMode, remarks }, { new: true }).populate('employee', 'firstName lastName employeeCode');
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });
    res.json(payroll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update payroll manually
router.put('/:id', auth, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { earnings, deductions, remarks } = req.body;
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });

    if (earnings) payroll.earnings = { ...payroll.earnings, ...earnings };
    if (deductions) payroll.deductions = { ...payroll.deductions, ...deductions };
    if (remarks) payroll.remarks = remarks;

    payroll.grossEarnings = Object.values(payroll.earnings).reduce((a, b) => a + b, 0);
    payroll.totalDeductions = Object.values(payroll.deductions).reduce((a, b) => a + b, 0);
    payroll.netSalary = payroll.grossEarnings - payroll.totalDeductions;

    await payroll.save();
    res.json(payroll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
