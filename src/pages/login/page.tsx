import { toast } from "sonner";
import { login } from "../../services/auth-service.service";
import LoginForm from "../../components/login/login-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    console.log(email, password);
    setIsLoading(true);
    try {
      const result = await login(email, password);
      const accessToken = result?.data?.accessToken;
      const refreshToken = result?.data?.refreshToken;
      const role = result?.data?.user?.role;
      const username = result?.data?.user?.username ?? email;
      if (accessToken) localStorage.setItem("accessToken", accessToken);

      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("currentUserName", username);
      if (role) localStorage.setItem("currentUserRole", role);
      toast.success("Login successful");
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "manager") {
        navigate("/manager");
      } else if (role === "reviewer") {
        navigate("/reviewer");
      } else {
        navigate("/annotator");
      }
    } catch (error) {
      console.log(error);
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
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
              <h2>Enterprise-grade labeling operations</h2>
              <p>
                Track projects, label taxonomies, and preset templates across
                teams in a single control room designed for scale.
              </p>
            </div>

            <div className="login-metrics">
              <div className="login-metric">
                <span>Active projects</span>
                <strong>18</strong>
              </div>
              <div className="login-metric">
                <span>Labels in use</span>
                <strong>94</strong>
              </div>
              <div className="login-metric">
                <span>Review queue</span>
                <strong>1,240</strong>
              </div>
              <div className="login-metric">
                <span>Avg. QA time</span>
                <strong>3.2h</strong>
              </div>
            </div>

            <div className="login-role-chips">
              <span>Admin</span>
              <span>Manager</span>
              <span>Annotator</span>
              <span>Reviewer</span>
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
                <p>Sign in to continue to your assigned workspace.</p>
              </div>
              <LoginForm onLogin={handleLogin} isLoading={isLoading} />

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
