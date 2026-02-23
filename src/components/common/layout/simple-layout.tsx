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
    <div className="flex flex-col min-h-screen">
      <SimpleHeader />

      <div
        className={`flex ${wrapperDirection} h-full items-start flex-1 w-full`}
      >
        {sidebar && (
          <aside className={`flex-none ${sidebarClassName}`}>{sidebar}</aside>
        )}

        <main className={`flex-1 ${mainClassName}`}>
          <Outlet />
        </main>
      </div>

      <SimpleFooter />
    </div>
  );
}
