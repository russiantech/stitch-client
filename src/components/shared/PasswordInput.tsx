// src/components/shared/PasswordInput.tsx
import React, { useState } from 'react';

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function PasswordInput({ className = '', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="position-relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`form-control pe-5 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="btn btn-link text-muted position-absolute top-50 end-0 translate-middle-y p-0 me-3"
        style={{ textDecoration: 'none', zIndex: 5 }}
      >
        <i className={`fas ${visible ? 'fa-eye-slash' : 'fa-eye'}`} />
      </button>
    </div>
  );
}

