import React from "react";
import type { RouterItem } from "../interface/router/router-item.interface";

export const router: RouterItem[] = [
  {
    path: "/",
    Component: React.lazy(() => import("../pages/login/page")),
  },
  {
    path: "/login",
    Component: React.lazy(() => import("../pages/login/page")),
  },
  {
    layout: React.lazy(
      () => import("../components/common/layout/simple-layout"),
    ),
    path: "/annotator",
    Component: React.lazy(() => import("../pages/annotator-home/page")),
    sidebar: React.lazy(
      () => import("../components/common/sidebar/annotator-sidebar"),
    ),
    children: [
      {
        path: "tasks",
        Component: React.lazy(() => import("../pages/annotator-tasks/page")),
      },
      {
        path: "submissions",
        Component: React.lazy(
          () => import("../pages/annotator-submissions/page"),
        ),
      },
      {
        path: "workspace/:id",
        Component: React.lazy(
          () => import("../pages/annotator-workspace/page"),
        ),
      },
    ],
  },
  {
    layout: React.lazy(
      () => import("../components/common/layout/simple-layout"),
    ),

    path: "/admin",
    Component: React.lazy(() => import("../pages/admin-home/page")),
    sidebar: React.lazy(
      () => import("../components/common/sidebar/admin-sidebar"),
    ),
    children: [
      {
        path: "dashboard",
        Component: React.lazy(
          () => import("../pages/admin-dashboard/page"),
        ),
      },
      {
        path: "accounts",
        Component: React.lazy(() => import("../pages/admin-accounts/page")),
      },
      {
        path: "projects",
        Component: React.lazy(() => import("../pages/admin-projects/page")),
      },
      {
        path: "labels",
        Component: React.lazy(() => import("../pages/admin-labels/page")),
      },
      {
        path: "presets",
        Component: React.lazy(() => import("../pages/admin-presets/page")),
      },
    ],
  },
  {
    layout: React.lazy(
      () => import("../components/common/layout/simple-layout"),
    ),
    path: "/manager",
    Component: React.lazy(() => import("../pages/manager-home/page")),
    sidebar: React.lazy(
      () => import("../components/common/sidebar/manager-sidebar"),
    ),
    children: [
      {
        path: "projects",
        Component: React.lazy(() => import("../pages/manager-projects/page")),
      },
      {
        path: "labels",
        Component: React.lazy(() => import("../pages/manager-labels/page")),
      },
      {
        path: "presets",
        Component: React.lazy(() => import("../pages/manager-presets/page")),
      },
      {
        path: "dashboard",
        Component: React.lazy(() => import("../pages/manager-dashboard/page")),
      },
      {
        path: "projects/:id",
        Component: React.lazy(() => import("../pages/project-detail/page")),
      },
    ],
  },
  {
    layout: React.lazy(
      () => import("../components/common/layout/simple-layout"),
    ),
    path: "/reviewer",
    Component: React.lazy(() => import("../pages/reviewer-home/page")),
    sidebar: React.lazy(
      () => import("../components/common/sidebar/reviewer-sidebar"),
    ),
  },
  { path: "*", Component: React.lazy(() => import("../pages/not-found/page")) },
];
