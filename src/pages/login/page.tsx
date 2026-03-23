import { toast } from "sonner";
import { login } from "../../services/auth-service.service";
import LoginForm from "../../components/login/login-form";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth-context.context";
import { checkHealth } from "../../services/health.service";
import {
  getRememberMePreference,
  getRememberedLoginIdentifier,
  setRememberedLoginIdentifier,
} from "../../utils/auth-storage";
export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const navigate = useNavigate();
  const { setAuthTokens, setUserInfo, getUserInfo } = useAuth();
  const rememberedPreference = getRememberMePreference();
  const rememberedLoginIdentifier = getRememberedLoginIdentifier();

  useEffect(() => {
    let isMounted = true;

    const verifySystemHealth = async () => {
      setIsCheckingHealth(true);
      try {
        const resp = await checkHealth();
        if (isMounted) {
          setIsSystemReady(resp?.status === 200);
        }
      } catch {
        if (isMounted) {
          setIsSystemReady(false);
        }
      } finally {
        if (isMounted) {
          setIsCheckingHealth(false);
        }
      }
    };

    verifySystemHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => {
    if (!isSystemReady) {
      toast.error("System is not ready yet. Please wait and try again.");
      return;
    }

    // console.log(email, password);
    setIsLoading(true);
    try {
      const result = await login(email, password);
      const accessToken = result?.data?.accessToken;
      const refreshToken = result?.data?.refreshToken;
      const loginIdentifier =
        result?.data?.user?.email ?? result?.data?.user?.username ?? email;

      setAuthTokens(accessToken, refreshToken, { rememberMe });
      setRememberedLoginIdentifier(loginIdentifier, rememberMe);
      await setUserInfo(rememberMe);

      const userInfo = getUserInfo();
      const role = userInfo?.role;

      toast.success("Login successful");
      // const role = info?.data?.user?.role;

      if (role === "admin") {
        navigate("/admin");
      } else if (role === "manager") {
        navigate("/manager");
      } else if (role === "annotator") {
        navigate("/annotator");
      } else if (role === "reviewer") {
        navigate("/reviewer");
      }
    } catch {
      toast.error("Login failed. Check email/password or backend status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="login-page">
      <div className="login-card-wrapper">
        <div className="login-title-wrap">
          <p className="login-kicker">Workspace Platform</p>
          <h1 className="login-title">Data Labeling Studio</h1>
        </div>

        <div className="login-card">
          <aside className="login-aside">
            <div>
              <h2>Data Labeling Studio</h2>
              <p>
                Enterprise-grade labeling operations designed for scale. Track
                projects, manage taxonomies, and coordinate teams in one unified
                workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              <article className="flex flex-col rounded-xl border border-slate-400/30 bg-slate-950/40 p-3">
                <span className="text-xs text-slate-200/70">Collaboration</span>
                <strong className="mt-1.5 block text-xl leading-tight tracking-[-0.01em] text-slate-50">
                  Multi-Team Coordination
                </strong>
                <p className="mt-0.5 text-[13px] text-slate-200/70">
                  Coordinate workstreams across roles.
                </p>
              </article>
              <article className="flex flex-col rounded-xl border border-slate-400/30 bg-slate-950/40 p-3">
                <span className="text-xs text-slate-200/70">
                  Infrastructure
                </span>
                <strong className="mt-1.5 block text-xl leading-tight tracking-[-0.01em] text-slate-50">
                  Built for Scale
                </strong>
                <p className="mt-0.5 text-[13px] text-slate-200/70">
                  Enterprise-ready platform operations.
                </p>
              </article>
              <article className="flex flex-col rounded-xl border border-slate-400/30 bg-slate-950/40 p-3">
                <span className="text-xs text-slate-200/70">
                  Review Procedure
                </span>
                <strong className="mt-1.5 block text-xl leading-tight tracking-[-0.01em] text-slate-50">
                  Mandatory QA Review
                </strong>
                <p className="mt-0.5 text-[13px] text-slate-200/70">
                  All annotator submissions are reviewed.
                </p>
              </article>
              <article className="flex flex-col rounded-xl border border-slate-400/30 bg-slate-950/40 p-3">
                <span className="text-xs text-slate-200/70">
                  Decision Workflow
                </span>
                <strong className="mt-1.5 block text-xl leading-tight tracking-[-0.01em] text-slate-50">
                  Checklist-Based Logic
                </strong>
                <p className="mt-0.5 text-[13px] text-slate-200/70">
                  Logical decisions guided by checklists.
                </p>
              </article>
            </div>

            <p className="mb-[-6px] mt-1 text-xs uppercase tracking-[0.08em] text-blue-200/70">
              Available roles
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-sky-300/35 bg-blue-500/20 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-100">
                Admin
              </span>
              <span className="rounded-full border border-sky-300/35 bg-blue-500/20 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-100">
                Manager
              </span>
              <span className="rounded-full border border-sky-300/35 bg-blue-500/20 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-100">
                Annotator
              </span>
              <span className="rounded-full border border-sky-300/35 bg-blue-500/20 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-100">
                Reviewer
              </span>
            </div>

            <p>
              Signed-in roles automatically route to admin, manager, or
              annotator workspaces.
            </p>
          </aside>

          <div>
            <div className="login-card-body">
              <div className="login-form-head">
                <h3>Welcome back</h3>
                <p>Sign in to continue to your workspace</p>
              </div>

              <div
                className={`login-system-status ${
                  isSystemReady ? "is-ready" : "is-unavailable"
                }`}
              >
                <div className="login-system-status-icon" aria-hidden="true">
                  {isSystemReady ? "✓" : "!"}
                </div>
                <div>
                  <strong>
                    {isCheckingHealth
                      ? "Checking system status"
                      : isSystemReady
                        ? "System Ready"
                        : "System Unavailable"}
                  </strong>
                  <p>
                    {isCheckingHealth
                      ? "Verifying backend availability before enabling sign in."
                      : isSystemReady
                        ? "All systems operational. You can now sign in."
                        : "Cannot reach backend health endpoint. Sign in is disabled."}
                  </p>
                </div>
              </div>

              <LoginForm
                onLogin={handleLogin}
                isLoading={isLoading}
                canSubmit={isSystemReady && !isCheckingHealth}
                initialEmail={
                  rememberedPreference ? rememberedLoginIdentifier : ""
                }
                initialRememberMe={rememberedPreference}
                handleForgotPassword={handleForgotPassword}
              />

              <div className="login-demo-hint">
                Demo: admin@gmail.com / manager@gmail.com / annotator@gmail.com
                / reviewer@gmail.com (password: 123)
              </div>
            </div>

            <div className="login-card-footer">
              <div className="login-card-divider" />
              <p className="login-footer-text">
                Need access? Contact your system administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
