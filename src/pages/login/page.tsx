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
      navigate(role === "manager" ? "/manager" : "/annotator");
    } catch (error) {
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card-wrapper">
        <h1 className="login-title">Data labeling app</h1>

        <div className="login-card">
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
  );
}
