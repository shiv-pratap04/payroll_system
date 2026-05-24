import React, { useState, useEffect } from 'react';
import { Users, IndianRupee, CheckCircle, Building2, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../utils/api';
import { format } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, sub, color, trend }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
    onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.08 }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</span>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: color, opacity: 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>
    <div>
      <div style={{ fontSize: 30, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  </div>
);

const COLORS = ['#6c63ff', '#22d3a5', '#f59e0b', '#f43f5e', '#38bdf8'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, fontWeight: 600 }}>₹{Number(p.value).toLocaleString('en-IN')}</p>)}
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  const now = new Date();
  const statCards = [
    { icon: Users, label: 'Total Employees', value: stats?.totalEmployees || 0, sub: `${stats?.activeEmployees || 0} active`, color: 'var(--accent)' },
    { icon: IndianRupee, label: 'Monthly Payroll', value: `₹${((stats?.totalPayroll || 0) / 100000).toFixed(1)}L`, sub: `${stats?.paidCount || 0} paid this month`, color: 'var(--success)' },
    { icon: CheckCircle, label: 'Present Today', value: stats?.presentToday || 0, sub: `of ${stats?.activeEmployees || 0} employees`, color: 'var(--info)' },
    { icon: Building2, label: 'Departments', value: stats?.deptCount || 0, sub: 'Active departments', color: 'var(--warning)' },
  ];

  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, letterSpacing: -0.5 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>{format(now, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statCards.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Bar chart */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 20, color: 'var(--text-primary)' }}>Payroll by Department</h3>
          {stats?.deptPayroll?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.deptPayroll} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="_id" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No payroll data yet. Generate payroll first.</p></div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 20, color: 'var(--text-primary)' }}>Department Distribution</h3>
          {stats?.deptPayroll?.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={stats.deptPayroll} dataKey="count" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {stats.deptPayroll.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.deptPayroll.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], minWidth: 10 }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{d._id || 'N/A'}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state"><p>No department data available.</p></div>
          )}
        </div>
      </div>

      {/* Recent payroll */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15 }}>Recent Payroll Records</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(now, 'MMMM yyyy')}</span>
        </div>
        {stats?.recentPayrolls?.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th><th>Code</th><th>Net Salary</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayrolls.map(p => (
                  <tr key={p._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.employee?.firstName} {p.employee?.lastName}</td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{p.employee?.employeeCode}</span></td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{Number(p.netSalary).toLocaleString('en-IN')}</td>
                    <td><span className={`badge badge-${p.status === 'paid' ? 'success' : p.status === 'processed' ? 'info' : 'muted'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <TrendingUp size={40} />
            <p>No payroll records yet. Go to Payroll to generate payroll.</p>
          </div>
        )}
      </div>
    </div>
  );
}
