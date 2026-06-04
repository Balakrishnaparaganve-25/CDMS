import React, { useState, useEffect } from 'react';
import api from '../api.js';

const TABS = [
  { id: 'profile', label: 'My Profile', icon: '\uD83D\uDC64' },
  { id: 'marks', label: 'Marks & GPA', icon: '\uD83D\uDCCA' },

  { id: 'notifications', label: 'Notifications', icon: '\uD83D\uDD14' },
];



function Sidebar({ activeTab, onTabChange, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon small">&#x2B21;</div>
        <span>EduCore</span>
      </div>
      <nav className="sidebar-nav">
        {TABS.map((t) => (
          <button key={t.id} className={`nav-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => onTabChange(t.id)}>
            <span className="nav-icon">{t.icon}</span>
            <span>{t.label}</span>
            {t.id === 'notifications' && <span className="badge">3</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer" />
    </aside>
  );
}



export default function StudentDashboard({ onLogout }) {

  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [results, setResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);



  useEffect(() => {
    if (activeTab === 'profile') fetchProfile();
    if (activeTab === 'marks') fetchResults();
    if (activeTab === 'notifications') fetchNotifications();

  }, [activeTab]);




  const fetchProfile = async () => {
    try {
      const res = await api.get('/student/profile');
      setProfile(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchResults = async () => {
    try {
      const res = await api.get('/student/results');
      setResults(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/student/notifications');
      setNotifications(res.data);
    } catch (err) { console.error(err); }
  };




  const tabTitle = TABS.find(t => t.id === activeTab)?.label || '';


  useEffect(() => {
    const onDoc = (e) => {
      if (!showProfileMenu) return;
      const target = e.target;
      if (target && target.closest && target.closest('[data-profile-menu]')) return;
      setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showProfileMenu]);

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={onLogout} />
      <div className="main-content">
        <header className="topbar">
          <div className="page-heading">{tabTitle}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>

              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={showProfileMenu}
                data-profile-menu-toggle
                onClick={() => setShowProfileMenu((v) => !v)}
                style={{ all: 'unset', cursor: 'pointer' }}
              >
                <div className="avatar">{profile?.full_name?.split(' ').map(n=>n[0]).join('') || 'ST'}</div>
              </button>
              {showProfileMenu && (
                <div
                  data-profile-menu
                  role="menu"
                  style={{
                    position: 'absolute',
                    right: 0,
                    left: 'auto',
                    top: 'calc(100% + 0.25rem)',
                    minWidth: '160px',
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-sm)',
                    zIndex: 300,
                    padding: '0.35rem',
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setShowProfileMenu(false); onLogout(); }}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-red)',
                      fontWeight: 700,
                      padding: '0.7rem 0.75rem',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(242, 100, 100, 0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{profile?.full_name || 'Student'}</span>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'profile' && (
            <>
              <div className="content-card">
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'center', padding: '1.5rem', borderRight: '1px solid var(--border-soft)' }}>
                    <div className="avatar" style={{ width: '90px', height: '90px', fontSize: '1.8rem', margin: '0 auto 1rem' }}>
                      {profile?.full_name?.split(' ').map(n=>n[0]).join('') || 'ST'}
                    </div>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '0.3rem' }}>{profile?.full_name || 'Loading...'}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                      {profile?.department || 'Department'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.2rem' }}>
                      <span className="status-badge verified">{profile?.semester ? `Semester ${profile.semester}` : 'Active'}</span>
                    </div>
                    <div className="info-grid" style={{ textAlign: 'left' }}>
                      <div className="info-item"><span className="info-label">Student ID</span><span className="info-value">{profile?.student_id}</span></div>
                      <div className="info-item"><span className="info-label">Department</span><span className="info-value">{profile?.department}</span></div>
                      <div className="info-item"><span className="info-label">Semester</span><span className="info-value">{profile?.semester}</span></div>
                      <div className="info-item"><span className="info-label">Academic Year</span><span className="info-value">{profile?.academic_year || '2024-25'}</span></div>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personal Details</h4>
                    <div className="info-grid">
                      <div className="info-item"><span className="info-label">Email</span><span className="info-value">{profile?.email || '—'}</span></div>
                      <div className="info-item"><span className="info-label">Phone</span><span className="info-value">{profile?.phone || '—'}</span></div>
                      <div className="info-item"><span className="info-label">Date of Birth</span><span className="info-value">{profile?.dob ? new Date(profile.dob).toLocaleDateString() : '—'}</span></div>
                      <div className="info-item"><span className="info-label">Gender</span><span className="info-value">{profile?.gender || '—'}</span></div>
                      <div className="info-item"><span className="info-label">Address</span><span className="info-value">{profile?.address || '—'}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'marks' && (
            <>
              <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card"><span className="stat-label">Subjects</span><span className="stat-value blue">{results.length}</span></div>
                <div className="stat-card"><span className="stat-label">Avg Score</span><span className="stat-value teal">{results.length ? (results.reduce((a,r)=>a+r.total_marks,0)/results.length).toFixed(1) : '0'}</span></div>
                <div className="stat-card"><span className="stat-label">Highest Grade</span><span className="stat-value gold">{results.length ? results.reduce((best,r)=>r.grade<best?r.grade:best, results[0].grade) : '—'}</span></div>
                <div className="stat-card"><span className="stat-label">Status</span><span className="stat-value purple">{results.every(r=>r.status==='published')?'Published':'Pending'}</span></div>
              </div>
              <div className="content-card">
                <div className="card-header"><span className="card-title">Subject-wise Results</span></div>
                <table className="data-table">
                  <thead><tr><th>Subject</th><th>Code</th><th>Semester</th><th>Internal</th><th>External</th><th>Total</th><th>Grade</th><th>Status</th></tr></thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.id}>
                        <td>{r.subject_name}</td><td>{r.subject_code}</td><td>{r.semester}</td>
                        <td>{r.internal_marks}/{r.max_internal}</td><td>{r.external_marks}/{r.max_external}</td>
                        <td>{r.total_marks}</td><td>{r.grade}</td>
                        <td><span className={`status-badge ${r.status}`}>{r.status}</span></td>
                      </tr>
                    ))}
                    {results.length === 0 && <tr><td colSpan={8} style={{textAlign:'center',color:'var(--text-muted)',padding:'2rem'}}>No results published yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}





          {activeTab === 'notifications' && (
            <>
              {notifications.map((n) => (
                <div key={n.id} className={`notif ${n.type}`}>
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-body">{n.message}</div>
                  <div className="notif-meta">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                </div>
              ))}
              {notifications.length === 0 && <div className="empty-state"><div className="empty-state-icon">\uD83D\uDD14</div><div className="empty-state-text">No notifications yet.</div></div>}
            </>
          )}

        </div>

      </div>
    </div>
  );
}

