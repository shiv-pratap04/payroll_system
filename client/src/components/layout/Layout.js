import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, IndianRupee, CalendarCheck,
  Building2, LogOut, Menu, X, ChevronRight, Bell, Settings
} from 'lucide-react';
import './Layout.css';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/payroll', icon: IndianRupee, label: 'Payroll' },
  { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/departments', icon: Building2, label: 'Departments' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`layout ${collapsed ? 'layout--collapsed' : ''}`}>
      {mobileOpen && <div className="layout__overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <div className="sidebar__logo-icon">P</div>
            {!collapsed && <span className="sidebar__logo-text">PayrollPro</span>}
          </div>
          <button className="sidebar__toggle desktop-only" onClick={() => setCollapsed(!collapsed)}>
            <ChevronRight size={16} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`} onClick={() => setMobileOpen(false)}>
              <Icon size={18} className="sidebar__icon" />
              {!collapsed && <span className="sidebar__label">{label}</span>}
              {!collapsed && <span className="sidebar__indicator" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
            {!collapsed && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{user?.name}</span>
                <span className="sidebar__user-role">{user?.role}</span>
              </div>
            )}
          </div>
          <button className="sidebar__logout btn-icon" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="layout__main">
        <header className="layout__topbar">
          <button className="btn-icon mobile-only" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="layout__topbar-right">
            <button className="btn-icon"><Bell size={18} /></button>
            <button className="btn-icon"><Settings size={18} /></button>
            <div className="topbar__user">
              <div className="sidebar__avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{user?.name?.charAt(0)?.toUpperCase()}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
              </div>
            </div>
          </div>
        </header>
        <div className="layout__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
