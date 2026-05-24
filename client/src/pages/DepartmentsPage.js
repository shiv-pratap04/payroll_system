import React, { useState, useEffect } from 'react';
import { Plus, Building2, Edit, Trash2, Users, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dRes, eRes] = await Promise.all([
        api.get('/departments'),
        api.get('/employees', { params: { limit: 200 } }),
      ]);
      setDepartments(dRes.data);
      setEmployees(eRes.data.employees);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openModal = (dept = null) => {
    setEditDept(dept);
    setForm(dept ? { name: dept.name, code: dept.code, description: dept.description || '' } : { name: '', code: '', description: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) return toast.error('Name and Code are required');
    setSaving(true);
    try {
      if (editDept) {
        await api.put(`/departments/${editDept._id}`, form);
        toast.success('Department updated');
      } else {
        await api.post('/departments', form);
        toast.success('Department created');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try {
      await api.delete(`/departments/${id}`);
      toast.success('Department deactivated');
      fetchAll();
    } catch { toast.error('Delete failed'); }
  };

  const empCount = (deptId) => employees.filter(e => (e.department?._id || e.department) === deptId && e.status === 'active').length;

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, letterSpacing: -0.5 }}>Departments</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{departments.length} active departments</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Add Department
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : departments.length === 0 ? (
        <div className="empty-state"><Building2 size={48} /><p style={{ marginTop: 12 }}>No departments yet. Create one to get started.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {departments.map(dept => {
            const count = empCount(dept._id);
            const colors = ['var(--accent)', 'var(--success)', 'var(--warning)', 'var(--info)', 'var(--danger)'];
            const color = colors[departments.indexOf(dept) % colors.length];
            return (
              <div key={dept._id} className="card" style={{ position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '12px 12px 0 0' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={20} style={{ color }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, color: 'var(--text-primary)' }}>{dept.name}</h3>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>{dept.code}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-icon" style={{ padding: 6 }} onClick={() => openModal(dept)}><Edit size={13} /></button>
                    <button className="btn-icon" style={{ padding: 6, color: 'var(--danger)' }} onClick={() => handleDelete(dept._id, dept.name)}><Trash2 size={13} /></button>
                  </div>
                </div>

                {dept.description && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>{dept.description}</p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
                  <Users size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{count}</strong> active employee{count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 440, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
              <h2 style={{ fontSize: 18 }}>{editDept ? 'Edit Department' : 'New Department'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Department Name</label>
                <input placeholder="e.g. Engineering" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Department Code</label>
                <input placeholder="e.g. ENG" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} maxLength={6} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Brief description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-light)' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <div className="spinner" /> : <><Save size={14} /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
