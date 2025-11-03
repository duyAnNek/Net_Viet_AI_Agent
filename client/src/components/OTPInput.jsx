// src/components/OTPInput.jsx
export default function OTPInput({
  value,
  onChange,
  length = 6,
  placeholder = `Nhập mã ${length} số`,
  className = 'form-control',
  ...props
}) {
  const handleChange = (e) => {
    const v = (e.target.value || '').replace(/\D/g, '').slice(0, length);
    onChange?.(v);
  };

  return (
    <input
      inputMode="numeric"
      autoComplete="one-time-code"
      className={className}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={length}
      {...props}
    />
  );
}