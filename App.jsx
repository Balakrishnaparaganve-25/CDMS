import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import ExamDashboard from './components/ExamDashboard';

const ROLE_DASHBOARD = {
  student:   'student',
  admin:     'admin',
  exam_dept: 'exam',
};

export default function App() {
  const [page, setPage] = useState('login'); // login | register | student | admin | exam
  const [loginRole, setLoginRole] = useState('student');

  // Keyboard shortcut: Enter on login
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && page === 'login') {
        // handled in LoginPage
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [page]);

  const navigateTo = (target) => setPage(target);

  const handleLogin = (role) => {
    setPage(ROLE_DASHBOARD[role] || 'student');
  };

  const handleLogout = () => {
    setPage('login');
  };

  return (
    <>
      {page === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onRegister={() => navigateTo('register')}
          loginRole={loginRole}
          setLoginRole={setLoginRole}
        />
      )}
      {page === 'register' && (
        <RegisterPage
          onBackToLogin={() => navigateTo('login')}
          initialRole={loginRole}
        />
      )}
      {page === 'student' && <StudentDashboard onLogout={handleLogout} />}
      {page === 'admin' && <AdminDashboard onLogout={handleLogout} />}
      {page === 'exam' && <ExamDashboard onLogout={handleLogout} />}
    </>
  );
}
