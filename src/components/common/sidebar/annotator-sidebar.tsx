import { NavLink } from "react-router-dom";

export default function AnnotatorSidebar() {
  const links = [
    { label: "My Tasks", to: "/annotator/tasks" },
    { label: "Submissions", to: "/annotator/submissions" },
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
