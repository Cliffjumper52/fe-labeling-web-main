import { toast } from "sonner";
import { login } from "../../services/auth-service";
import LoginForm from "../../components/login/login-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await login(email, password);
      const accessToken = result?.data?.accessToken;
      const refreshToken = result?.data?.refreshToken;
      const role = result?.data?.user?.role;
      if (accessToken) localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      toast.success("Login successful");
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "manager") {
        navigate("/manager");
      } else {
        navigate("/annotator");
      }
    } catch (error) {
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card-wrapper">
        <h1 className="login-title">Data Labeling Studio</h1>

        <div className="login-card">
          <aside className="login-aside">
            <div>
              <h2>Enterprise-grade labeling operations</h2>
              <p>
                Track projects, label taxonomies, and preset templates across teams
                in a single control room designed for scale.
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

            <p>
              Signed-in roles automatically route to admin, manager, or annotator
              workspaces.
            </p>
          </aside>

          <div>
            <div className="login-card-body">
              <LoginForm onLogin={handleLogin} isLoading={isLoading} />
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
