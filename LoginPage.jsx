import React, { useState } from 'react';
import api from '../api.js';

export default function LoginPage({ onLogin, onRegister, loginRole, setLoginRole }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      // Send selected role to backend so it can enforce correct role login.
      formData.append('role', loginRole);

      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('userId', res.data.user_id);
      localStorage.setItem('username', res.data.username);
      onLogin(res.data.role);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="auth-bg">
        <div className="auth-orb orb-blue"></div>
        <div className="auth-orb orb-teal"></div>
        <div className="auth-orb orb-purple"></div>
        <div className="auth-orb orb-gold"></div>
      </div>
      <div className="login-container">
        <div className="login-brand">
          <div className="brand-icon">&#x2B21;</div>
          <h1 className="brand-name">EduCore</h1>
          <p className="brand-tagline">Integrated College Management</p>
        </div>
        <div className="login-card">
          <h2 className="login-title">login</h2>
          <p className="login-sub">Access your portal</p>

          <div className="role-selector">
            {['student', 'admin', 'exam_dept'].map((role) => (
              <button
                key={role}
                className={`role-btn ${loginRole === role ? 'active' : ''}`}
                onClick={() => setLoginRole(role)}
              >
                <span className="role-icon">
                  {role === 'student' ? '\uD83C\uDF93' : role === 'admin' ? '\u2699\uFE0F' : '\uD83D\uDCCB'}
                </span>
                <span>{role === 'exam_dept' ? 'Exam Dept' : role.charAt(0).toUpperCase() + role.slice(1)}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} autoComplete="on" autoCapitalize="off" autoCorrect="off" spellCheck="false">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter username"
                name="username"
                autoComplete="username"
                id="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password"
                autoComplete="current-password"
                name="password"
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>


            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="btn-primary full-width" disabled={loading}>
              {loading ? 'logning in…' : 'Login'}
            </button>
          </form>


          <div className="register-link">
            <span>New here?</span>{' '}
            <a onClick={onRegister}>Create an account</a>
          </div>
        </div>
      </div>
    </div>
  );
}

