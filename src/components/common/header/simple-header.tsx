import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SimpleHeader() {
  const navigate = useNavigate();
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date());
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsProfileOpen(false);
    navigate("/login");
  };

  return (
    <header className="app-header text-white">
      <div className="app-header__inner">
        <div className="flex items-center gap-4">
          <div className="brand-mark">
            <span className="text-lg font-bold">DL</span>
          </div>
          <div>
            <div className="brand-title">Data Label</div>
            <div className="brand-subtitle">Enterprise Studio</div>
          </div>
          <span className="header-pill">Live workspace</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="header-pill">{todayLabel}</span>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/20"
            aria-label="Notifications"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
              <path d="M10 21a2 2 0 0 0 4 0" />
            </svg>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2 py-1 hover:bg-white/20"
              aria-haspopup="menu"
              aria-expanded={isProfileOpen}
            >
              <img
                src="https://i.pravatar.cc/40?img=5"
                alt="User avatar"
                className="h-7 w-7 rounded-full"
              />
              <div className="flex flex-col items-start text-xs leading-tight">
                <span className="font-semibold text-white">Admin</span>
                <span className="text-white/60">Control room</span>
              </div>
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {isProfileOpen && (
              <div
                className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-slate-900/95 p-2 text-sm text-white shadow-lg"
                role="menu"
              >
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left hover:bg-white/10"
                  role="menuitem"
                >
                  Detail
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-red-300 hover:bg-white/10"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
