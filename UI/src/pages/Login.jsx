import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import API from '../api/axios';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('/auth/login', formData);
      const data = response.data;

      // Token aur user session store karna
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.email.trim() && formData.password.length >= 6;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-black px-4 py-8">
      {/* Main Login Card */}
      <div className="w-full max-w-[350px] border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-10 py-8 rounded-sm shadow-sm">
        {/* Instagram Wordmark Logo */}
        <h1 className="text-4xl font-serif text-center font-bold mb-8 tracking-tight text-neutral-900 dark:text-white">
          Chalchitra
        </h1>

        {error && (
          <div className="mb-4 text-xs text-red-500 bg-red-50 dark:bg-red-950/40 p-2.5 rounded border border-red-200 dark:border-red-900/50 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-sm bg-neutral-50 dark:bg-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none placeholder-neutral-400 dark:placeholder-neutral-500 text-neutral-900 dark:text-white"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-sm bg-neutral-50 dark:bg-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-500 focus:outline-none placeholder-neutral-400 dark:placeholder-neutral-500 text-neutral-900 dark:text-white pr-10"
            />
            {formData.password && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="mt-2 w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="flex items-center my-5">
          <div className="flex-1 h-[1px] bg-neutral-200 dark:bg-neutral-800"></div>
          <span className="px-4 text-xs font-semibold text-neutral-400 uppercase">OR</span>
          <div className="flex-1 h-[1px] bg-neutral-200 dark:bg-neutral-800"></div>
        </div>

        <div className="text-center">
          <Link
            to="#"
            className="text-xs text-blue-900 dark:text-blue-400 font-medium hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {/* Sign Up Redirect Card */}
      <div className="w-full max-w-[350px] border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-5 mt-3 rounded-sm text-center">
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-500 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
