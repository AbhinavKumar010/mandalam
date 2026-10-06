import React, { useState } from 'react';
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
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-black p-4">
      <div className="w-full max-w-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 rounded-lg shadow-sm">
        <h1 className="text-3xl font-serif text-center font-bold mb-4">Chalchitra</h1>
        <p className="text-xs text-neutral-500 text-center mb-6 font-medium">
          Sign up to see photos and videos from your friends.
        </p>
        {error && <p className="text-red-500 text-xs text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Username"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 rounded text-sm disabled:opacity-50 mt-2 transition-colors"
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
        <p className="text-xs text-center text-neutral-500 mt-6">
          Have an account?{' '}
          <Link to="/login" className="text-blue-500 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}