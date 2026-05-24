const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { auth, authorize } = require('../middleware/auth');

// GET attendance records
router.get('/', auth, async (req, res) => {
  try {
    const { employee, month, year, date, status } = req.query;
    const filter = {};
    if (employee) filter.employee = employee;
    if (status) filter.status = status;
    if (date) {
      filter.date = new Date(date);
    } else if (month && year) {
      filter.date = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0),
      };
    }
    const attendance = await Attendance.find(filter)
      .populate('employee', 'firstName lastName employeeCode department')
      .sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST mark attendance
router.post('/', auth, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { employee, date, status, checkIn, checkOut, hoursWorked, overtimeHours, remarks, leaveType } = req.body;
    const attendance = await Attendance.findOneAndUpdate(
      { employee, date: new Date(date) },
      { employee, date: new Date(date), status, checkIn, checkOut, hoursWorked, overtimeHours, remarks, leaveType, markedBy: req.user._id },
      { upsert: true, new: true }
    ).populate('employee', 'firstName lastName employeeCode');
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST bulk mark attendance for a date
router.post('/bulk', auth, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{employee, status, checkIn, checkOut, ...}]
    const results = [];
    for (const record of records) {
      const att = await Attendance.findOneAndUpdate(
        { employee: record.employee, date: new Date(date) },
        { ...record, date: new Date(date), markedBy: req.user._id },
        { upsert: true, new: true }
      );
      results.push(att);
    }
    res.json({ message: `Marked attendance for ${results.length} employees`, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET attendance summary for an employee in a month
router.get('/summary/:employeeId', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {
      employee: req.params.employeeId,
      date: { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0) },
    };
    const records = await Attendance.find(filter);
    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      halfDay: records.filter(r => r.status === 'half-day').length,
      late: records.filter(r => r.status === 'late').length,
      onLeave: records.filter(r => r.status === 'on-leave').length,
      holiday: records.filter(r => r.status === 'holiday').length,
      overtimeHours: records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
    };
    res.json({ summary, records });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST seed attendance for demo
router.post('/seed', auth, authorize('admin'), async (req, res) => {
  try {
    const { month, year } = req.body;
    const employees = await Employee.find({ status: 'active' });
    const statuses = ['present', 'present', 'present', 'present', 'present', 'absent', 'half-day', 'late', 'present'];
    const daysInMonth = new Date(year, month, 0).getDate();
    let count = 0;

    for (const emp of employees) {
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month - 1, day);
        const dayOfWeek = d.getDay();
        const status = dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : statuses[Math.floor(Math.random() * statuses.length)];
        try {
          await Attendance.findOneAndUpdate(
            { employee: emp._id, date: d },
            { employee: emp._id, date: d, status, checkIn: status === 'present' ? '09:00' : '', checkOut: status === 'present' ? '18:00' : '', hoursWorked: status === 'present' ? 9 : 0 },
            { upsert: true }
          );
          count++;
        } catch (_) {}
      }
    }
    res.json({ message: `Seeded ${count} attendance records` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
