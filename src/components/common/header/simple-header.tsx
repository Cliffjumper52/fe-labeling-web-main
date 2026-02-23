import React from "react";

export default function SimpleHeader() {
  return (
    <header className="w-full bg-blue-600 text-white">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-blue-800 shadow">
            <span className="text-lg font-bold">DL</span>
          </div>
          <h1 className="text-lg font-semibold">Data Label</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded bg-white/10 hover:bg-white/20"
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

          <button
            type="button"
            className="flex items-center gap-2 rounded bg-white/10 px-2 py-1 hover:bg-white/20"
          >
            <img
              src="https://i.pravatar.cc/40?img=5"
              alt="User avatar"
              className="h-7 w-7 rounded-full"
            />
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
        </div>
      </div>
    </header>
  );
}
