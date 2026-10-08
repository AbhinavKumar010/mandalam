import React, { useState } from 'react';
import './Login.css';
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
    <div className="login-page">
      {/* Main Login Card */}
      <div className="login-page__card">
        {/* Instagram Wordmark Logo */}
        <h1 className="login-page__brand">
          Chalchitra
        </h1>

        {error && (
          <div className="login-page__error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-page__form">
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              value={formData.email}
              onChange={handleChange}
              className="login-page__input"
            />
          </div>

          <div className="login-page__field">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              required
              value={formData.password}
              onChange={handleChange}
              className="login-page__input"
            />
            {formData.password && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-page__password-toggle"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="login-page__submit"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="login-page__separator">
          <div className="login-page__separator-line"></div>
          <span className="login-page__separator-label">OR</span>
          <div className="login-page__separator-line"></div>
        </div>

        <div>
          <Link
            to="#"
            className="login-page__forgot"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {/* Sign Up Redirect Card */}
      <div className="login-page__signup">
        <p className="login-page__signup-copy">
          Don't have an account?{' '}
          <Link to="/register" className="login-page__link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
