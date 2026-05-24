import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, Briefcase, IndianRupee, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import EmployeeModal from '../components/employees/EmployeeModal';
import { format } from 'date-fns';

const Section = ({ title, children }) => (
  <div className="card" style={{ marginBottom: 16 }}>
    <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'var(--font-display)' }}>{title}</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>{children}</div>
  </div>
);

const Field = ({ label, value, mono }) => (
  <div>
    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: mono ? 'monospace' : undefined }}>{value || '—'}</div>
  </div>
);

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const fetchEmployee = () => {
    api.get(`/employees/${id}`).then(r => setEmployee(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployee();
    api.get('/departments').then(r => setDepartments(r.data));
  }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  if (!employee) return <div className="empty-state"><p>Employee not found</p></div>;

  const gross = employee.grossSalary || 0;
  const net = gross - (employee.totalDeductions || 0);

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn-icon" onClick={() => navigate('/employees')}><ArrowLeft size={18} /></button>
        <div>
          <h1 style={{ fontSize: 24, letterSpacing: -0.5 }}>{employee.firstName} {employee.lastName}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{employee.employeeCode} · {employee.designation}</p>
        </div>
        <button className="btn btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setShowEdit(true)}>
          <Edit size={14} /> Edit
        </button>
      </div>

      {/* Profile header card */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-dim)', border: '2px solid rgba(108,99,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent-light)' }}>
          {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 20 }}>{employee.firstName} {employee.lastName}</h2>
            <span className={`badge badge-${employee.status === 'active' ? 'success' : 'muted'}`}>{employee.status}</span>
            <span className="badge badge-accent">{employee.employmentType}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 13 }}>{employee.designation} · {employee.department?.name}</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            {employee.email && <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={12} />{employee.email}</span>}
            {employee.phone && <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={12} />{employee.phone}</span>}
            {employee.joiningDate && <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={12} />Joined {format(new Date(employee.joiningDate), 'MMM d, yyyy')}</span>}
          </div>
        </div>
        {/* Salary summary */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[['Gross', gross, 'var(--success)'], ['Net', net, 'var(--info)']].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{l} Salary</div>
              <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 800, color: c }}>₹{Number(v).toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>
      </div>

      <Section title="Earnings Breakdown">
        {Object.entries(employee.salary || {}).map(([k, v]) => (
          <Field key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={`₹${Number(v).toLocaleString('en-IN')}`} />
        ))}
      </Section>

      <Section title="Deductions">
        {Object.entries(employee.deductions || {}).map(([k, v]) => (
          <Field key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={`₹${Number(v).toLocaleString('en-IN')}`} />
        ))}
      </Section>

      {employee.bankDetails?.accountNumber && (
        <Section title="Bank Details">
          <Field label="Account Number" value={employee.bankDetails.accountNumber} mono />
          <Field label="Bank Name" value={employee.bankDetails.bankName} />
          <Field label="IFSC Code" value={employee.bankDetails.ifscCode} mono />
          <Field label="Account Holder" value={employee.bankDetails.accountHolderName} />
        </Section>
      )}

      {showEdit && <EmployeeModal employee={employee} departments={departments} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); fetchEmployee(); }} />}
    </div>
  );
}
