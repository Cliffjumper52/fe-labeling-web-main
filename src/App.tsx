import React, { useEffect } from "react";
import "./App.css";
import { router } from "./configs/route";
import { Routes, Route } from "react-router-dom";
import Loading from "./components/common/loading/loading";
import { Toaster } from "sonner";
import { migrateLegacyTaskImagesToIndexedDb } from "./utils/image-store";

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
        {router.map(
          ({
            path,
            Component,
            children,
            layout: Layout,
            sidebar: SidebarComponent,
          }) => {
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

            return (
              <Route key={path} path={path} element={routeElement}>
                {/* Index route - shows the main component */}
                <Route
                  index
                  element={
                    <React.Suspense fallback={<Loading />}>
                      <Component />
                    </React.Suspense>
                  }
                />

                {/* Child routes */}
                {children &&
                  children.map(
                    ({ path: childPath, Component: ChildComponent }) => (
                      <Route
                        key={childPath}
                        path={childPath}
                        element={
                          <React.Suspense fallback={<Loading />}>
                            <ChildComponent />
                          </React.Suspense>
                        }
                      />
                    ),
                  )}
              </Route>
            );
          },
        )}
      </Routes>
    </>
  );
}

export default App;
