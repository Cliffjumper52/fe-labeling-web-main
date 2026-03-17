import type { Account } from "../../../interface";

type ProfileCardProps = {
  profile: Account | null;
  username: string;
  onUsernameChange: (value: string) => void;
  onSaveUsername: () => Promise<void>;
  isLoadingProfile: boolean;
  isUpdatingProfile: boolean;
  roleBadgeClassName: string;
  roleLabel: string;
};

export default function ProfileCard({
  profile,
  username,
  onUsernameChange,
  onSaveUsername,
  isLoadingProfile,
  isUpdatingProfile,
  roleBadgeClassName,
  roleLabel,
}: ProfileCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Active role
          </div>
          <div
            className={`mt-1 inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${roleBadgeClassName}`}
          >
            {roleLabel}
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
              onChange={(event) => onUsernameChange(event.target.value)}
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
            void onSaveUsername();
          }}
          disabled={isUpdatingProfile || isLoadingProfile}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUpdatingProfile ? "Saving..." : "Save username"}
        </button>
      </div>
    </div>
  );
}
