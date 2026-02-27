import { NavLink } from "react-router-dom";

const adminActions = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Accounts", to: "/admin/accounts" },
  { label: "Projects", to: "/admin/projects" },
  { label: "Labels", to: "/admin/labels" },
  { label: "Presets", to: "/admin/presets" },
];

export default function AdminSidebar() {
  return (
    <nav className="h-full">
      <div className="sidebar-section">Administration</div>
      <ul className="flex flex-col gap-1 px-3 pb-4 text-sm">
        {adminActions.map((item) => (
          <li key={item.label}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item--active" : ""}`
              }
            >
              <span className="nav-item__dot" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
