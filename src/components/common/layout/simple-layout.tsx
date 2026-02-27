import React, { type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import SimpleHeader from "../header/simple-header";
import SimpleFooter from "../footer/simple-footer";

interface SimpleLayoutProps {
  sidebar?: ReactNode;
  sidebarClassName?: string;
  sidebarPosition?: "left" | "right";
  mainClassName?: string;
}

export default function SimpleLayout({
  sidebar,
  sidebarClassName = "w-[250px]",
  sidebarPosition = "left",
  mainClassName = "",
}: SimpleLayoutProps) {
  const wrapperDirection =
    sidebarPosition === "left" ? "flex-row" : "flex-row-reverse";

  return (
    <div className="app-shell">
      <div className="app-canvas">
        <SimpleHeader />

        <div className={`app-body ${wrapperDirection}`}>
          {sidebar && (
            <aside className={`app-sidebar flex-none ${sidebarClassName}`}>
              {sidebar}
            </aside>
          )}

          <main className={`app-main ${mainClassName}`}>
            <div className="app-main-inner surface-muted p-6">
              <Outlet />
            </div>
          </main>
        </div>

        <SimpleFooter />
      </div>
    </div>
  );
}
