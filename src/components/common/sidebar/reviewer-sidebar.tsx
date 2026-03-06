import { useLocation, useNavigate } from "react-router-dom";

export default function ReviewerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { label: "Review Queue", to: "/reviewer" },
    { label: "Reports", to: "/reviewer/reports" },
  ];

  return (
    <nav className="h-full">
      <div className="sidebar-section">Workspace</div>
      <ul className="flex flex-col gap-1 px-3 pb-4 text-sm">
        {links.map((item) => {
          const isActive =
            item.to === "/reviewer"
              ? location.pathname === "/reviewer"
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
      </ul>
    </nav>
  );
}
