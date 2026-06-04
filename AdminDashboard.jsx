import React, { useState, useEffect } from 'react';
import api from '../api.js';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '\uD83D\uDCCA' },
  { id: 'students', label: 'Students', icon: '\uD83C\uDF93' },
  { id: 'marksentry', label: 'Marks Entry', icon: '\u270F\uFE0F' },
  { id: 'announcements', label: 'Announcements', icon: '\uD83D\uDCE2' },
  { id: 'controls', label: 'Controls', icon: '\u2699\uFE0F' },
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
          </button>
        ))}
      </nav>
      <div className="sidebar-footer" />
    </aside>
  );
}

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);



  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');






  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
    if (activeTab === 'marksentry') { fetchStudents(); fetchSubjects(); }
    if (activeTab === 'announcements') fetchNotifications();
  }, [activeTab]);





  const fetchStudents = async () => {
    try { const res = await api.get('/admin/students'); setStudents(res.data); }
    catch (err) { console.error(err); }
  };

  const fetchSubjects = async () => {
    try { const res = await api.get('/admin/subjects'); setSubjects(res.data); }
    catch (err) { console.error(err); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/student/notifications');
      const list = Array.isArray(res.data) ? res.data : [];
      // Ensure newest-first
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(list);
    } catch (err) { console.error(err); }
  };





  const addStudent = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      username: fd.get('username'),
      password: fd.get('password'),
      email: fd.get('email'),
      full_name: fd.get('full_name'),
      student_id: fd.get('student_id'),
      department: fd.get('department'),
      semester: parseInt(fd.get('semester')),
      academic_year: fd.get('academic_year'),
      phone: fd.get('phone'),
    };
    try {
      await api.post('/admin/students', payload);
      setShowModal(false);
      fetchStudents();
      setMessage('Student added successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to add student');
    }
  };

  const deleteStudent = async (id) => {
    if (!confirm('Delete this student?')) return;
    try { await api.delete(`/admin/students/${id}`); fetchStudents(); }
    catch (err) { alert(err.response?.data?.detail || 'Delete failed'); }
  };

  const postAnnouncement = async (e) => {

    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const created = await api.post('/admin/notifications', {
        title: fd.get('title'),
        message: fd.get('message'),
        type: fd.get('type') || 'info',
        target_role: fd.get('target_role') || 'all',
      });

      // Update immediately (no refresh) only after successful publish
      e.target.reset();
      setNotifications((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        const item = created?.data;
        if (item) next.unshift(item);
        return next;
      });

      setMessage('Announcement published');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage(err.response?.data?.detail || 'Failed'); }
  };


  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id.toLowerCase().includes(search.toLowerCase())
  );

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
                <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--accent-gold), #c97a10)' }}>AD</div>
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
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Administrator</span>
          </div>
        </header>

        <div className="content-area">
          {message && <div className="login-error success" style={{ marginBottom: '1rem' }}>{message}</div>}

          {activeTab === 'overview' && (
            <>
              <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card"><span className="stat-label">Total Students</span><span className="stat-value blue">{students.length}</span></div>
                <div className="stat-card"><span className="stat-label">Subjects</span><span className="stat-value teal">{subjects.length}</span></div>
                <div className="stat-card"><span className="stat-label">Departments</span><span className="stat-value gold">5</span></div>
                <div className="stat-card"><span className="stat-label">Notifications</span><span className="stat-value purple">{notifications.length}</span></div>
              </div>
              <div className="content-card">
                <div className="card-header"><span className="card-title">System Overview</span></div>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  Welcome to the EduCore admin dashboard. Use the sidebar to manage students, enter marks, publish announcements, and configure system controls.
                </p>
              </div>
            </>
          )}

          {activeTab === 'students' && (
            <>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input className="form-input" style={{ flex: 1, minWidth: '200px' }} placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch('/api/admin/students/download', {
                        method: 'GET',
                        headers: {
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                      });
                      if (!res.ok) {
                        const text = await res.text();
                        throw new Error(text || 'Download failed');
                      }
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'student_list.csv';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      alert(err.message || 'Download failed');
                    }
                  }}
                >
                  Download Student List
                </button>
              </div>

              <div className="content-card">
                <table className="data-table">
                  <thead><tr><th>Student ID</th><th>Name</th><th>Department</th><th>Semester</th><th>Email</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.id}>
                        <td>{s.student_id}</td><td>{s.full_name}</td><td>{s.department}</td><td>{s.semester}</td><td>{s.email || '—'}</td>
                        <td className="action-cell"><button className="btn-sm danger" onClick={() => deleteStudent(s.id)}>Delete</button></td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No students found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'marksentry' && (
            <MarksEntryTab students={students} subjects={subjects} api={api} />
          )}

          {activeTab === 'announcements' && (
            <>
              <div className="content-card">
                <div className="card-header"><span className="card-title">New Announcement</span></div>
                <form onSubmit={postAnnouncement}>
                  <div className="form-group"><label className="form-label">Title</label><input name="title" className="form-input" required /></div>
                  <div className="form-group"><label className="form-label">Message</label><textarea name="message" className="form-input" rows={4} required></textarea></div>
                  <div className="form-group"><label className="form-label">Target</label>
                    <select name="target_role" className="form-input">
                      <option value="all">All</option><option value="student">Students</option><option value="admin">Admins</option><option value="exam_dept">Exam Dept</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary">Publish</button>
                </form>
              </div>
              <div className="content-card">
                <div className="card-header"><span className="card-title">Recent Announcements</span></div>
                {notifications.slice(0, 10).map((n) => (
                  <div key={n.id} className={`notif ${n.type}`} style={{ position: 'relative' }}>
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-body">{n.message}</div>
                    <div className="notif-body" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Target: {n.target_role || 'All'}
                    </div>
                    <div className="notif-meta">Published: {n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                    <button
                      className="btn-sm danger"
                      type="button"
                      style={{ position: 'absolute', right: '0.5rem', top: '0.5rem' }}
                      onClick={async () => {
                        if (!confirm('Delete this announcement?')) return;
                        try {
                          await api.delete(`/announcements/${n.id}`);
                          setNotifications((prev) => (Array.isArray(prev) ? prev.filter((x) => x.id !== n.id) : prev));

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



          {activeTab === 'controls' && (
            <div className="content-card">

              <div className="card-header"><span className="card-title">System Controls</span></div>
              <div className="info-grid">
                <div className="info-item"><span className="info-label">Portal Access</span><span className="info-value">Enabled</span></div>
                <div className="info-item"><span className="info-label">Registration</span><span className="info-value">Open</span></div>
                <div className="info-item"><span className="info-label">Result Publishing</span><span className="info-value">Active</span></div>
                <div className="info-item"><span className="info-label">Maintenance Mode</span><span className="info-value">Off</span></div>
              </div>
            </div>
          )}



        </div>
      </div>


    </div>
  );
}

function MarksEntryTab({ students, subjects, api }) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [internal, setInternal] = useState('');
  const [external, setExternal] = useState('');

  // Search by Register Number + Select Semester
  const [registerNumber, setRegisterNumber] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [msg, setMsg] = useState('');


  const submitMarks = async (e) => {
    e.preventDefault();
    try {
      // Validation (stable error messages)
      if (!registerNumber.trim()) {
        setMsg('Please enter register number');
        return;
      }
      if (!selectedSemester) {
        setMsg('Please select semester');
        return;
      }
      if (!selectedStudent) {
        setMsg('Student not found in selected semester');
        return;
      }

      if (!selectedSubject) {
        setMsg('Please select subject');
        return;
      }

      await api.post('/admin/marks', {
        student_id: parseInt(selectedStudent),
        subject_id: parseInt(selectedSubject),
        semester: parseInt(semester),
        academic_year: year,
        internal_marks: parseFloat(internal),
        external_marks: parseFloat(external),
      });
      setMsg('Marks saved successfully');
      setInternal(''); setExternal('');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Failed to save marks');
    }
  };


  return (
    <div className="content-card">
      <div className="card-header"><span className="card-title">Enter Marks</span></div>
      {msg && <div className="login-error success" style={{ marginBottom: '1rem' }}>{msg}</div>}
      <form onSubmit={submitMarks}>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Register Number</label>
            <input
              type="text"
              className="form-input"
              value={registerNumber}
              onChange={(e) => {
                const v = e.target.value;
                setRegisterNumber(v);
                // don't clear semester-driven selection automatically here
              }}
              placeholder="Enter register number"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Semester</label>
            <input
              type="number"
              className="form-input"
              value={selectedSemester}

              onChange={(e) => {
                const sem = e.target.value;
                setSelectedSemester(sem);
                setSemester(sem);


                // Auto-select semester + student based on register number
                const reg = registerNumber.trim();
                if (sem && reg) {
                  const match = students.find((s) =>
                    String(s.student_id).trim() === reg && String(s.semester) === String(parseInt(sem))
                  );
                  setSelectedStudent(match ? match.id : '');
                } else {
                  setSelectedStudent('');
                }
              }}
              placeholder="e.g. 3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Student</label>
            <select className="form-input" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required>
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.student_id})</option>)}
            </select>
          </div>

          <div className="form-group"><label className="form-label">Subject</label>
            <select className="form-input" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} required>
              <option value="">Select subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.subject_name} ({s.subject_code})</option>)}
            </select>
          </div>



          <div className="form-group"><label className="form-label">Academic Year</label><input className="form-input" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024-25" required /></div>
          <div className="form-group"><label className="form-label">Internal Marks</label><input type="number" step="0.1" className="form-input" value={internal} onChange={(e) => setInternal(e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">External Marks</label><input type="number" step="0.1" className="form-input" value={external} onChange={(e) => setExternal(e.target.value)} required /></div>
        </div>
        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Save Marks</button>
      </form>

    </div>
  );
}

