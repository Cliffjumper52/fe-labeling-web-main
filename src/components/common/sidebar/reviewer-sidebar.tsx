import { NavLink } from "react-router-dom";

export default function ReviewerSidebar() {
  const links = [
    { label: "Review Queue", to: "/reviewer/queue" },
    { label: "Reports", to: "/reviewer/reports" },
  ];

  return (
    <nav className="h-full">
      <div className="sidebar-section">Workspace</div>
      <ul className="flex flex-col gap-1 px-3 pb-4 text-sm">
<<<<<<< Updated upstream
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
=======
        {links.map((item) => {
          const isActive =
            item.to === "/reviewer/queue"
              ? location.pathname === "/reviewer" ||
                location.pathname.startsWith("/reviewer/queue")
              : location.pathname.startsWith(item.to);

          return (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => navigate(item.to)}
                className={`nav-item w-full ${isActive ? "nav-item--active" : ""}`}
              >
                <span className="nav-item__dot" />
                {item.label}
              </button>
            </li>
          );
        })}
>>>>>>> Stashed changes
      </ul>
    </nav>
  );
}
