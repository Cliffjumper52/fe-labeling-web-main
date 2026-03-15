import {
  useEffect,
  useState,
  type FormEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import {
  createAdminAccount,
  deleteAdminAccount,
  fetchAdminAccounts,
  updateAdminAccount,
} from "../../services/admin-service";
import { ConfirmButton } from "../../components/common/confirm-modal";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Reviewer" | "Annotator";
  status: "Active" | "Inactive" | "Need Change Password";
};

export default function AdminAccountsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasUsers = users.length > 0;
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] =
    useState<AdminUser["role"]>("Annotator");
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] =
    useState<AdminUser["role"]>("Annotator");
  const [editUserStatus, setEditUserStatus] =
    useState<AdminUser["status"]>("Active");
  const [closingModals, setClosingModals] = useState<Record<string, boolean>>(
    {},
  );

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const created = await createAdminAccount({
        name: newUserName.trim() || "Unnamed User",
        email: newUserEmail.trim(),
        role: newUserRole,
        status: "Active",
      });
      setUsers((prev) => [created as AdminUser, ...prev]);
      toast.success("User created successfully.");
    } catch {
      toast.error("Create user failed.");
      return;
    }

    setIsCreateUserOpen(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserRole("Annotator");
  };

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    const loadUsers = async () => {
      try {
        const remoteUsers = await fetchAdminAccounts();
        if (mounted && remoteUsers.length > 0) {
          setUsers(remoteUsers as AdminUser[]);
        }
      } catch {
        if (mounted) {
          toast.error("Failed to load accounts from API.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      mounted = false;
    };
  }, []);

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

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteAdminAccount(userId);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      toast.success("User deleted.");
    } catch {
      toast.error("Delete user failed.");
    }
  };

  const resetEditForm = () => {
    setEditingUserId(null);
    setEditUserName("");
    setEditUserEmail("");
    setEditUserRole("Annotator");
    setEditUserStatus("Active");
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUserId(user.id);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserRole(user.role);
    setEditUserStatus(user.status);
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingUserId) {
      return;
    }

    const updatedPayload = {
      name: editUserName.trim() || "Unnamed User",
      email: editUserEmail.trim(),
      role: editUserRole,
      status: editUserStatus,
    };

    try {
      const remoteUpdated = await updateAdminAccount(
        editingUserId,
        updatedPayload,
      );
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUserId ? (remoteUpdated as AdminUser) : user,
        ),
      );
      toast.success("User updated.");
    } catch {
      toast.error("Update user failed.");
      return;
    }

    setIsEditUserOpen(false);
    resetEditForm();
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

      {isLoading && (
        <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Loading accounts from API...
        </div>
      )}

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
          <select
            title="Filter by role"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option>All</option>
            <option>Admin</option>
            <option>Manager</option>
            <option>Reviewer</option>
            <option>Annotator</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Status</label>
          <select
            title="Filter by status"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option>All</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Need Change Password</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">
            Order by
          </label>
          <select
            title="Order users"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option>Name</option>
            <option>Date created</option>
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
                    : user.status === "Need Change Password"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {user.status}
              </span>
              <div className="flex items-center gap-3 text-sm font-semibold">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(user)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
                <ConfirmButton
                  label="Delete"
                  variant="danger"
                  size="sm"
                  className="!h-auto !border-0 !bg-transparent !p-0 text-red-500 hover:text-red-600 hover:!bg-transparent"
                  modalHeader="Delete this account?"
                  modalBody={`Are you sure you want to delete ${user.name}? This action cannot be undone.`}
                  confirmLabel="Delete"
                  onConfirm={() => handleDeleteUser(user.id)}
                />
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
              <h3 className="text-sm font-semibold text-gray-800">
                Create new user
              </h3>
              <button
                type="button"
                onClick={() =>
                  closeWithAnimation("createUser", setIsCreateUserOpen)
                }
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

            <form
              onSubmit={handleCreateUser}
              className="flex flex-col gap-4 p-4"
            >
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
                <label className="text-xs font-semibold text-gray-700">
                  Gmail
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(event) => setNewUserEmail(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="name@email.com"
                  title="Enter a valid Email Accounts"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">
                  Roles
                </label>
                <select
                  value={newUserRole}
                  onChange={(event) =>
                    setNewUserRole(event.target.value as AdminUser["role"])
                  }
                  title="New user role"
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>Reviewer</option>
                  <option>Annotator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    closeWithAnimation("createUser", setIsCreateUserOpen)
                  }
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

      {isEditUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className={`w-full max-w-md rounded-lg border border-gray-300 bg-white shadow-xl ${
              closingModals.editUser ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">Edit user</h3>
              <button
                type="button"
                onClick={() => {
                  closeWithAnimation("editUser", setIsEditUserOpen);
                  resetEditForm();
                }}
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

            <form
              onSubmit={handleUpdateUser}
              className="flex flex-col gap-4 p-4"
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">
                  User name
                </label>
                <input
                  value={editUserName}
                  onChange={(event) => setEditUserName(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">
                  Gmail
                </label>
                <input
                  type="email"
                  value={editUserEmail}
                  onChange={(event) => setEditUserEmail(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="name@gmail.com"
                  pattern="^[^@\s]+@gmail\.com$"
                  title="Enter a valid Gmail address (name@gmail.com)"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">
                  Roles
                </label>
                <select
                  value={editUserRole}
                  onChange={(event) =>
                    setEditUserRole(event.target.value as AdminUser["role"])
                  }
                  title="Edit user role"
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
                  Status
                </label>
                <select
                  value={editUserStatus}
                  onChange={(event) =>
                    setEditUserStatus(event.target.value as AdminUser["status"])
                  }
                  title="Edit user status"
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Need Change Password</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    closeWithAnimation("editUser", setIsEditUserOpen);
                    resetEditForm();
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
