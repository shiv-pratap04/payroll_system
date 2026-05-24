const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: { type: String },
  checkOut: { type: String },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late', 'on-leave', 'holiday', 'weekend'],
    default: 'absent',
  },
  hoursWorked: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  remarks: { type: String },
  leaveType: { type: String, enum: ['sick', 'casual', 'earned', 'unpaid', 'maternity', 'paternity', null], default: null },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
