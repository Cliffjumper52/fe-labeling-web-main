type AccountHeaderProps = {
  onBack: () => void;
};

export default function AccountHeader({ onBack }: AccountHeaderProps) {
  return (
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
        onClick={onBack}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
      >
        Back
      </button>
    </div>
  );
}
