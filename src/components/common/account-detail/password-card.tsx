import EyeIcon from "../account-detail/eye-icon";

type PasswordCardProps = {
  showPasswordForm: boolean;
  onTogglePasswordForm: () => void;
  currentPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  newPassword: string;
  onNewPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  showCurrentPassword: boolean;
  onToggleShowCurrentPassword: () => void;
  showNewPassword: boolean;
  onToggleShowNewPassword: () => void;
  showConfirmPassword: boolean;
  onToggleShowConfirmPassword: () => void;
  isUpdatingPassword: boolean;
  onUpdatePassword: () => Promise<void>;
};

export default function PasswordCard({
  showPasswordForm,
  onTogglePasswordForm,
  currentPassword,
  onCurrentPasswordChange,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  showCurrentPassword,
  onToggleShowCurrentPassword,
  showNewPassword,
  onToggleShowNewPassword,
  showConfirmPassword,
  onToggleShowConfirmPassword,
  isUpdatingPassword,
  onUpdatePassword,
}: PasswordCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Update password
        </h2>
        <button
          type="button"
          onClick={onTogglePasswordForm}
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
                onChange={(event) =>
                  onCurrentPasswordChange(event.target.value)
                }
                placeholder="Current password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
              <button
                type="button"
                onClick={onToggleShowCurrentPassword}
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
                onChange={(event) => onNewPasswordChange(event.target.value)}
                placeholder="New password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
              <button
                type="button"
                onClick={onToggleShowNewPassword}
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
                onChange={(event) =>
                  onConfirmPasswordChange(event.target.value)
                }
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
              <button
                type="button"
                onClick={onToggleShowConfirmPassword}
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
                void onUpdatePassword();
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
  );
}
