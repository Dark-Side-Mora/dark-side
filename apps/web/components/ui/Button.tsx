import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = ({
  variant = "primary",
  size = "md",
  loading,
  className,
  style,
  children,
  ...props
}: ButtonProps) => {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    fontWeight: 600,
    gap: "8px",
    opacity: loading ? 0.7 : 1,
    cursor: loading ? "not-allowed" : "pointer",
  };

  const variants = {
    primary: {
      backgroundColor: "var(--accent-cyan)",
      color: "#000",
    },
    secondary: {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      color: "var(--text-primary)",
      borderColor: "var(--border)",
    },
    danger: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      color: "var(--error)",
      borderColor: "rgba(239, 68, 68, 0.2)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--text-secondary)",
    },
    glass: {
      backgroundColor: "var(--glass-bg)",
      backdropFilter: "blur(12px)",
      color: "var(--text-primary)",
      borderColor: "var(--glass-border)",
    },
  };

  const sizes = {
    sm: { padding: "6px 12px", fontSize: "12px" },
    md: { padding: "10px 20px", fontSize: "14px" },
    lg: { padding: "14px 28px", fontSize: "16px" },
  };

  return (
    <button
      style={{ ...baseStyle, ...variants[variant], ...sizes[size], ...style }}
      className={className}
      disabled={loading || (props as any).disabled}
      {...props}
    >
      {loading && (
        <span
          className="button-loader"
          style={{
            width: "14px",
            height: "14px",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
          }}
        />
      )}
      {children}
    </button>
  );
};
