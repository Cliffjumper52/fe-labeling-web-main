import React, { useEffect } from "react";
import "./App.css";
import { router } from "./configs/route";
import { Routes, Route } from "react-router-dom";
import Loading from "./components/common/loading/loading";
import { Toaster } from "sonner";
import { migrateLegacyTaskImagesToIndexedDb } from "./utils/image-store";
import { RouteGuard } from "./guards/role-guard.guard";

function App() {
  useEffect(() => {
    let canceled = false;

    const runMigration = async () => {
      try {
        const result = await migrateLegacyTaskImagesToIndexedDb();
        if (!canceled && result.migrated) {
          window.dispatchEvent(new CustomEvent("annotator-tasks-updated"));
        }
      } catch {
        // Keep app running even if migration fails in restricted browser mode.
      }
    };

    void runMigration();

    return () => {
      canceled = true;
    };
  }, []);

  return (
    <>
      <Toaster />
      <Routes>
        {router.map((route) => {
          const {
            path,
            Component,
            children,
            layout: Layout,
            sidebar: SidebarComponent,
            requiresAuth,
            roles,
          } = route;

          const routeGuard = {
            path,
            Component,
            children,
            layout: Layout,
            sidebar: SidebarComponent,
            requiresAuth,
            roles,
          };

          const routeElement = Layout ? (
            <React.Suspense fallback={<Loading />}>
              <Layout
                sidebar={
                  SidebarComponent ? (
                    <React.Suspense fallback={<Loading />}>
                      <SidebarComponent />
                    </React.Suspense>
                  ) : undefined
                }
              />
            </React.Suspense>
          ) : (
            <React.Suspense fallback={<Loading />}>
              <Component />
            </React.Suspense>
          );

          const guardedRouteElement = (
            <RouteGuard route={routeGuard}>{routeElement}</RouteGuard>
          );

          return (
            <Route key={path} path={path} element={guardedRouteElement}>
              {/* Index route - shows the main component */}
              <Route
                index
                element={
                  <RouteGuard route={routeGuard}>
                    <React.Suspense fallback={<Loading />}>
                      <Component />
                    </React.Suspense>
                  </RouteGuard>
                }
              />

              {/* Child routes */}
              {children &&
                children.map((child) => {
                  const { path: childPath, Component: ChildComponent } = child;

                  const childGuardRoute = {
                    ...child,
                    requiresAuth: child.requiresAuth ?? requiresAuth,
                    roles: child.roles ?? roles,
                  };

                  return (
                    <Route
                      key={childPath}
                      path={childPath}
                      element={
                        <RouteGuard route={childGuardRoute}>
                          <React.Suspense fallback={<Loading />}>
                            <ChildComponent />
                          </React.Suspense>
                        </RouteGuard>
                      }
                    />
                  );
                })}
            </Route>
          );
        })}
      </Routes>
    </>
  );
}

export default App;
