// dashboard.js
const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const Department = require('../models/Department');
const { auth } = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [totalEmployees, activeEmployees, deptCount] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'active' }),
      Department.countDocuments({ isActive: true }),
    ]);

    const payrolls = await Payroll.find({ month, year });
    const totalPayroll = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const paidCount = payrolls.filter(p => p.status === 'paid').length;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.find({ date: today });
    const presentToday = todayAttendance.filter(a => ['present', 'late'].includes(a.status)).length;

    const deptPayroll = await Payroll.aggregate([
      { $match: { month, year } },
      { $lookup: { from: 'employees', localField: 'employee', foreignField: '_id', as: 'emp' } },
      { $unwind: '$emp' },
      { $lookup: { from: 'departments', localField: 'emp.department', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$dept.name', total: { $sum: '$netSalary' }, count: { $sum: 1 } } },
    ]);

    const recentPayrolls = await Payroll.find({ month, year })
      .populate('employee', 'firstName lastName employeeCode')
      .sort({ createdAt: -1 }).limit(5);

    res.json({ totalEmployees, activeEmployees, deptCount, totalPayroll, paidCount, presentToday, deptPayroll, recentPayrolls });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
