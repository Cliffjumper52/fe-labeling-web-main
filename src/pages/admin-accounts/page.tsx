import { useState, type FormEvent, type Dispatch, type SetStateAction } from "react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Reviewer" | "Annotator";
  status: "Active" | "Suspended";
  phone: string;
};

const initialUsers: AdminUser[] = [
  {
    id: "user-1",
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    role: "Manager",
    status: "Active",
    phone: "+1 415 555 0182",
  },
  {
    id: "user-2",
    name: "Riley Chen",
    email: "riley.chen@example.com",
    role: "Annotator",
    status: "Active",
    phone: "+1 646 555 0119",
  },
  {
    id: "user-3",
    name: "Jordan Patel",
    email: "jordan.patel@example.com",
    role: "Reviewer",
    status: "Suspended",
    phone: "+1 212 555 0196",
  },
];

export default function AdminAccountsPage() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const hasUsers = users.length > 0;
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<AdminUser["role"]>(
    "Annotator",
  );
  const [newUserPhone, setNewUserPhone] = useState("");
  const [closingModals, setClosingModals] = useState<Record<string, boolean>>(
    {},
  );

  const handleCreateUser = (event: FormEvent) => {
    event.preventDefault();
    setUsers((prev) => [
      {
        id: crypto.randomUUID(),
        name: newUserName.trim() || "Unnamed User",
        email: newUserEmail.trim(),
        role: newUserRole,
        status: "Active",
        phone: newUserPhone.trim(),
      },
      ...prev,
    ]);
    setIsCreateUserOpen(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserRole("Annotator");
    setNewUserPhone("");
  };

  const closeWithAnimation = (
    key: string,
    closeFn: Dispatch<SetStateAction<boolean>>,
  ) => {
    setClosingModals((prev) => ({ ...prev, [key]: true }));
    window.setTimeout(() => {
      closeFn(false);
      setClosingModals((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 200);
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Accounts</h2>
        <button
          type="button"
          onClick={() => setIsCreateUserOpen(true)}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          <span className="text-lg leading-none">+</span>
          New User
        </button>
      </div>

      <div className="mb-4 h-px w-full bg-gray-200" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Search</label>
          <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className="w-full text-sm outline-none placeholder:text-gray-400"
              placeholder="Search users..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Role</label>
          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm">
            <option>All</option>
            <option>Admin</option>
            <option>Manager</option>
            <option>Reviewer</option>
            <option>Annotator</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Status</label>
          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm">
            <option>All</option>
            <option>Active</option>
            <option>Suspended</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Order by</label>
          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm">
            <option>Name</option>
            <option>Created</option>
            <option>Updated</option>
          </select>
        </div>
      </div>

      {!hasUsers ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-gray-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">No Users Yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Invite your first team member to get started
          </p>
          <button
            type="button"
            onClick={() => setIsCreateUserOpen(true)}
            className="mt-5 flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            <span className="text-base leading-none">+</span>
            Invite User
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.6fr_2fr_1fr_1fr_1fr] items-center gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[1.6fr_2fr_1fr_1fr_1fr] items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0"
            >
              <span className="font-medium text-gray-800">{user.name}</span>
              <span className="text-gray-700">{user.email}</span>
              <span className="text-gray-700">{user.role}</span>
              <span
                className={`w-fit rounded-md px-3 py-1 text-xs font-semibold ${
                  user.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {user.status}
              </span>
              <div className="flex items-center gap-3 text-sm font-semibold">
                <button type="button" className="text-blue-600 hover:text-blue-700">
                  Details
                </button>
                <button type="button" className="text-blue-600 hover:text-blue-700">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className={`w-full max-w-md rounded-lg border border-gray-300 bg-white shadow-xl ${
              closingModals.createUser ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">Create new user</h3>
              <button
                type="button"
                onClick={() => closeWithAnimation("createUser", setIsCreateUserOpen)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6l-12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">
                  User name
                </label>
                <input
                  value={newUserName}
                  onChange={(event) => setNewUserName(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">Gmail</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(event) => setNewUserEmail(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="name@gmail.com"
                  pattern="^[^@\s]+@gmail\.com$"
                  title="Enter a valid Gmail address (name@gmail.com)"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">Roles</label>
                <select
                  value={newUserRole}
                  onChange={(event) =>
                    setNewUserRole(event.target.value as AdminUser["role"])
                  }
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>Reviewer</option>
                  <option>Annotator</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={newUserPhone}
                  onChange={(event) => setNewUserPhone(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="+1 555 000 1234"
                  pattern="^\+?[0-9\s-]{8,15}$"
                  title="Use 8-15 digits; spaces, dashes, and optional leading + are allowed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => closeWithAnimation("createUser", setIsCreateUserOpen)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
