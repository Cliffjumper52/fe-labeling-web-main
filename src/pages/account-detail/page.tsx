import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/auth-context.context";
import type { Account } from "../../interface";
import { updateAccount } from "../../services/account-service.service";
import { getInfoByToken, updatePassword } from "../../services/auth-service";
import AccountHeader from "../../components/common/account-detail/account-header";
import PasswordCard from "../../components/common/account-detail/password-card";
import ProfileCard from "../../components/common/account-detail/profile-card";

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

  const roleBadgeClassName = getRoleBadgeClassName(profile?.role);
  const roleLabel = profile?.role ? formatRoleLabel(profile.role) : "Unknown";

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <AccountHeader onBack={() => navigate(roleHomePath)} />

      <ProfileCard
        profile={profile}
        username={username}
        onUsernameChange={setUsername}
        onSaveUsername={handleUpdateUsername}
        isLoadingProfile={isLoadingProfile}
        isUpdatingProfile={isUpdatingProfile}
        roleBadgeClassName={roleBadgeClassName}
        roleLabel={roleLabel}
      />

      <PasswordCard
        showPasswordForm={showPasswordForm}
        onTogglePasswordForm={() => setShowPasswordForm((prev) => !prev)}
        currentPassword={currentPassword}
        onCurrentPasswordChange={setCurrentPassword}
        newPassword={newPassword}
        onNewPasswordChange={setNewPassword}
        confirmPassword={confirmPassword}
        onConfirmPasswordChange={setConfirmPassword}
        showCurrentPassword={showCurrentPassword}
        onToggleShowCurrentPassword={() =>
          setShowCurrentPassword((prev) => !prev)
        }
        showNewPassword={showNewPassword}
        onToggleShowNewPassword={() => setShowNewPassword((prev) => !prev)}
        showConfirmPassword={showConfirmPassword}
        onToggleShowConfirmPassword={() =>
          setShowConfirmPassword((prev) => !prev)
        }
        isUpdatingPassword={isUpdatingPassword}
        onUpdatePassword={handleUpdatePassword}
      />
    </section>
  );
}
