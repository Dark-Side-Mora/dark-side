"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { IconSun } from "../../../components/ui/IconSun";
import { IconMoon } from "../../../components/ui/IconMoon";
import { LogoIcon } from "../../../components/ui/LogoIcon";
import { useAuth } from "../../../lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithGitHub, loading, error } =
    useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.add("light-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const { data, error } = await signUp({
      email,
      password,
      firstName,
      lastName,
    });

    if (error) {
      setAuthError(error.message);
    } else if (data) {
      console.log("Signup successful - confirmation email sent to:", email);
      setEmailConfirmationSent(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setAuthError(error.message);
    }
  };

  const handleGitHubSignIn = async () => {
    setAuthError(null);
    const { error } = await signInWithGitHub();
    if (error) {
      setAuthError(error.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "var(--bg-dark)",
      }}
    >
      {/* Left Panel - Visuals (hidden on mobile) */}
      <div
        className="auth-visual-panel"
        style={{
          flex: 1,
          backgroundColor: isDarkMode ? "#050505" : "#F9FAFB",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          transition: "background-color 0.2s ease",
        }}
      >
        {/* Abstract Background */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-20%",
            width: "140%",
            height: "140%",
            background: isDarkMode
              ? "radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.15), transparent 40%), radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.15), transparent 40%)"
              : "radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.08), transparent 40%), radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.08), transparent 40%)",
            filter: "blur(60px)",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: isDarkMode
              ? "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)"
              : "linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.3,
            zIndex: 1,
          }}
        />

        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <LogoIcon />
            <span
              style={{
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "-0.5px",
                color: isDarkMode ? "#fff" : "#111827",
              }}
            >
              CI-Insight
            </span>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2, maxWidth: "480px" }}>
          <h2
            style={{
              fontSize: "42px",
              fontWeight: 800,
              lineHeight: "1.1",
              marginBottom: "24px",
              backgroundImage: isDarkMode
                ? "linear-gradient(to right, #fff, #9ca3af)"
                : "linear-gradient(to right, #111827, #4B5563)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            Transform your shipping velocity.
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: isDarkMode ? "#a1a1aa" : "#4B5563",
              lineHeight: "1.6",
            }}
          >
            &ldquo;CI-Insight gave us the visibility we needed to cut our build
            times by 60% in the first week. It&apos;s not just a tool, it&apos;s
            a superpower for DevOps.&rdquo;
          </p>
          <div
            style={{
              marginTop: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(45deg, #06b6d4, #8b5cf6)",
                padding: "2px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Image
                src="https://i.pravatar.cc/100?img=33"
                alt="User"
                width={40}
                height={40}
                style={{ borderRadius: "50%", border: "2px solid #fff" }}
              />
            </div>
            <div>
              <div
                style={{
                  color: isDarkMode ? "#fff" : "#111827",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Alex Chen
              </div>
              <div
                style={{
                  color: isDarkMode ? "#71717a" : "#6B7280",
                  fontSize: "12px",
                }}
              >
                Lead DevOps Engineer, TechFlow
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            gap: "24px",
            fontSize: "12px",
            color: isDarkMode ? "#52525b" : "#9CA3AF",
          }}
        >
          <span>© 2026 CI-Insight Inc.</span>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div
        style={{
          flex: "0 0 500px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px",
          position: "relative",
          backgroundColor: "var(--bg-card)",
        }}
        className="auth-form-panel"
      >
        {/* Theme Toggle */}
        <div
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            zIndex: 20,
          }}
        >
          <button
            onClick={toggleTheme}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            {isDarkMode ? <IconSun /> : <IconMoon />}
          </button>
        </div>

        <div style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}>
          <div style={{ marginBottom: "32px" }}>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 800,
                marginBottom: "8px",
                color: "var(--text-primary)",
              }}
            >
              {emailConfirmationSent
                ? "Confirm your email"
                : "Create an account"}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
              {emailConfirmationSent
                ? `We've sent a confirmation email to ${email}. Click the link to verify your account.`
                : "Start your 14-day free trial. No credit card required."}
            </p>
          </div>

          {emailConfirmationSent ? (
            <div style={{ marginTop: "24px" }}>
              <div
                style={{
                  padding: "16px",
                  marginBottom: "20px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#22c55e",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                <strong>✓ Check your email!</strong>
                <br />
                We've sent a confirmation link to <strong>{email}</strong>.
                <br />
                Click it to activate your account and start using CI-Insight.
              </div>

              <div
                style={{
                  padding: "16px",
                  marginBottom: "20px",
                  borderRadius: "8px",
                  backgroundColor: isDarkMode
                    ? "rgba(59, 130, 246, 0.1)"
                    : "rgba(59, 130, 246, 0.05)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  color: isDarkMode ? "#60a5fa" : "#3b82f6",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                <strong>Didn't receive the email?</strong>
                <br />
                Check your spam folder or{" "}
                <button
                  onClick={() => setEmailConfirmationSent(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "inherit",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  try signing up again
                </button>
              </div>

              <p
                style={{
                  textAlign: "center",
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  marginTop: "32px",
                }}
              >
                Remember your password?{" "}
                <a
                  href="/auth/login"
                  style={{ color: "var(--accent-cyan)", fontWeight: 600 }}
                >
                  Sign In
                </a>
              </p>
            </div>
          ) : (
            <>
              {authError && (
                <div
                  style={{
                    padding: "12px",
                    marginBottom: "20px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                    fontSize: "14px",
                  }}
                >
                  {authError}
                </div>
              )}

              <form
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
                onSubmit={handleSignUp}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <Input
                    label="First Name"
                    placeholder="John"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFirstName(e.target.value)
                    }
                  />
                  <Input
                    label="Last Name"
                    placeholder="Doe"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLastName(e.target.value)
                    }
                  />
                </div>
                <Input
                  label="Work Email"
                  placeholder="name@company.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                />
                <Input
                  label="Password"
                  placeholder="Create a password"
                  type="password"
                  required
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                />

                <Button
                  style={{ width: "100%", height: "48px", fontSize: "16px" }}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <div
                style={{
                  marginTop: "32px",
                  position: "relative",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    height: "1px",
                    backgroundColor: "var(--border)",
                  }}
                />
                <span
                  style={{
                    position: "relative",
                    backgroundColor: "var(--bg-card)",
                    padding: "0 12px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Or register with
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginTop: "24px",
                }}
              >
                <Button
                  variant="secondary"
                  style={{ height: "44px" }}
                  onClick={handleGitHubSignIn}
                  type="button"
                  disabled={loading}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ marginRight: "8px" }}
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </Button>
                <Button
                  variant="secondary"
                  style={{ height: "44px" }}
                  onClick={handleGoogleSignIn}
                  type="button"
                  disabled={loading}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ marginRight: "8px" }}
                  >
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.228 1.216-3.144 2.344-6.392 2.344-5.148 0-9.144-4.128-9.144-9.272s3.996-9.272 9.144-9.272c2.788 0 4.884 1.1 6.332 2.476L20.66 2.38C18.664.484 15.936 0 12.48 0 5.692 0 0 5.692 0 12.48s5.692 12.48 12.48 12.48c3.704 0 6.504-1.224 8.712-3.52 2.28-2.28 3.016-5.492 3.016-8.08 0-.768-.06-1.504-.192-2.224l-11.536.004z" />
                  </svg>
                  Google
                </Button>
              </div>

              <p
                style={{
                  textAlign: "center",
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  marginTop: "32px",
                }}
              >
                Already have an account?{" "}
                <a
                  href="/auth/login"
                  style={{ color: "var(--accent-cyan)", fontWeight: 600 }}
                >
                  Sign In
                </a>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .auth-visual-panel {
            display: none !important;
          }
          .auth-form-panel {
             flex: 1 !important;
             max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
