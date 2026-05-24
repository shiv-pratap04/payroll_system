import React, { useState, useEffect, useCallback } from 'react';
import { Play, CheckCircle, Clock, DollarSign, Filter, RefreshCw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { format } from 'date-fns';

const statusColors = { draft: 'muted', processed: 'info', paid: 'success', cancelled: 'danger' };
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [total, setTotal] = useState(0);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll', { params: { month, year, status: filterStatus || undefined } });
      setPayrolls(res.data.payrolls);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load payroll'); }
    finally { setLoading(false); }
  }, [month, year, filterStatus]);

  useEffect(() => { fetchPayrolls(); }, [fetchPayrolls]);

  const generatePayroll = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/payroll/generate', { month, year });
      toast.success(`Payroll generated: ${res.data.results.filter(r => r.status === 'generated').length} records`);
      fetchPayrolls();
    } catch (err) { toast.error(err.response?.data?.message || 'Generation failed'); }
    finally { setGenerating(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/payroll/${id}/status`, { status, paymentDate: status === 'paid' ? new Date() : undefined, paymentMode: 'bank-transfer' });
      toast.success(`Status updated to ${status}`);
      fetchPayrolls();
      if (selected?._id === id) setSelected(prev => ({ ...prev, status }));
    } catch { toast.error('Update failed'); }
  };

  const totalNet = payrolls.reduce((s, p) => s + p.netSalary, 0);
  const paidCount = payrolls.filter(p => p.status === 'paid').length;

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, letterSpacing: -0.5 }}>Payroll</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{months[month - 1]} {year}</p>
        </div>
        <button className="btn btn-primary" onClick={generatePayroll} disabled={generating}>
          {generating ? <div className="spinner" /> : <Play size={15} />}
          Generate Payroll
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          ['Total Records', total, 'var(--accent)'],
          ['Total Payout', `₹${(totalNet / 100000).toFixed(2)}L`, 'var(--success)'],
          ['Paid', paidCount, 'var(--info)'],
          ['Pending', total - paidCount, 'var(--warning)'],
        ].map(([label, val, color]) => (
          <div key={label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ flex: '0 1 160px' }}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ flex: '0 1 110px' }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: '0 1 140px' }}>
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="processed">Processed</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={fetchPayrolls}><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Payroll table + detail pane */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: 16 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>
          ) : payrolls.length === 0 ? (
            <div className="empty-state"><DollarSign size={48} /><p style={{ marginTop: 12 }}>No payroll records for this period.<br />Click "Generate Payroll" to create them.</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr><th>Employee</th><th>Dept</th><th>Working Days</th><th>Present</th><th>Gross</th><th>Deductions</th><th>Net Salary</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {payrolls.map(p => (
                    <tr key={p._id} style={{ cursor: 'pointer', background: selected?._id === p._id ? 'var(--accent-dim)' : undefined }}>
                      <td onClick={() => setSelected(selected?._id === p._id ? null : p)}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{p.employee?.firstName} {p.employee?.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.employee?.employeeCode}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{p.employee?.department?.name || '—'}</td>
                      <td style={{ textAlign: 'center' }}>{p.workingDays}</td>
                      <td style={{ textAlign: 'center' }}><span style={{ color: p.presentDays === p.workingDays ? 'var(--success)' : 'var(--text-primary)' }}>{p.presentDays}</span></td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>₹{Number(p.grossEarnings).toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--danger)' }}>-₹{Number(p.totalDeductions).toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>₹{Number(p.netSalary).toLocaleString('en-IN')}</td>
                      <td><span className={`badge badge-${statusColors[p.status]}`}>{p.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {p.status === 'draft' && <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(p._id, 'processed')}>Process</button>}
                          {p.status === 'processed' && <button className="btn btn-sm" style={{ background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(34,211,165,0.2)' }} onClick={() => updateStatus(p._id, 'paid')}>Mark Paid</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail pane */}
        {selected && (
          <div className="card" style={{ alignSelf: 'start', animation: 'slideIn 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15 }}>Pay Slip</h3>
              <button className="btn-icon" style={{ padding: 4 }} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.employee?.firstName} {selected.employee?.lastName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selected.payPeriod}</div>
              <span className={`badge badge-${statusColors[selected.status]}`} style={{ marginTop: 6 }}>{selected.status}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Earnings</div>
              {Object.entries(selected.earnings || {}).filter(([,v]) => v > 0).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span style={{ color: 'var(--text-primary)' }}>₹{Number(v).toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: 6, marginTop: 2 }}>
                <span style={{ fontWeight: 600, fontSize: 12 }}>Gross Earnings</span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹{Number(selected.grossEarnings).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Deductions</div>
              {Object.entries(selected.deductions || {}).filter(([,v]) => v > 0).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span style={{ color: 'var(--danger)' }}>-₹{Number(v).toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: 6, marginTop: 2 }}>
                <span style={{ fontWeight: 600, fontSize: 12 }}>Total Deductions</span>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>-₹{Number(selected.totalDeductions).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div style={{ background: 'var(--success-dim)', border: '1px solid rgba(34,211,165,0.2)', borderRadius: 8, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Net Salary</div>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--success)', marginTop: 4 }}>₹{Number(selected.netSalary).toLocaleString('en-IN')}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
