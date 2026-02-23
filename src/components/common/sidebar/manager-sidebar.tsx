import { NavLink } from "react-router-dom";

export default function ManagerSidebar() {
  const links = [
    { label: "Projects", to: "/manager/projects" },
    { label: "Labels", to: "/manager/labels" },
    { label: "Preset", to: "/manager/presets" },
  ];

  return (
    <nav className="h-full border-r border-blue-200 bg-white">
      <ul className="flex flex-col gap-1 px-3 py-4 text-sm">
        {links.map((item) => (
          <li key={item.label}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `block w-full rounded px-3 py-2 text-left transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
