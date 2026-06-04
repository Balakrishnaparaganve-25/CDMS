import React, { useState, useEffect } from 'react';
import api from '../api.js';


  const TABS = [
  { id: 'overview', label: 'Overview', icon: '\uD83D\uDCCA' },
  { id: 'results', label: 'Results', icon: '\uD83D\uDCCB' },

  { id: 'updates', label: 'Updates', icon: '\uD83D\uDD14' },
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
            {t.id === 'updates' && <span className="badge">2</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer" />
    </aside>
  );
}



export default function ExamDashboard({ onLogout }) {

  const [activeTab, setActiveTab] = useState('overview');

  const [pendingResults, setPendingResults] = useState([]);

  const [showProfileMenu, setShowProfileMenu] = useState(false);



  const [allResults, setAllResults] = useState([]);

  const [selectedResults, setSelectedResults] = useState(new Set());
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([]);





  useEffect(() => {
    if (activeTab === 'results' || activeTab === 'overview') { fetchPending(); fetchAll(); }
    if (activeTab === 'updates') fetchNotifications();
  }, [activeTab]);




  const fetchPending = async () => {
    try { const res = await api.get('/exam/results/pending'); setPendingResults(res.data); }
    catch (err) { console.error(err); }
  };

  const fetchAll = async () => {
    try { const res = await api.get('/exam/results/all'); setAllResults(res.data); }
    catch (err) { console.error(err); }
  };

  const fetchNotifications = async () => {
    try { const res = await api.get('/student/notifications'); setNotifications(res.data); }
    catch (err) { console.error(err); }
  };

  const verifyResult = async (id) => {
    try {
      await api.post(`/exam/results/${id}/verify`);
      fetchPending(); fetchAll();
      setMessage('Result verified');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert(err.response?.data?.detail || 'Verification failed'); }
  };

  const publishResult = async (id) => {
    try {
      await api.post(`/exam/results/${id}/publish`);
      fetchPending(); fetchAll();
      setMessage('Result published');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert(err.response?.data?.detail || 'Publish failed'); }
  };

  const publishBatch = async () => {
    const ids = Array.from(selectedResults);
    if (!ids.length) return alert('Select results to publish');
    try {
      await api.post('/exam/results/publish-batch', ids);
      setSelectedResults(new Set());
      fetchPending(); fetchAll();
      setMessage(`${ids.length} result(s) published`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert(err.response?.data?.detail || 'Batch publish failed'); }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedResults);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedResults(next);
  };

  const postUpdate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.post('/api/admin/notifications', {
        title: fd.get('title'),
        message: fd.get('message'),
        type: fd.get('type') || 'info',
        target_role: fd.get('target_role') || 'all',
      });
      e.target.reset();
      fetchNotifications();
      setMessage('Update posted');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage(err.response?.data?.detail || 'Failed'); }
  };

  const verifiedCount = allResults.filter(r => r.status === 'verified').length;
  const publishedCount = allResults.filter(r => r.status === 'published').length;

  const tabTitle = TABS.find(t => t.id === activeTab)?.label || '';

  useEffect(() => {
    const onDoc = (e) => {
      if (!showProfileMenu) return;
      const target = e.target;
      if (target && target.closest && (target.closest('[data-profile-menu]') || target.closest('[data-profile-menu-toggle]'))) return;
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
                <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--accent-purple), #7c3aed)' }}>EX</div>
              </button>
              {showProfileMenu && (
                <div
                  data-profile-menu
                  role="menu"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 0.6rem)',
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
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Exam Department</span>
          </div>
        </header>

        <div className="content-area">
          {message && <div className="login-error success" style={{ marginBottom: '1rem' }}>{message}</div>}

          {activeTab === 'overview' && (
            <>
              <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card"><span className="stat-label">Pending</span><span className="stat-value blue">{pendingResults.length}</span></div>
                <div className="stat-card"><span className="stat-label">Verified</span><span className="stat-value teal">{verifiedCount}</span></div>
                <div className="stat-card"><span className="stat-label">Published</span><span className="stat-value gold">{publishedCount}</span></div>
                <div className="stat-card"><span className="stat-label">Total</span><span className="stat-value purple">{allResults.length}</span></div>
              </div>
              <div className="content-card">
                <div className="card-header"><span className="card-title">Examination Status</span></div>
                <div className="info-grid">
                  <div className="info-item"><span className="info-label">Seating Arrangement</span><span className="info-value">Done</span></div>
                  <div className="info-item"><span className="info-label">Question Papers</span><span className="info-value">Ready</span></div>
                  <div className="info-item"><span className="info-label">Invigilators</span><span className="info-value">Assigned</span></div>
                </div>
              </div>
            </>
          )}



          {activeTab === 'results' && (
            <>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={publishBatch} disabled={!selectedResults.size}>Publish Selected ({selectedResults.size})</button>
              </div>

              <div className="content-card">
                <div className="card-header"><span className="card-title">Pending Verification</span></div>
                <table className="data-table">
                  <thead><tr><th>Student</th><th>Subject</th><th>Sem</th><th>Internal</th><th>External</th><th>Total</th><th>Grade</th><th>Actions</th></tr></thead>
                  <tbody>
                    {pendingResults.map((r) => (
                      <tr key={r.result_id}>
                        <td>{r.full_name}</td><td>{r.subject_name}</td><td>{r.semester}</td>
                        <td>{r.internal_marks}</td><td>{r.external_marks}</td><td>{r.total_marks}</td><td>{r.grade}</td>
                        <td className="action-cell">
                          <button className="btn-sm" onClick={() => verifyResult(r.result_id)}>Verify</button>
                        </td>
                      </tr>
                    ))}
                    {pendingResults.length === 0 && <tr><td colSpan={8} style={{textAlign:'center',color:'var(--text-muted)',padding:'2rem'}}>No pending results.</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="content-card">
                <div className="card-header"><span className="card-title">All Results</span></div>
                <table className="data-table">
                  <thead><tr><th><input type="checkbox" onChange={(e) => {
                    if (e.target.checked) setSelectedResults(new Set(allResults.filter(r=>r.status==='verified').map(r=>r.result_id)));
                    else setSelectedResults(new Set());
                  }} /></th><th>Student</th><th>Subject</th><th>Sem</th><th>Total</th><th>Grade</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {allResults.map((r) => (
                      <tr key={r.result_id}>
                        <td>{r.status === 'verified' && <input type="checkbox" checked={selectedResults.has(r.result_id)} onChange={() => toggleSelect(r.result_id)} />}</td>
                        <td>{r.full_name}</td><td>{r.subject_name}</td><td>{r.semester}</td><td>{r.total_marks}</td><td>{r.grade}</td>
                        <td><span className={`status-badge ${r.status}`}>{r.status}</span></td>
                        <td className="action-cell">
                          {r.status === 'verified' && <button className="btn-sm" onClick={() => publishResult(r.result_id)}>Publish</button>}
                        </td>
                      </tr>
                    ))}
                    {allResults.length === 0 && <tr><td colSpan={8} style={{textAlign:'center',color:'var(--text-muted)',padding:'2rem'}}>No results.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}





          {activeTab === 'updates' && (
            <>
              <div className="content-card">

                <div className="card-header"><span className="card-title">Post Update</span></div>
                <form onSubmit={postUpdate}>
                  <div className="form-group"><label className="form-label">Title</label><input name="title" className="form-input" required /></div>
                  <div className="form-group"><label className="form-label">Message</label><textarea name="message" className="form-input" rows={4} required></textarea></div>
                  <div className="form-group"><label className="form-label">Type</label><select name="type" className="form-input"><option>info</option><option>warning</option><option>urgent</option></select></div>
<div className="form-group"><label className="form-label">Target</label><select name="target_role" className="form-input"><option value="all">All</option><option value="student">Students</option></select></div>
                  <button type="submit" className="btn-primary">Post Update</button>
                </form>
              </div>
              <div className="content-card">
                <div className="card-header"><span className="card-title">Recent Updates</span></div>
                {notifications.slice(0, 10).map((n) => (
                  <div key={n.id} className={`notif ${n.type}`} style={{ position: 'relative' }}>
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-body">{n.message}</div>
                    <div className="notif-meta">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                    <button
                      className="btn-sm danger"
                      type="button"
                      style={{ position: 'absolute', right: '0.5rem', top: '0.5rem' }}
                      onClick={async () => {
                        if (!confirm('Delete this announcement?')) return;
                        try {
                          await api.delete(`/api/announcements/${n.id}`);
                          fetchNotifications();
                        } catch (err) {
                          alert(err.response?.data?.detail || 'Delete failed');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

