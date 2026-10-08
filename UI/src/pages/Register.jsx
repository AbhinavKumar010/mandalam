import React, { useState } from 'react';
import './Register.css';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function Register() {
  const [formData, setFormData] = useState({ username: '', fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/register', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-page__card">
        <h1 className="register-page__brand">Chalchitra</h1>
        <p className="register-page__intro">
          Sign up to see photos and videos from your friends.
        </p>
        {error && <p className="register-page__error">{error}</p>}
        <form onSubmit={handleSubmit} className="register-page__form">
          <input
            type="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="register-page__input"
          />
          <input
            type="text"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="register-page__input"
          />
          <input
            type="text"
            placeholder="Username"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="register-page__input"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="register-page__input"
          />
          <button
            type="submit"
            disabled={loading}
            className="register-page__submit"
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
        <p className="register-page__footer">
          Have an account?{' '}
          <Link to="/login" className="register-page__link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}