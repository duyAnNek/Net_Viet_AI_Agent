// src/pages/Register.jsx
import RegisterForm from '../components/RegisterForm.jsx';
import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div className="row justify-content-center">
      <div className="col-lg-5 col-md-6">
        <div className="card p-4">
          <h4 className="section-title mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-person-plus-fill text-primary"></i> Đăng ký
          </h4>
          <div className="section-underline mb-3"></div>

          <RegisterForm />

          <div className="mt-3 text-center">
            Đã có tài khoản? <Link to="/login" className="fw-semibold">Đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}