import { NavLink } from "react-router-dom";

export default function ReviewerSidebar() {
  const links = [
<<<<<<< Updated upstream
=======
    { label: "Dashboard", to: "/reviewer" },
>>>>>>> Stashed changes
    { label: "Review Queue", to: "/reviewer/queue" },
    { label: "Reports", to: "/reviewer/reports" },
  ];

  return (
    <nav className="h-full">
      <div className="sidebar-section">Workspace</div>
      <ul className="flex flex-col gap-1 px-3 pb-4 text-sm">
<<<<<<< Updated upstream
        {links.map((item) => (
=======
        {links.map((item) => {
          const isActive =
            item.to === "/reviewer"
              ? location.pathname === "/reviewer"
              : location.pathname === item.to;

          return (
>>>>>>> Stashed changes
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
