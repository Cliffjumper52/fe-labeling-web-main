import { NavLink } from "react-router-dom";

export default function ManagerSidebar() {
  const links = [
    { label: "Projects", to: "/manager/projects" },
    { label: "Labels", to: "/manager/labels" },
    { label: "Presets", to: "/manager/presets" },
  ];

  return (
    <nav className="h-full">
      <div className="sidebar-section">Workspace</div>
      <ul className="flex flex-col gap-1 px-3 pb-4 text-sm">
        {links.map((item) => (
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
