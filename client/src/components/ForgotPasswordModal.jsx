// src/components/ForgotPasswordModal.jsx
import { useEffect, useState } from 'react';
import OTPInput from './OTPInput.jsx';
import PasswordField from './PasswordField.jsx';
import { authService } from '../services/auth.service';

const isPwComplex = (pw) => /[A-Za-z]/.test(pw || '') && /\d/.test(pw || '') && (pw || '').length >= 6;
const COOLDOWN_SEC = 30;

export default function ForgotPasswordModal({ open, onClose, initialEmail = '' }) {
  const [step, setStep] = useState('email'); 
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [ticket, setTicket] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');

  useEffect(() => {
    if (open) {
      setStep('email');
      setEmail((initialEmail || '').trim().toLowerCase());
      setCode('');
      setTicket('');
      setPw1('');
      setPw2('');
      setMsg('');
      setErr('');
      setResendCooldown(0);
    }
  }, [open, initialEmail]);

  useEffect(() => {
    if (!resendCooldown) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  if (!open) return null;

  const sendEmail = async () => {
    setErr(''); setMsg('');
    const e = (email || '').trim().toLowerCase();
    if (!e || !e.includes('@')) return setErr('Email không hợp lệ');

    setLoading(true);
    try {
      await authService.startReset(e);
      setStep('otp');
      setMsg('Đã gửi mã OTP (nếu email tồn tại). Vui lòng kiểm tra hộp thư/Spam.');
      setResendCooldown(COOLDOWN_SEC);
    } catch (ex) {
      const status = ex?.response?.status;
      const m = ex?.response?.data?.message;
      if (status === 429) setErr(m || 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.');
      else setErr(m || 'Không thể gửi mã');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    try {
      await authService.startReset((email || '').trim().toLowerCase());
      setMsg('Đã gửi lại mã.');
      setResendCooldown(COOLDOWN_SEC);
    } catch (ex) {
      const status = ex?.response?.status;
      const m = ex?.response?.data?.message;
      if (status === 429) setErr(m || 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.');
      else setErr(m || 'Không thể gửi lại mã');
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if ((code || '').replace(/\D/g, '').length !== 6) return setErr('Mã gồm 6 số');

    setLoading(true);
    try {
      const resp = await authService.verifyReset({
        email: (email || '').trim().toLowerCase(),
        code: (code || '').trim(),
      });
      if (resp?.ticket) {
        setTicket(resp.ticket);
        setStep('reset');
        setMsg('OTP hợp lệ. Nhập mật khẩu mới.');
      } else {
        setErr('Không thể xác thực. Vui lòng kiểm tra email/mã OTP.');
      }
    } catch (ex) {
      setErr(ex?.response?.data?.message || 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  const complete = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if (!pw1) return setErr('Vui lòng nhập mật khẩu mới');
    if (!isPwComplex(pw1)) return setErr('Mật khẩu phải tối thiểu 6 ký tự, gồm cả chữ và số');
    if (pw1 !== pw2) return setErr('Xác nhận mật khẩu không khớp');
    if (!ticket) return setErr('Ticket không hợp lệ. Vui lòng gửi lại mã OTP.');

    setLoading(true);
    try {
      const resp = await authService.completeReset({ ticket, newPassword: pw1 });
      if (resp?.ok) {
        setStep('done');
        setMsg('Đổi mật khẩu thành công! Vui lòng đăng nhập.');
      } else {
        setErr('Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      }
    } catch (ex) {
      setErr(ex?.response?.data?.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(0,0,0,0.35)', zIndex: 1050 }}
    >
      <div className="card p-3" style={{ width: '100%', maxWidth: 500 }}>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h5 className="m-0 d-flex align-items-center gap-2">
            <i className="bi bi-shield-lock text-primary"></i> Quên mật khẩu
          </h5>
          <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="section-underline mb-2"></div>

        {msg && <div className="alert alert-success py-2">{msg}</div>}
        {err && <div className="alert alert-danger py-2">{err}</div>}

        {step === 'email' && (
          <div>
            <div className="mb-3">
              <label className="form-label">Email của bạn</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                <input
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-light flex-fill" onClick={onClose} disabled={loading}>
                <i className="bi bi-chevron-left me-1"></i>Đóng
              </button>
              <button className="btn btn-primary flex-fill" onClick={sendEmail} disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>Đang gửi...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>Gửi mã
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <form onSubmit={verify} autoComplete="off">
            <div className="mb-2">
              <label className="form-label">Email</label>
              <input className="form-control" value={email} disabled />
            </div>
            <div className="mb-2">
              <label className="form-label">Mã OTP (6 số)</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-shield-check"></i></span>
                <OTPInput value={code} onChange={setCode} placeholder="Nhập mã" />
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-light flex-fill"
                onClick={() => setStep('email')}
                disabled={loading}
              >
                <i className="bi bi-chevron-left me-1"></i>Quay lại
              </button>
              <button type="submit" className="btn btn-success flex-fill" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>Đang xác thực...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-2"></i>Xác nhận
                  </>
                )}
              </button>
            </div>
            <button
              type="button"
              className="btn btn-link mt-2 p-0"
              onClick={resend}
              disabled={resendCooldown > 0 || loading}
            >
              Gửi lại mã {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={complete} autoComplete="off">
            <div className="mb-3">
              <label className="form-label">Mật khẩu mới</label>
              <PasswordField
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                leftIconClass="bi bi-lock"
                autoComplete="new-password"
                inputProps={{ 'data-lpignore': 'true', 'data-1p-ignore': 'true' }}
              />
              <div className="form-text text-secondary small">
                Mật khẩu tối thiểu 6 ký tự, gồm cả chữ và số.
              </div>
            </div>
            <div className="mb-2">
              <label className="form-label">Xác nhận mật khẩu</label>
              <PasswordField
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                leftIconClass="bi bi-shield-lock"
                autoComplete="new-password"
                inputProps={{ 'data-lpignore': 'true', 'data-1p-ignore': 'true' }}
              />
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-light flex-fill"
                onClick={() => setStep('otp')}
                disabled={loading}
              >
                <i className="bi bi-chevron-left me-1"></i>Quay lại
              </button>
              <button type="submit" className="btn btn-success flex-fill" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>Đang đổi mật khẩu...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-2"></i>Đổi mật khẩu
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center">
            <button className="btn btn-primary" onClick={onClose}>
              <i className="bi bi-box-arrow-in-right me-1"></i> Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}