import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { resetPassword } from "../../services/auth-service";

const RESET_PASSWORD_LAST_SENT_AT_KEY = "resetPasswordLastSentAt";
const RESET_PASSWORD_COOLDOWN_MS = 5 * 60 * 1000;

const getRemainingCooldownMs = (): number => {
  const stored = localStorage.getItem(RESET_PASSWORD_LAST_SENT_AT_KEY);
  if (!stored) {
    return 0;
  }

  const lastSentAt = Number(stored);
  if (!Number.isFinite(lastSentAt)) {
    localStorage.removeItem(RESET_PASSWORD_LAST_SENT_AT_KEY);
    return 0;
  }

  return Math.max(0, lastSentAt + RESET_PASSWORD_COOLDOWN_MS - Date.now());
};

const formatCooldown = (milliseconds: number): string => {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export default function Page() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState("");
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingCooldownMs, setRemainingCooldownMs] = useState<number>(() =>
    getRemainingCooldownMs(),
  );

  useEffect(() => {
    if (remainingCooldownMs <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      const remaining = getRemainingCooldownMs();
      setRemainingCooldownMs(remaining);

      if (remaining <= 0) {
        window.clearInterval(timer);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remainingCooldownMs]);

  const isInCooldown = remainingCooldownMs > 0;
  const trimmedEmail = email.trim();
  const canSubmit = trimmedEmail.length > 0 && !isInCooldown && !isSubmitting;
  const cooldownText = useMemo(
    () => formatCooldown(remainingCooldownMs),
    [remainingCooldownMs],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!trimmedEmail) {
      toast.error("Please enter your email.");
      return;
    }

    if (isInCooldown) {
      toast.error(`Please wait ${cooldownText} before sending again.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(trimmedEmail);
      const now = Date.now();
      localStorage.setItem(RESET_PASSWORD_LAST_SENT_AT_KEY, String(now));
      setRemainingCooldownMs(RESET_PASSWORD_COOLDOWN_MS);
      setLastSubmittedEmail(trimmedEmail);
      setHasSentRequest(true);
      toast.success("Reset email sent. Please check your inbox.");
    } catch {
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card-wrapper">
        <div className="login-title-wrap">
          <p className="login-kicker">Account Recovery</p>
          <h1 className="login-title">Forgot Password</h1>
        </div>

        <div className="login-card p-8">
          <div className="w-full max-w-md space-y-5">
            <p className="text-sm text-slate-600">
              Enter your account email to receive a password reset link.
            </p>

            {hasSentRequest ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  Reset link sent to <strong>{lastSubmittedEmail}</strong>.
                </div>

                {isInCooldown && (
                  <p className="text-sm text-amber-700">
                    You can send another request in {cooldownText}.
                  </p>
                )}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setHasSentRequest(false)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:brightness-110"
                  >
                    Return to login
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="forgot-password-email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>
                  <input
                    id="forgot-password-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="example@email.com"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                    required
                  />
                </div>

                {isInCooldown && (
                  <p className="text-sm text-amber-700">
                    You can request another email in {cooldownText}.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Sending..."
                    : isInCooldown
                      ? `Wait ${cooldownText}`
                      : "Send reset email"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Return to login
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
