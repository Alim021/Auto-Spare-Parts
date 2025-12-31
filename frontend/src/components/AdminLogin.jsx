// components/AdminLogin.jsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../styles/admin-login.css'; // ✅ Make sure this file exists

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();

    if (email === 'sayyad0022@gmail.com' && password === '963749') {
      localStorage.setItem('admin', 'true');
      window.dispatchEvent(new Event('login-success'));
      router.push('/admin-dashboard');
    } else {
      setError('Invalid admin credentials');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleLogin}>
        <h2>Admin Login</h2>
        {error && <p className="error">{error}</p>}
        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
          required
        />
        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="off"
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
