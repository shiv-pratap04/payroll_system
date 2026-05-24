import React, { useState, useEffect } from 'react';
import { X, Save, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const tabs = ['Basic Info', 'Salary', 'Deductions', 'Bank Details'];

export default function EmployeeModal({ employee, departments, onClose, onSaved }) {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', department: '', designation: '',
    employmentType: 'full-time', joiningDate: '', gender: 'male', status: 'active',
    salary: { basic: 0, hra: 0, da: 0, specialAllowance: 0, medicalAllowance: 1250, transportAllowance: 800 },
    deductions: { pf: 0, esi: 0, tds: 0, professionalTax: 200, loanDeduction: 0 },
    bankDetails: { accountNumber: '', bankName: '', ifscCode: '', accountHolderName: '' },
    address: { street: '', city: '', state: '', pincode: '' },
  });

  useEffect(() => {
    if (employee) {
      setForm({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department?._id || employee.department || '',
        designation: employee.designation || '',
        employmentType: employee.employmentType || 'full-time',
        joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : '',
        gender: employee.gender || 'male',
        status: employee.status || 'active',
        salary: { basic: 0, hra: 0, da: 0, specialAllowance: 0, medicalAllowance: 1250, transportAllowance: 800, ...employee.salary },
        deductions: { pf: 0, esi: 0, tds: 0, professionalTax: 200, loanDeduction: 0, ...employee.deductions },
        bankDetails: { accountNumber: '', bankName: '', ifscCode: '', accountHolderName: '', ...employee.bankDetails },
        address: { street: '', city: '', state: '', pincode: '', ...employee.address },
      });
    }
  }, [employee]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setNested = (section, key, val) => setForm(f => ({ ...f, [section]: { ...f[section], [key]: key === 'accountNumber' || key === 'ifscCode' ? val : Number(val) || val } }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (employee) {
        await api.put(`/employees/${employee._id}`, form);
        toast.success('Employee updated!');
      } else {
        await api.post('/employees', form);
        toast.success('Employee added!');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const inp = (label, value, onChange, props = {}) => (
    <div className="form-group">
      <label>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} {...props} />
    </div>
  );
  const sel = (label, value, onChange, options) => (
    <div className="form-group">
      <label>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  const grid = (children) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>;

  const tabContent = [
    // Basic Info
    <>
      {grid(<>
        {inp('First Name', form.firstName, v => set('firstName', v), { placeholder: 'Arjun' })}
        {inp('Last Name', form.lastName, v => set('lastName', v), { placeholder: 'Sharma' })}
        {inp('Email', form.email, v => set('email', v), { type: 'email', placeholder: 'arjun@company.com' })}
        {inp('Phone', form.phone, v => set('phone', v), { placeholder: '+91 98765 43210' })}
      </>)}
      {grid(<>
        <div className="form-group">
          <label>Department</label>
          <select value={form.department} onChange={e => set('department', e.target.value)}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
        {inp('Designation', form.designation, v => set('designation', v), { placeholder: 'Senior Developer' })}
        {sel('Employment Type', form.employmentType, v => set('employmentType', v), [['full-time','Full Time'],['part-time','Part Time'],['contract','Contract'],['intern','Intern']])}
        {inp('Joining Date', form.joiningDate, v => set('joiningDate', v), { type: 'date' })}
        {sel('Gender', form.gender, v => set('gender', v), [['male','Male'],['female','Female'],['other','Other']])}
        {sel('Status', form.status, v => set('status', v), [['active','Active'],['inactive','Inactive'],['on-leave','On Leave'],['terminated','Terminated']])}
      </>)}
    </>,
    // Salary
    <>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Monthly salary components (INR)</p>
      {grid(<>
        {inp('Basic Salary', form.salary.basic, v => setNested('salary','basic',v), { type: 'number' })}
        {inp('HRA', form.salary.hra, v => setNested('salary','hra',v), { type: 'number' })}
        {inp('Dearness Allowance (DA)', form.salary.da, v => setNested('salary','da',v), { type: 'number' })}
        {inp('Special Allowance', form.salary.specialAllowance, v => setNested('salary','specialAllowance',v), { type: 'number' })}
        {inp('Medical Allowance', form.salary.medicalAllowance, v => setNested('salary','medicalAllowance',v), { type: 'number' })}
        {inp('Transport Allowance', form.salary.transportAllowance, v => setNested('salary','transportAllowance',v), { type: 'number' })}
      </>)}
      <div style={{ background: 'var(--success-dim)', border: '1px solid rgba(34,211,165,0.2)', borderRadius: 8, padding: '12px 16px', marginTop: 14 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Gross Salary: </span>
        <span style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--success)' }}>
          ₹{Object.values(form.salary).reduce((a, b) => a + (Number(b) || 0), 0).toLocaleString('en-IN')}
        </span>
      </div>
    </>,
    // Deductions
    <>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Monthly deductions (INR)</p>
      {grid(<>
        {inp('Provident Fund (PF)', form.deductions.pf, v => setNested('deductions','pf',v), { type: 'number' })}
        {inp('ESI', form.deductions.esi, v => setNested('deductions','esi',v), { type: 'number' })}
        {inp('TDS / Income Tax', form.deductions.tds, v => setNested('deductions','tds',v), { type: 'number' })}
        {inp('Professional Tax', form.deductions.professionalTax, v => setNested('deductions','professionalTax',v), { type: 'number' })}
        {inp('Loan Deduction', form.deductions.loanDeduction, v => setNested('deductions','loanDeduction',v), { type: 'number' })}
      </>)}
    </>,
    // Bank Details
    <>
      {grid(<>
        {inp('Account Number', form.bankDetails.accountNumber, v => setNested('bankDetails','accountNumber',v))}
        {inp('Bank Name', form.bankDetails.bankName, v => setNested('bankDetails','bankName',v), { placeholder: 'SBI' })}
        {inp('IFSC Code', form.bankDetails.ifscCode, v => setNested('bankDetails','ifscCode',v), { placeholder: 'SBIN0001234' })}
        {inp('Account Holder Name', form.bankDetails.accountHolderName, v => setNested('bankDetails','accountHolderName',v))}
      </>)}
    </>,
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', z: 1000, padding: 20, zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: 18 }}>{employee ? 'Edit Employee' : 'Add Employee'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', padding: '0 24px' }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{ padding: '12px 16px', background: 'none', color: activeTab === i ? 'var(--accent-light)' : 'var(--text-muted)', borderBottom: `2px solid ${activeTab === i ? 'var(--accent)' : 'transparent'}`, fontSize: 13, fontWeight: activeTab === i ? 600 : 400, transition: 'all 0.2s' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tabContent[activeTab]}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-light)' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {activeTab < tabs.length - 1
            ? <button className="btn btn-primary" onClick={() => setActiveTab(t => t + 1)}>Next <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} /></button>
            : <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? <div className="spinner" /> : <><Save size={14} /> Save Employee</>}</button>
          }
        </div>
      </div>
    </div>
  );
}
