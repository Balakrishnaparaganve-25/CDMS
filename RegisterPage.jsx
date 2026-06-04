import React, { useState } from 'react';
import api from '../api.js';

export default function RegisterPage({ onBackToLogin, initialRole }) {
  const [role, setRole] = useState(initialRole);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', gender: '', address: '', phone: '', nationality: 'Indian',
    dept: '', year: '', section: 'A', rollNo: '', prevSchool: '', grade10: '', grade12: '', entrance: '',
    email: '', username: '', password: '', confirmPassword: '', terms: false,
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const totalSteps = role === 'student' ? 3 : 2;

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!form.firstName.trim()) return setError('Please enter your first name.');
      if (!form.lastName.trim()) return setError('Please enter your last name.');
      if (!form.dob) return setError('Please select your date of birth.');
      if (!form.gender) return setError('Please select your gender.');

      const phone = form.phone.trim();
      if (!phone) return setError('Please enter a phone number.');
      const digitsOnly = phone.replace(/\D/g, '');
      if (!/^\d{10}$/.test(digitsOnly)) return setError('Please enter a valid 10-digit phone number.');
    }
    if (step === 2 && role === 'student') {
      if (!form.dept) return setError('Please select a department.');
      if (!form.year) return setError('Please select your year of study.');
      if (!form.rollNo.trim()) return setError('Please enter your roll number.');
    }
    if ((step === 2 && role !== 'student') || (step === 3 && role === 'student')) {
      if (!form.email.includes('@')) return setError('Please enter a valid email address.');
      if (form.username.length < 3) return setError('Username must be at least 3 characters.');
      if (form.password.length < 8) return setError('Password must be at least 8 characters.');
      if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
      if (!form.terms) return setError('Please accept the Terms & Conditions.');
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    if (step < totalSteps) setStep(step + 1);
    else handleSubmit();
  };

  const prevStep = () => setStep(Math.max(1, step - 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {


      const payload = {
        username: form.username,
        password: form.password,
        email: form.email,
        role,
        full_name: `${form.firstName} ${form.lastName}`,
        student_id: form.rollNo,
        department: form.dept,
        semester: parseInt(form.year?.charAt(0)) || 1,
        academic_year: form.year,
        phone: form.phone,
        dob: form.dob,
        gender: form.gender,
        address: form.address,
      };
      await api.post('/auth/register', payload);
      onBackToLogin();
    } catch (err) {
      console.error('Register failed:', err);
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };


  const headerText = {
    student: { h2: 'Student Registration', sub: 'Create your student portal account' },
    admin: { h2: 'Admin Registration', sub: 'Request access to the admin portal' },
    exam_dept: { h2: 'Exam Dept Registration', sub: 'Request access to the exam portal' },
  };

  return (
    <div className="register-page">
      <div className="auth-bg">
        <div className="auth-orb orb-blue"></div>
        <div className="auth-orb orb-teal"></div>
        <div className="auth-orb orb-purple"></div>
      </div>
      <div className="register-container">
        <div className="register-header">
          <div className="brand-icon small">&#x2B21;</div>
          <h2>{headerText[role].h2}</h2>
          <p>{headerText[role].sub}</p>
        </div>

        <div className="reg-role-selector">
          {['student', 'admin', 'exam_dept'].map((r) => (
            <button key={r} className={`role-btn ${role === r ? 'active' : ''}`} onClick={() => { setRole(r); setStep(1); }}>
              <span className="role-icon">
                {r === 'student' ? '\uD83C\uDF93' : r === 'admin' ? '\u2699\uFE0F' : '\uD83D\uDCCB'}
              </span>
              <span>{r === 'exam_dept' ? 'Exam Dept' : r.charAt(0).toUpperCase() + r.slice(1)}</span>
            </button>
          ))}
        </div>

        <div className="step-indicator">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className="step-line"></div>}
              <div className={`step-item ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}`}>
                <div className="step-circle">{i + 1 < step ? '\u2713' : i + 1}</div>
                <span className="step-label">
                  {i === 0 ? 'Personal' : i === 1 && role === 'student' ? 'Academic' : 'Account'}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="register-card">
          {step === 1 && (
            <div className="wizard-step active">
              <h3 className="step-title">Personal Information</h3>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Date of Birth *</label><input type="date" className="form-input" value={form.dob} onChange={(e) => update('dob', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Gender *</label><select className="form-input" value={form.gender} onChange={(e) => update('gender', e.target.value)}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></div>
                <div className="form-group full-col"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={(e) => update('address', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Phone Number *</label><input className="form-input" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Nationality</label><input className="form-input" value={form.nationality} onChange={(e) => update('nationality', e.target.value)} /></div>
              </div>
            </div>
          )}

          {step === 2 && role === 'student' && (
            <div className="wizard-step active">
              <h3 className="step-title">Academic Details</h3>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Department *</label><select className="form-input" value={form.dept} onChange={(e) => update('dept', e.target.value)}><option value="">Select department</option><option>Computer Science</option><option>Electronics</option><option>Mechanical</option><option>Bachelor of Computer Application</option><option>Business Administration</option></select></div>
                <div className="form-group"><label className="form-label">Year of Study *</label><select className="form-input" value={form.year} onChange={(e) => update('year', e.target.value)}><option value="">Select year</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option></select></div>
                <div className="form-group"><label className="form-label">Section</label><select className="form-input" value={form.section} onChange={(e) => update('section', e.target.value)}><option value="">Select section</option><option>A</option><option>B</option><option>C</option></select></div>
                <div className="form-group"><label className="form-label">Roll Number</label><input className="form-input" value={form.rollNo} onChange={(e) => update('rollNo', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Previous School / College</label><input className="form-input" value={form.prevSchool} onChange={(e) => update('prevSchool', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">10th Grade % / CGPA</label><input className="form-input" value={form.grade10} onChange={(e) => update('grade10', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">12th Grade % / CGPA</label><input className="form-input" value={form.grade12} onChange={(e) => update('grade12', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Entrance Exam Score</label><input className="form-input" value={form.entrance} onChange={(e) => update('entrance', e.target.value)} /></div>
              </div>
            </div>
          )}

          {((step === 2 && role !== 'student') || (step === 3 && role === 'student')) && (
            <div className="wizard-step active">
              <h3 className="step-title">Account Setup</h3>
              <div className="form-grid-2">
                <div className="form-group full-col"><label className="form-label">Email Address *</label><input type="email" className="form-input" value={form.email} onChange={(e) => update('email', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Username *</label><input className="form-input" value={form.username} onChange={(e) => update('username', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">ID (auto-assigned)</label><input className="form-input" disabled placeholder="Will be auto-assigned" /></div>
                <div className="form-group"><label className="form-label">Password *</label><input type="password" className="form-input" value={form.password} onChange={(e) => update('password', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Confirm Password *</label><input type="password" className="form-input" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} /></div>
                <div className="form-group full-col checkbox-group"><label className="checkbox-label"><input type="checkbox" checked={form.terms} onChange={(e) => update('terms', e.target.checked)} /><span>I agree to the Terms &amp; Conditions and Privacy Policy</span></label></div>
              </div>
              <div className="success-note">
                {role === 'student' ? 'Almost done! Submit to complete your student registration.' : role === 'admin' ? 'Almost done! Submit to request Admin portal access. An administrator will review your application.' : 'Almost done! Submit to request Exam Department access. An administrator will review your application.'}
              </div>
            </div>
          )}

          {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div className="wizard-nav">
            <button type="button" className="btn-secondary" onClick={prevStep} style={{ display: step > 1 ? 'inline-block' : 'none' }}>Previous</button>
            <div className="step-counter">Step {step} of {totalSteps}</div>
            <button type="button" className="btn-primary" onClick={nextStep} disabled={loading}>
              {loading ? 'Submitting…' : step === totalSteps ? 'Submit Registration' : 'Next'}
            </button>
          </div>
        </div>

        <div className="back-to-login"><a onClick={onBackToLogin}>Back to Login</a></div>
      </div>
    </div>
  );
}

