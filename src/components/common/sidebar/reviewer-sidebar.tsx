import React from "react";

export default function ReviewerSidebar() {
  const links = [
    { label: "Review Queue", active: true },
    { label: "Reports", active: false },
  ];

  return (
    <nav className="h-full">
      <div className="sidebar-section">Reviewer</div>
      <ul className="flex flex-col gap-1 px-3 pb-4 text-sm">
        {links.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              className={`nav-item w-full ${item.active ? "nav-item--active" : ""}`}
            >
              <span className="nav-item__dot" />
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
