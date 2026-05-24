import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import api from '../utils/api';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      const res = await api.post('/auth/seed');
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Seed failed: ' + err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Background decoration */}
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(34,211,165,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, background: 'var(--accent)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 40px rgba(108,99,255,0.4)', fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'white' }}>P</div>
          <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: -0.5 }}>PayrollPro</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>Sign in to your workspace</p>
        </div>

        <div className="card" style={{ borderColor: 'var(--border)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="admin@payroll.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 4, padding: '13px 20px' }}>
              {loading ? <div className="spinner" /> : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div style={{ marginTop: 20, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Demo Credentials</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[['Admin', 'admin@payroll.com', 'admin123'], ['HR', 'hr@payroll.com', 'hr12345']].map(([role, email, pwd]) => (
              <button key={role} onClick={() => setForm({ email, password: pwd })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                <span><strong style={{ color: 'var(--accent-light)' }}>{role}</strong> — {email}</span>
                <span style={{ color: 'var(--text-muted)' }}>{pwd}</span>
              </button>
            ))}
          </div>
          <button onClick={handleSeed} style={{ marginTop: 12, width: '100%', background: 'var(--success-dim)', border: '1px solid rgba(34,211,165,0.2)', borderRadius: 8, padding: '8px', color: 'var(--success)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            🌱 Seed Demo Data First
          </button>
        </div>
      </div>
    </div>
  );
}
