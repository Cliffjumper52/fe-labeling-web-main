import React, { useState } from "react";

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  initialEmail?: string;
  initialPassword?: string;
  isLoading?: boolean;
}

export default function LoginForm({
  onLogin,
  initialEmail = "",
  initialPassword = "",
  isLoading = false,
}: LoginFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-semibold text-gray-700">
          Email address
        </label>
        <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
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
            className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-semibold text-gray-700">
          Password
        </label>
        <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
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
            className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
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

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-gray-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Remember me
        </label>
        <button type="button" className="text-blue-600 hover:text-blue-700">
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`mt-2 rounded-md bg-blue-600 py-3 text-white font-semibold shadow-md transition ${
          isLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-700"
        }`}
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
