// components/common/route-guard.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context.context";
import type { RouterItem } from "../interface";
import Loading from "../components/common/loading/loading";

type RouteGuardProps = {
  route: RouterItem;
  children: React.ReactNode;
};

export function RouteGuard({ route, children }: RouteGuardProps) {
  const { isAuthenticated, isInitializing, getUserInfo } = useAuth();
  const location = useLocation();

  const resolveAuthenticatedHomePath = () => {
    const userRole = getUserInfo()?.role;

    switch (userRole) {
      case "admin":
        return "/admin";
      case "manager":
        return "/manager";
      case "annotator":
        return "/annotator";
      case "reviewer":
        return "/reviewer";
      default:
        return "/unauthorized";
    }
  };

  // Public auth routes should not be accessible after login.
  if (isAuthenticated && (route.path === "/" || route.path === "/login")) {
    return <Navigate to={resolveAuthenticatedHomePath()} replace />;
  }

  // 1. Requires login but user is not authenticated
  if (route.requiresAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // While initializing after login, show loading state instead of checking permissions
  if (isInitializing) {
    return <Loading />;
  }

  // 2. Requires specific role(s)
  if (route.roles && route.roles.length > 0) {
    const user = getUserInfo();
    const userRole = user?.role; // adjust to match your Account interface

    if (!userRole || !route.roles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
