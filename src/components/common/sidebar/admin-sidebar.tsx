import { NavLink } from "react-router-dom";

const adminActions = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Account", to: "/admin/accounts" },
  { label: "Project", to: "/admin/projects" },
  { label: "Label", to: "/admin/labels" },
  { label: "Preset", to: "/admin/presets" },
];

export default function AdminSidebar() {
  return (
    <nav className="h-full border-r border-blue-200 bg-white">
      <ul className="flex flex-col gap-1 px-3 py-4 text-sm">
        {adminActions.map((item) => (
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
