import { useEffect, useState, type ReactNode } from "react";

const VARIANTS = {
  primary:
    "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white border-transparent focus-visible:ring-indigo-500",
  danger:
    "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-transparent focus-visible:ring-red-500",
  warning:
    "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white border-transparent focus-visible:ring-amber-400",
  success:
    "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border-transparent focus-visible:ring-emerald-500",
  ghost:
    "bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 border-slate-300 focus-visible:ring-slate-400",
  outline:
    "bg-white hover:bg-slate-50 active:bg-slate-100 text-indigo-600 border-indigo-400 hover:border-indigo-500 focus-visible:ring-indigo-400",
} as const;

const SIZES = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2.5",
} as const;

const MODAL_CONFIRM_VARIANTS = {
  primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  warning: "bg-amber-500 hover:bg-amber-600 text-white",
  success: "bg-emerald-600 hover:bg-emerald-700 text-white",
  ghost: "bg-indigo-600 hover:bg-indigo-700 text-white",
  outline: "bg-indigo-600 hover:bg-indigo-700 text-white",
} as const;

type ConfirmVariant = keyof typeof VARIANTS;
type ConfirmSize = keyof typeof SIZES;

type ConfirmButtonProps = {
  label?: ReactNode;
  variant?: ConfirmVariant;
  size?: ConfirmSize;
  modalHeader?: ReactNode;
  modalBody?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
};

/**
 * ConfirmButton
 *
 * Props:
 *  - label          {string}   Button text. Default: "Confirm"
 *  - variant        {string}   "primary" | "danger" | "warning" | "success" | "ghost" | "outline"
 *  - size           {string}   "sm" | "md" | "lg"
 *  - modalHeader    {string}   Title shown inside the confirmation modal
 *  - modalBody      {string}   Description text inside the modal
 *  - confirmLabel   {string}   Text for the confirm action button
 *  - cancelLabel    {string}   Text for the cancel button
 *  - onConfirm      {function} Called when the user clicks Confirm
 *  - onCancel       {function} Called when the user dismisses the modal
 *  - disabled       {boolean}
 *  - icon           {ReactNode} Optional leading icon
 */
export function ConfirmButton({
  label = "Confirm",
  variant = "primary",
  size = "md",
  modalHeader = "Are you sure?",
  modalBody = "This action cannot be undone. Please confirm to continue.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  disabled = false,
  icon,
  className,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => !disabled && setOpen(true);

  const handleCancel = () => {
    if (loading) return;
    setOpen(false);
    onCancel?.();
  };

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        handleCancel();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, loading]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm?.();
      setOpen(false);
    } catch {
      // Keep modal open if confirm action fails so user can retry.
    } finally {
      setLoading(false);
    }
  };

  const buttonBase =
    "inline-flex items-center justify-center font-medium rounded-lg border " +
    "transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:cursor-not-allowed select-none";

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`${buttonBase} ${VARIANTS[variant] ?? VARIANTS.primary} ${
          SIZES[size] ?? SIZES.md
        } ${className ?? ""}`}
      >
        {icon && <span className="shrink-0 w-4 h-4">{icon}</span>}
        {label}
      </button>

      {/* Modal Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15,23,42,0.45)" }}
          onClick={(e) =>
            !loading && e.target === e.currentTarget && handleCancel()
          }
        >
          {/* Modal Panel */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
          >
            {/* Accent strip */}
            <div
              className={`h-1 w-full ${
                variant === "danger"
                  ? "bg-red-500"
                  : variant === "warning"
                    ? "bg-amber-400"
                    : variant === "success"
                      ? "bg-emerald-500"
                      : "bg-indigo-500"
              }`}
            />

            <div className="px-6 pt-5 pb-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-lg font-semibold text-slate-900 leading-snug">
                  {modalHeader}
                </h2>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {modalBody}
              </p>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                    MODAL_CONFIRM_VARIANTS[variant] ??
                    MODAL_CONFIRM_VARIANTS.primary
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin w-4 h-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                        />
                      </svg>
                      Processing…
                    </span>
                  ) : (
                    confirmLabel
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
