import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getAccountById } from "../../services/account-service.service";
import type { Account } from "../../interface/account/account.interface";

const formatRole = (role?: string) =>
  role ? role.charAt(0).toUpperCase() + role.slice(1) : "Unknown";

const getRoleBadgeClass = (role?: string) => {
  switch (role) {
    case "admin":
      return "border-rose-300 bg-rose-50 text-rose-700";
    case "manager":
      return "border-sky-300 bg-sky-50 text-sky-700";
    case "annotator":
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    case "reviewer":
      return "border-violet-300 bg-violet-50 text-violet-700";
    default:
      return "border-slate-300 bg-slate-50 text-slate-700";
  }
};

const getStatusBadgeClass = (status?: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "inactive":
      return "bg-red-100 text-red-700";
    case "need_change_password":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const formatStatus = (status?: string) => {
  if (!status) return "Unknown";
  if (status === "need_change_password") return "Need Change Password";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function AdminAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const resp = await getAccountById(id);
        const raw = resp as { data?: { data?: Account } | Account };
        const data =
          (raw?.data as { data?: Account } | undefined)?.data ??
          (raw?.data as Account | undefined) ??
          null;
        setAccount(data);
      } catch {
        toast.error("Unable to load account details.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [id]);

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/admin/accounts")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Accounts
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!isLoading && account && (
        <div className="bg-white rounded-lg shadow p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Account Details
            </h2>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(account.role)}`}
            >
              {formatRole(account.role)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-400 mb-1">Username</p>
              <p className="text-sm font-medium text-gray-800">
                {account.username ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Email</p>
              <p className="text-sm font-medium text-gray-800">
                {account.email}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <span
                className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(account.status)}`}
              >
                {formatStatus(account.status)}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Account ID</p>
              <p className="text-sm text-gray-500 font-mono break-all">
                {account.id}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !account && (
        <div className="text-center py-12 text-gray-400 text-sm">
          Account not found.
        </div>
      )}
    </section>
  );
}
