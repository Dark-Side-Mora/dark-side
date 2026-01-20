import React from 'react';

export const Input = ({ label, error, ...props }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
    {label && <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
    <input 
      style={{
        width: '100%',
        backgroundColor: 'var(--glass-bg)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '12px 16px',
        color: 'var(--text-primary)',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s ease',
      }} 
      onFocus={(e) => e.target.style.borderColor = 'var(--accent-cyan)'}
      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
      {...props}
    />
    {error && <span style={{ fontSize: '12px', color: 'var(--error)' }}>{error}</span>}
  </div>
);

export const Card = ({ children, title, footer, style, glass = true }: any) => (
  <div className={glass ? "glass" : ""} style={{ 
    padding: '24px', 
    backgroundColor: glass ? 'transparent' : 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    ...style 
  }}>
    {title && <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{title}</h3>}
    <div style={{ flex: 1 }}>{children}</div>
    {footer && <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>{footer}</div>}
  </div>
);
