import React, { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, CheckCircle, XCircle, Clock, Users, RefreshCw, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { format, getDaysInMonth } from 'date-fns';

const statusColors = { present: 'success', absent: 'danger', 'half-day': 'warning', late: 'warning', 'on-leave': 'info', holiday: 'accent', weekend: 'muted' };
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [filterEmp, setFilterEmp] = useState('');
  const [view, setView] = useState('table'); // 'table' | 'calendar'

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance', { params: { month, year, employee: filterEmp || undefined } });
      setRecords(res.data);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  }, [month, year, filterEmp]);

  useEffect(() => {
    api.get('/employees', { params: { status: 'active', limit: 100 } }).then(r => setEmployees(r.data.employees));
  }, []);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const seedAttendance = async () => {
    setSeeding(true);
    try {
      const res = await api.post('/attendance/seed', { month, year });
      toast.success(res.data.message);
      fetchAttendance();
    } catch (err) { toast.error('Seed failed'); }
    finally { setSeeding(false); }
  };

  const markAttendance = async (empId, date, status) => {
    try {
      await api.post('/attendance', { employee: empId, date, status });
      toast.success('Attendance marked');
      fetchAttendance();
    } catch { toast.error('Failed'); }
  };

  // Summary
  const summary = {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    halfDay: records.filter(r => r.status === 'half-day').length,
    late: records.filter(r => r.status === 'late').length,
    onLeave: records.filter(r => r.status === 'on-leave').length,
  };

  // Group by employee for calendar view
  const byEmployee = employees.map(emp => {
    const empRecords = records.filter(r => r.employee?._id === emp._id || r.employee === emp._id);
    const dayMap = {};
    empRecords.forEach(r => { const d = new Date(r.date).getDate(); dayMap[d] = r.status; });
    const present = empRecords.filter(r => r.status === 'present').length;
    const absent = empRecords.filter(r => r.status === 'absent').length;
    return { ...emp, dayMap, present, absent };
  });

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, letterSpacing: -0.5 }}>Attendance</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{months[month - 1]} {year}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={seedAttendance} disabled={seeding}>
            {seeding ? <div className="spinner" /> : <Zap size={14} />} Seed Demo Data
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          ['Present', summary.present, 'var(--success)'],
          ['Absent', summary.absent, 'var(--danger)'],
          ['Half Day', summary.halfDay, 'var(--warning)'],
          ['Late', summary.late, 'var(--warning)'],
          ['On Leave', summary.onLeave, 'var(--info)'],
        ].map(([label, val, color]) => (
          <div key={label} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ flex: '0 1 155px' }}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ flex: '0 1 100px' }}>
            {[now.getFullYear() - 1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)} style={{ flex: '1 1 200px' }}>
            <option value="">All Employees</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>)}
          </select>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {[['table', 'Table'], ['calendar', 'Grid']].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '8px 14px', background: view === v ? 'var(--accent-dim)' : 'none', color: view === v ? 'var(--accent-light)' : 'var(--text-muted)', fontSize: 12, fontWeight: view === v ? 600 : 400, border: 'none' }}>{l}</button>
            ))}
          </div>
          <button className="btn-icon" onClick={fetchAttendance}><RefreshCw size={14} /></button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : view === 'table' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {records.length === 0 ? (
            <div className="empty-state"><CalendarCheck size={48} /><p style={{ marginTop: 12 }}>No attendance records. Click "Seed Demo Data" to generate sample data.</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th><th>Remarks</th></tr>
                </thead>
                <tbody>
                  {records.slice(0, 100).map(r => (
                    <tr key={r._id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{r.employee?.firstName} {r.employee?.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.employee?.employeeCode}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{format(new Date(r.date), 'dd MMM yyyy')}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.checkIn || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.checkOut || '—'}</td>
                      <td style={{ textAlign: 'center' }}>{r.hoursWorked || '—'}</td>
                      <td><span className={`badge badge-${statusColors[r.status] || 'muted'}`}>{r.status}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Grid / calendar view
        <div className="card" style={{ overflowX: 'auto' }}>
          {byEmployee.length === 0 ? (
            <div className="empty-state"><p>No employees found.</p></div>
          ) : (
            <table style={{ tableLayout: 'fixed', minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={{ width: 160, textAlign: 'left' }}>Employee</th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <th key={d} style={{ width: 28, textAlign: 'center', fontSize: 10, padding: '8px 2px' }}>{d}</th>
                  ))}
                  <th style={{ width: 60 }}>P/A</th>
                </tr>
              </thead>
              <tbody>
                {byEmployee.map(emp => (
                  <tr key={emp._id}>
                    <td style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{emp.firstName} {emp.lastName}</td>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                      const s = emp.dayMap[d];
                      const dot = { present: '🟢', absent: '🔴', 'half-day': '🟡', late: '🟠', 'on-leave': '🔵', holiday: '⚪', weekend: '—' }[s] || '·';
                      return <td key={d} style={{ textAlign: 'center', fontSize: 10, padding: '6px 2px' }} title={s || 'no data'}>{dot}</td>;
                    })}
                    <td style={{ textAlign: 'center', fontSize: 11 }}>
                      <span style={{ color: 'var(--success)' }}>{emp.present}</span>/<span style={{ color: 'var(--danger)' }}>{emp.absent}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
