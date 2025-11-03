// src/pages/Login.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authService } from '../services/auth.service';
import { setAuthToken } from '../api/axios';

import LoginForm from '../components/LoginForm.jsx';
import ForgotPasswordModal from '../components/ForgotPasswordModal.jsx';

export default function Login() {
  const [serverError, setServerError] = useState('');
  const [flash, setFlash] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialEmail, setInitialEmail] = useState('');

  const [fpOpen, setFpOpen] = useState(false);
  const [fpInitialEmail, setFpInitialEmail] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) setInitialEmail(location.state.email);
    if (location.state?.flash) setFlash(location.state.flash);
    if (location.state) window.history.replaceState({}, document.title);
  }, [location.state]);

  const handleSubmit = async ({ email, password }) => {
    setServerError('');
    setLoading(true);
    try {
      const data = await authService.login(email, password); // { user, token }
      await login({ user: data.user, token: data.token });
      setAuthToken(data.token);
      navigate('/chat');
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data || {};
      const code = data?.code;
      const msg = data?.message;
      const ctype = err?.response?.headers?.['content-type'] || '';

      if (code === 'INVALID_PASSWORD' || status === 401) {
        setServerError('Đăng nhập không thành công. Mật khẩu không hợp lệ');
      } else if (code === 'USER_NOT_FOUND' || (status === 404 && msg === 'Chưa có tài khoản')) {
        setServerError('Chưa có tài khoản');
      } else if (status === 404 && (!msg || !ctype.includes('application/json'))) {
        setServerError('Không tìm thấy endpoint API. Kiểm tra lại VITE_API_URL/baseURL.');
      } else {
        setServerError(msg || 'Đăng nhập thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  const openForgot = (email) => {
    setFpInitialEmail(email || '');
    setFpOpen(true);
  };
  const closeForgot = () => setFpOpen(false);

  return (
    <div className="row justify-content-center">
      <div className="col-lg-5 col-md-7">
        <div className="card p-4">
          <h4 className="section-title mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-box-arrow-in-right text-primary"></i> Đăng nhập
          </h4>
          <div className="section-underline mb-3"></div>

          {flash && <div className="alert alert-success">{flash}</div>}
          {serverError && <div className="alert alert-danger">{serverError}</div>}

          <LoginForm
            initialEmail={initialEmail}
            loading={loading}
            enforceComplexOnLogin={true}
            onSubmit={handleSubmit}
            onForgot={openForgot}
            setError={setServerError}
          />

          <div className="border rounded p-3 mt-4 bg-light">
            <div className="d-flex align-items-center">
              <i className="bi bi-person-plus me-2 fs-5"></i>
              <div className="flex-grow-1">
                <div className="fw-semibold">Chưa có tài khoản?</div>
                <div className="text-secondary small">Tạo tài khoản mới để dùng chatbot.</div>
              </div>
              <Link to="/register" className="btn btn-outline-secondary">Tạo tài khoản</Link>
            </div>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        open={fpOpen}
        onClose={closeForgot}
        initialEmail={fpInitialEmail}
      />
    </div>
  );
}