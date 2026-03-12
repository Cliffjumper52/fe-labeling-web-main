import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  createAccount,
  deleteAccount,
  getAccountPaginated,
  updateAccount,
} from "../../services/account-service.service";
import type { AccountStatus, Role } from "../../interface/enums/domain.enums";

type ApiEnvelope<T> = {
  data?: T;
  message?: string | string[];
};

type PaginatedPayload<T> = {
  data: T[];
  totalPages?: number;
  currentPage?: number;
};

type AccountItem = {
  id: string;
  username: string;
  email: string;
  role: Role;
  status: AccountStatus;
  createdAt?: string;
};

type AccountForm = {
  username: string;
  email: string;
  role: Role;
  status: AccountStatus;
};

const defaultForm: AccountForm = {
  username: "",
  email: "",
  role: "annotator",
  status: "active",
};

const normalize = <T,>(raw: unknown): PaginatedPayload<T> => {
  const env = raw as ApiEnvelope<PaginatedPayload<T>>;
  return {
    data: env?.data?.data ?? [],
    totalPages: env?.data?.totalPages,
    currentPage: env?.data?.currentPage,
  };
};

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<AccountForm>(defaultForm);

  const [editing, setEditing] = useState<AccountItem | null>(null);
  const [editForm, setEditForm] = useState<AccountForm>(defaultForm);

  const fetchAccounts = async (nextPage = page) => {
    setLoading(true);
    try {
      const resp = await getAccountPaginated({
        page: nextPage,
        limit: 20,
        search: search.trim() || undefined,
        searchBy: "username",
        orderBy: "createdAt",
        order: "DESC",
      });

      const payload = normalize<AccountItem>(resp?.data ?? resp);
      setAccounts(payload.data);
      setPage(payload.currentPage ?? nextPage);
      setTotalPages(Math.max(1, payload.totalPages ?? 1));
    } catch {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAccounts(1);
  }, []);

  const filteredAccounts = useMemo(
    () =>
      accounts.filter((item) => {
        const byRole = roleFilter === "all" || item.role === roleFilter;
        const byStatus =
          statusFilter === "all" || item.status === statusFilter;
        return byRole && byStatus;
      }),
    [accounts, roleFilter, statusFilter],
  );

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createAccount(createForm);
      toast.success("Account created");
      setIsCreateOpen(false);
      setCreateForm(defaultForm);
      await fetchAccounts(1);
    } catch {
      toast.error("Cannot create account");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: AccountItem) => {
    setEditing(item);
    setEditForm({
      username: item.username,
      email: item.email,
      role: item.role,
      status: item.status,
    });
  };

  const onUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;

    setSaving(true);
    try {
      await updateAccount(editing.id, editForm);
      toast.success("Account updated");
      setEditing(null);
      await fetchAccounts(page);
    } catch {
      toast.error("Cannot update account");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Delete this account?")) return;
    try {
      await deleteAccount(id);
      toast.success("Account deleted");
      await fetchAccounts(page);
    } catch {
      toast.error("Cannot delete account");
    }
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-800">Accounts</h2>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setIsCreateOpen(true)}
        >
          New account
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search username..."
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          title="Filter by role"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value as Role | "all")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All roles</option>
          <option value="admin">admin</option>
          <option value="manager">manager</option>
          <option value="reviewer">reviewer</option>
          <option value="annotator">annotator</option>
        </select>
        <select
          title="Filter by status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as AccountStatus | "all")
          }
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All status</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="need_change_password">need_change_password</option>
        </select>
        <button
          type="button"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold"
          onClick={() => void fetchAccounts(1)}
        >
          Refresh
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.3fr_2fr_1fr_1fr_1fr] gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
          <span>Username</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-500">Loading accounts...</div>
        ) : filteredAccounts.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">No accounts found.</div>
        ) : (
          filteredAccounts.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1.3fr_2fr_1fr_1fr_1fr] gap-2 border-b px-4 py-3 text-sm last:border-b-0"
            >
              <span className="font-medium text-gray-800">{item.username}</span>
              <span>{item.email}</span>
              <span>{item.role}</span>
              <span>{item.status}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => openEdit(item)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => void onDelete(item.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={page <= 1}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          onClick={() => void fetchAccounts(page - 1)}
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          onClick={() => void fetchAccounts(page + 1)}
        >
          Next
        </button>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form
            onSubmit={onCreate}
            className="flex w-full max-w-md flex-col gap-3 rounded-lg bg-white p-4 shadow-xl"
          >
            <h3 className="text-sm font-semibold text-gray-800">Create account</h3>
            <input
              required
              value={createForm.username}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, username: event.target.value }))
              }
              placeholder="Username"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              required
              type="email"
              value={createForm.email}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="Email"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              title="Create role"
              value={createForm.role}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, role: event.target.value as Role }))
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="admin">admin</option>
              <option value="manager">manager</option>
              <option value="reviewer">reviewer</option>
              <option value="annotator">annotator</option>
            </select>
            <select
              title="Create status"
              value={createForm.status}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  status: event.target.value as AccountStatus,
                }))
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="need_change_password">need_change_password</option>
            </select>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form
            onSubmit={onUpdate}
            className="flex w-full max-w-md flex-col gap-3 rounded-lg bg-white p-4 shadow-xl"
          >
            <h3 className="text-sm font-semibold text-gray-800">Edit account</h3>
            <input
              required
              value={editForm.username}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, username: event.target.value }))
              }
              placeholder="Username"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              required
              type="email"
              value={editForm.email}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="Email"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              title="Edit role"
              value={editForm.role}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, role: event.target.value as Role }))
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="admin">admin</option>
              <option value="manager">manager</option>
              <option value="reviewer">reviewer</option>
              <option value="annotator">annotator</option>
            </select>
            <select
              title="Edit status"
              value={editForm.status}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  status: event.target.value as AccountStatus,
                }))
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="need_change_password">need_change_password</option>
            </select>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
