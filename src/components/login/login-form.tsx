import React, { useState } from "react";

interface LoginFormProps {
  onLogin: (email: string, password: string, rememberMe: boolean) => void;
  initialEmail?: string;
  initialPassword?: string;
  initialRememberMe?: boolean;
  isLoading?: boolean;
  canSubmit?: boolean;
  handleForgotPassword?: () => void;
}

export default function LoginForm({
  onLogin,
  initialEmail = "",
  initialPassword = "",
  initialRememberMe = false,
  isLoading = false,
  canSubmit = true,
  handleForgotPassword,
}: LoginFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(initialRememberMe);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email.trim(), password, rememberMe);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="login-field">
        <label htmlFor="email" className="login-label">
          Email address
        </label>
        <div className="login-input-wrap">
          <div className="login-input-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
              <path d="m22 8-10 6L2 8" />
            </svg>
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="login-input"
            required
          />
        </div>
      </div>

      <div className="login-field">
        <label htmlFor="password" className="login-label">
          Password
        </label>
        <div className="login-input-wrap">
          <div className="login-input-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••••••"
            className="login-input"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="login-eye"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {showPassword ? (
                <>
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              ) : (
                <>
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 5.1a9 9 0 0 1 10.1 6.9 9.3 9.3 0 0 1-3 4.3" />
                  <path d="M6.1 6.1A9.3 9.3 0 0 0 2 12s3.5 6 10 6a9.8 9.8 0 0 0 4.4-1" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      <div className="login-row">
        <label className="login-remember">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Remember me
        </label>
        <button
          type="button"
          className="login-forgot"
          onClick={handleForgotPassword}
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading || !canSubmit}
        className={`login-submit ${
          isLoading || !canSubmit
            ? "opacity-60 cursor-not-allowed"
            : "hover:brightness-110"
        }`}
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
