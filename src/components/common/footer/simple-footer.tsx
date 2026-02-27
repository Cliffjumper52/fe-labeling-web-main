import React from "react";

export default function SimpleFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/70 px-6 py-3 text-xs text-slate-500 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between">
        <span>System status: Operational</span>
        <span>Data Label Studio • v1.0</span>
      </div>
    </footer>
  );
}
