// src/components/PasswordField.jsx
import { useState } from 'react';

export default function PasswordField({
  value,
  onChange,
  placeholder = '••••••',
  autoComplete,
  required,
  disabled,
  invalid = false,
  leftIconClass,
  inputClassName = '',
  buttonClassName = 'btn btn-outline-secondary',
  inputProps = {},
  id,
  name,
  titleShow = 'Hiện',
  titleHide = 'Ẩn',
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="input-group">
      {leftIconClass && (
        <span className="input-group-text">
          <i className={leftIconClass}></i>
        </span>
      )}
      <input
        type={show ? 'text' : 'password'}
        className={`form-control${invalid ? ' is-invalid' : ''} ${inputClassName}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        id={id}
        name={name}
        {...inputProps}
      />
      <button
        type="button"
        className={buttonClassName}
        onClick={() => setShow((s) => !s)}
        title={show ? titleHide : titleShow}
        disabled={disabled}
      >
        <i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`}></i>
      </button>
    </div>
  );
}