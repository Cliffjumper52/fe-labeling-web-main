import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/auth-context.context";
import { getInfoByToken, updatePassword } from "../../services/auth-service";
import { updateAccount } from "../../services/account-service.service";
import type { Account } from "../../interface";

export default function AccountDetailPage() {
  const navigate = useNavigate();
  const { getUserInfo, setUserInfo, logout } = useAuth();

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profile, setProfile] = useState<Account | null>(null);
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const roleHomePath = useMemo(() => {
    const role = getUserInfo()?.role;
    return role ? `/${role}` : "/login";
  }, [getUserInfo]);

  const formatRoleLabel = (role: string) =>
    role.charAt(0).toUpperCase() + role.slice(1);

  const getRoleBadgeClassName = (role?: string) => {
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

  const extractProfileFromResponse = (response: unknown): Account | null => {
    const raw = response as {
      data?: { data?: Account } | Account;
    };

    const account = (raw?.data as { data?: Account } | undefined)?.data
      ? (raw.data as { data: Account }).data
      : (raw?.data as Account | undefined);

    return account ?? null;
  };

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const result = await getInfoByToken();
      const account = extractProfileFromResponse(result);
      if (account) {
        setProfile(account);
        setUsername(account.username ?? "");
      }
    } catch {
      toast.error("Unable to load account details.");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleUpdateUsername = async () => {
    if (!profile?.id) {
      toast.error("Missing account information.");
      return;
    }

    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      toast.error("Username cannot be empty.");
      return;
    }

    if (normalizedUsername === profile.username) {
      toast.info("Username is unchanged.");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateAccount(profile.id, { username: normalizedUsername });
      setProfile((prev) =>
        prev ? { ...prev, username: normalizedUsername } : prev,
      );
      await setUserInfo();
      toast.success("Username updated successfully.");
    } catch {
      toast.error("Unable to update username.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!profile?.id) {
      toast.error("Missing account information.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(profile.id, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated. Please sign in again.");
      logout();
      navigate("/login", { replace: true });
    } catch {
      toast.error("Unable to update password. Check your current password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const EyeIcon = ({ isVisible }: { isVisible: boolean }) => (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      {isVisible ? (
        <>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.1a9 9 0 0 1 10.1 6.9 9.3 9.3 0 0 1-3 4.3" />
          <path d="M6.1 6.1A9.3 9.3 0 0 0 2 12s3.5 6 10 6a9.8 9.8 0 0 0 4.4-1" />
        </>
      )}
    </svg>
  );

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Account details
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review profile information and update your password.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(roleHomePath)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Active role
            </div>
            <div
              className={`mt-1 inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${getRoleBadgeClassName(
                profile?.role,
              )}`}
            >
              {profile?.role ? formatRoleLabel(profile.role) : "Unknown"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Account status
            </div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {profile?.status ?? "-"}
            </div>
          </div>
        </div>

        {isLoadingProfile ? (
          <div className="text-sm text-slate-600">Loading profile...</div>
        ) : (
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <div className="text-slate-500">Username</div>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Your username"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
            </div>
            <div>
              <div className="text-slate-500">Email</div>
              <div className="font-medium text-slate-900">
                {profile?.email ?? "-"}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Role key</div>
              <div className="font-medium uppercase tracking-wide text-slate-900">
                {profile?.role ?? "-"}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Account ID</div>
              <div className="truncate font-medium text-slate-900">
                {profile?.id ?? "-"}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              void handleUpdateUsername();
            }}
            disabled={isUpdatingProfile || isLoadingProfile}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUpdatingProfile ? "Saving..." : "Save username"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Update password
          </h2>
          <button
            type="button"
            onClick={() => setShowPasswordForm((prev) => !prev)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            {showPasswordForm ? "Hide form" : "Change password"}
          </button>
        </div>

        {showPasswordForm && (
          <>
            <div className="mt-4 space-y-3">
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Current password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-600 hover:bg-slate-100"
                  aria-label={
                    showCurrentPassword
                      ? "Hide current password"
                      : "Show current password"
                  }
                >
                  <EyeIcon isVisible={showCurrentPassword} />
                </button>
              </div>

              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-600 hover:bg-slate-100"
                  aria-label={
                    showNewPassword ? "Hide new password" : "Show new password"
                  }
                >
                  <EyeIcon isVisible={showNewPassword} />
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-600 hover:bg-slate-100"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  <EyeIcon isVisible={showConfirmPassword} />
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  void handleUpdatePassword();
                }}
                disabled={isUpdatingPassword}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdatingPassword ? "Updating..." : "Update password"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
