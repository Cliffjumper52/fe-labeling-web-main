import React from "react";

export default function AnnotatorSidebar() {
  return (
    <nav className="h-full border-r border-blue-200 bg-white">
      <ul className="flex flex-col gap-1 px-3 py-4 text-sm">
        {[
          { label: "Projects", active: true },
          { label: "Labels", active: false },
          { label: "Preset", active: false },
        ].map((item) => (
          <li key={item.label}>
            <button
              type="button"
              className={`w-full rounded px-3 py-2 text-left transition ${
                item.active
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
