// src/components/LoginForm.jsx
import { useEffect, useState } from 'react';
import PasswordField from './PasswordField.jsx';

const isPwComplex = (pw) => /[A-Za-z]/.test(pw || '') && /\d/.test(pw || '') && (pw || '').length >= 6;

export default function LoginForm({
  initialEmail = '',
  loading = false,
  enforceComplexOnLogin = true,
  onSubmit,    
  onForgot,     
  setError,     
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    setEmail(initialEmail || '');
  }, [initialEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError?.('');
    if (!email) return setError?.('Vui lòng nhập email');
    if (!password) return setError?.('Vui lòng nhập mật khẩu');
    if (enforceComplexOnLogin && !isPwComplex(password)) {
      return setError?.('Mật khẩu phải tối thiểu 6 ký tự, gồm cả chữ và số');
    }
    await onSubmit?.({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2" autoComplete="on">
      <div className="mb-3">
        <label className="form-label">Email address</label>
        <div className="input-group">
          <span className="input-group-text"><i className="bi bi-envelope-open"></i></span>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="username"
            required
          />
        </div>
      </div>

      <div className="mb-1">
        <label className="form-label">Password</label>
        <PasswordField
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIconClass="bi bi-shield-lock"
          autoComplete="current-password"
          required
        />
        <div className="form-text text-secondary small">
          Mật khẩu tối thiểu 6 ký tự, gồm cả chữ và số.
        </div>
      </div>

      <button className="btn btn-primary w-100 mt-2" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2"></span>Đang đăng nhập...
          </>
        ) : (
          <>
            <i className="bi bi-arrow-right-circle me-2"></i>Continue
          </>
        )}
      </button>

      <div className="text-end mt-1">
        <button
          type="button"
          className="btn btn-link p-0 small"
          onClick={() => onForgot?.((email || '').trim().toLowerCase())}
        >
          Quên mật khẩu?
        </button>
      </div>
    </form>
  );
}