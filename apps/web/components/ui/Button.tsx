import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({ variant = 'primary', size = 'md', className, style, ...props }: ButtonProps) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
    fontFamily: 'var(--font-main)',
    gap: '8px',
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--accent-cyan)',
      color: '#000',
    },
    secondary: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border)',
    },
    danger: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: 'var(--error)',
      borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
    },
    glass: {
      backgroundColor: 'var(--glass-bg)',
      backdropFilter: 'blur(12px)',
      color: 'var(--text-primary)',
      borderColor: 'var(--glass-border)',
    }
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '10px 20px', fontSize: '14px' },
    lg: { padding: '14px 28px', fontSize: '16px' }
  };

  return (
    <button 
      style={{ ...baseStyle, ...variants[variant], ...sizes[size], ...style }} 
      className={className}
      {...props}
    />
  );
};
