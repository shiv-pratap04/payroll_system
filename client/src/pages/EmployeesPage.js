import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Eye, Edit, MoreVertical, UserCheck, UserX, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import EmployeeModal from '../components/employees/EmployeeModal';

const statusColors = { active: 'success', inactive: 'muted', 'on-leave': 'warning', terminated: 'danger' };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterDept) params.department = filterDept;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/employees', { params });
      setEmployees(res.data.employees);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [search, filterDept, filterStatus]);

  useEffect(() => {
    api.get('/departments').then(r => setDepartments(r.data));
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(t);
  }, [fetchEmployees]);

  const handleSaved = () => { setShowModal(false); setEditEmployee(null); fetchEmployees(); };

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, letterSpacing: -0.5 }}>Employees</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{total} total employees</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditEmployee(null); setShowModal(true); }}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input placeholder="Search name, email, code..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ flex: '0 1 180px' }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: '0 1 150px' }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on-leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>
        ) : employees.length === 0 ? (
          <div className="empty-state"><UserCheck size={48} /><p style={{ marginTop: 8 }}>No employees found.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th><th>Department</th><th>Designation</th><th>Contact</th><th>Gross Salary</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp._id} style={{ cursor: 'pointer' }}>
                    <td onClick={() => navigate(`/employees/${emp._id}`)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent-light)' }}>
                          {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>{emp.firstName} {emp.lastName}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{emp.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.department?.name || '—'}</td>
                    <td>{emp.designation}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} color="var(--text-muted)" />{emp.email}</span>
                        {emp.phone && <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} color="var(--text-muted)" />{emp.phone}</span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{Number(emp.grossSalary || 0).toLocaleString('en-IN')}</td>
                    <td><span className={`badge badge-${statusColors[emp.status] || 'muted'}`}>{emp.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon btn-sm" onClick={() => navigate(`/employees/${emp._id}`)} title="View"><Eye size={14} /></button>
                        <button className="btn-icon btn-sm" onClick={() => { setEditEmployee(emp); setShowModal(true); }} title="Edit"><Edit size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <EmployeeModal employee={editEmployee} departments={departments} onClose={() => { setShowModal(false); setEditEmployee(null); }} onSaved={handleSaved} />}
    </div>
  );
}
