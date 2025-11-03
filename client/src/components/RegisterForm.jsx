// src/components/RegisterForm.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PasswordField from './PasswordField.jsx';
import OTPInput from './OTPInput.jsx';
import { authService } from '../services/auth.service';

const isPwComplex = (pw) =>
  /[A-Za-z]/.test(pw || '') && /\d/.test(pw || '') && (pw || '').length >= 6;

export default function RegisterForm() {
  const [step, setStep] = useState('info');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailTaken, setEmailTaken] = useState(false);
  const [nameTaken, setNameTaken] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState(false);

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const COOLDOWN_SEC = 30;

  useEffect(() => {
    setNameTaken(false);
    const v = name.trim();
    if (!v || v.length < 3) return;
    const t = setTimeout(async () => {
      try {
        const data = await authService.checkAvailability({ name: v });
        setNameTaken(!!data?.nameTaken);
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [name]);

  useEffect(() => {
    setEmailTaken(false);
    const v = email.trim().toLowerCase();
    if (!v || !validateEmail(v)) return;
    const t = setTimeout(async () => {
      try {
        const data = await authService.checkAvailability({ email: v });
        setEmailTaken(!!data?.emailTaken);
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [email]);

  const passwordNotComplex = submittedInfo && password && !isPwComplex(password);
  const confirmMismatch = submittedInfo && confirmPassword && confirmPassword !== password;

  const onInfoKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      startSignupOtp();
    }
  };

  const startSignupOtp = async () => {
    setError(''); setMsg('');
    setSubmittedInfo(true);

    if (!name.trim()) return setError('Vui lòng nhập tên đăng nhập');
    if (!email.trim()) return setError('Vui lòng nhập email');
    if (!validateEmail(email)) return setError('Email không hợp lệ');
    if (!password) return setError('Vui lòng nhập mật khẩu');
    if (!isPwComplex(password)) return setError('Mật khẩu phải tối thiểu 6 ký tự, gồm cả chữ và số');
    if (password !== confirmPassword) return setError('Mật khẩu xác nhận không khớp');
    if (nameTaken) return setError('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.');
    if (emailTaken) return setError('Email đã tồn tại. Vui lòng nhập email khác.');

    setLoading(true);
    try {
      const data = await authService.startEmail({ email, name });
      if (data?.exists) {
        setEmailTaken(true);
        return setError('Email đã tồn tại. Vui lòng nhập email khác.');
      }
      if (data?.nameTaken) {
        setNameTaken(true);
        return setError('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.');
      }
      setStep('otp');
      setMsg('Đã gửi mã OTP. Vui lòng kiểm tra hộp thư (cả Spam).');
      setResendCooldown(COOLDOWN_SEC);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể gửi mã. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!resendCooldown) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const verifyAndCompleteSignup = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    if (otp.length !== 6) return setError('Mã gồm 6 số');

    setLoading(true);
    try {
      const verified = await authService.verifyEmail({ email, code: otp });

      if (verified?.token || verified?.needSignup === false) {
        setMsg('Email đã có tài khoản. Vui lòng đăng nhập để tiếp tục.');
        setLoading(false);
        return;
      }
      if (!verified?.needSignup || !verified?.ticket) {
        setLoading(false);
        return setError('Xác thực không hợp lệ hoặc mã đã hết hạn. Vui lòng thử lại.');
      }

      const result = await authService.completeSignup({
        ticket: verified.ticket,
        name,
        password
      });

      if (result?.ok) {
        try {
          if ('credentials' in navigator && window.PasswordCredential) {
            const cred = new window.PasswordCredential({ id: email, name, password });
            await navigator.credentials.store(cred);
          }
        } catch {}
        setPassword(''); setConfirmPassword(''); setOtp('');
        setMsg('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
        setStep('done');
      } else {
        setError('Có lỗi khi tạo tài khoản. Vui lòng thử lại.');
      }
    } catch (err) {
      const status = err?.response?.status;
      const m = err?.response?.data?.message;
      if (status === 409 && /tồn tại/i.test(m || '')) {
        setError(m || 'Tên đăng nhập/Email đã tồn tại');
        setStep('info');
      } else if (status === 400 && /Mật khẩu/.test(m || '')) {
        setError(m);
        setStep('info');
      } else {
        setError(m || 'Không thể xác thực/đăng ký, vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError(''); setMsg('');
    if (resendCooldown > 0 || loading) return;
    try {
      await authService.startEmail({ email, name });
      setMsg('Đã gửi lại mã.');
      setResendCooldown(COOLDOWN_SEC);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể gửi lại mã.');
    }
  };

  return (
    <>
      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {step === 'info' && (
        <div className="mt-2" autoComplete="off" onKeyDown={onInfoKeyDown}>
          <div className="mb-3">
            <label className="form-label">Tên đăng nhập</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-person-badge"></i></span>
              <input
                className={`form-control${nameTaken ? ' is-invalid' : ''}`}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="username"
                autoComplete="username"
                required
              />
            </div>
            {nameTaken && <div className="invalid-feedback d-block">Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-at"></i></span>
              <input
                type="email"
                className={`form-control${emailTaken ? ' is-invalid' : ''}`}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>
            {emailTaken && <div className="invalid-feedback d-block">Email đã tồn tại. Vui lòng nhập email khác.</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Mật khẩu</label>
            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIconClass="bi bi-lock-fill"
              autoComplete="new-password"
              inputProps={{ 'data-lpignore': 'true', 'data-1p-ignore': 'true' }}
              invalid={passwordNotComplex}
            />
            <div className="form-text text-secondary small">
              Mật khẩu tối thiểu 6 ký tự, phải gồm cả chữ và số.
            </div>
            {passwordNotComplex && (
              <div className="invalid-feedback d-block">
                Mật khẩu chưa đạt yêu cầu (cần cả chữ và số, tối thiểu 6 ký tự).
              </div>
            )}
          </div>

          <div className="mb-2">
            <label className="form-label">Xác nhận mật khẩu</label>
            <PasswordField
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIconClass="bi bi-shield-lock"
              autoComplete="new-password"
              inputProps={{ 'data-lpignore': 'true', 'data-1p-ignore': 'true' }}
              invalid={confirmMismatch}
            />
            {confirmMismatch && (
              <div className="invalid-feedback d-block">Mật khẩu xác nhận không khớp</div>
            )}
          </div>

          <button type="button" className="btn btn-success w-100 mt-2"
                  disabled={loading} onClick={startSignupOtp}>
            {loading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Đang gửi mã...</>)
                     : (<><i className="bi bi-check2-circle me-2"></i>Tiếp tục</>)}
          </button>
        </div>
      )}

      {step === 'otp' && (
        <form onSubmit={verifyAndCompleteSignup} className="mt-2" autoComplete="off">
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input className="form-control" value={email} disabled />
          </div>
          <div className="mb-3">
            <label className="form-label">Mã xác nhận (6 số)</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-shield-check"></i></span>
              <OTPInput value={otp} onChange={setOtp} placeholder="Nhập mã 6 số" />
            </div>
          </div>

          <div className="d-flex gap-2">
            <button type="button" className="btn btn-light flex-fill"
                    onClick={()=>{ setStep('info'); setMsg(''); setError(''); }} disabled={loading}>
              <i className="bi bi-chevron-left me-1"></i>Quay lại
            </button>
            <button className="btn btn-success flex-fill" disabled={loading}>
              {loading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Đang xác thực & tạo tài khoản...</>)
                       : (<><i className="bi bi-check2-circle me-2"></i>Xác nhận</>)}
            </button>
          </div>

          <button type="button" className="btn btn-link mt-2 p-0"
                  onClick={resendCode}
                  disabled={resendCooldown > 0 || loading}>
            Gửi lại mã {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="text-center">
          <div className="alert alert-success">Đăng ký thành công!</div>
          <Link
            to="/login"
            state={{ email, flash: 'Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.' }}
            className="btn btn-primary"
          >
            Đăng nhập
          </Link>
        </div>
      )}
    </>
  );
}