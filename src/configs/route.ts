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
        path: "ratings",
        Component: React.lazy(() => import("../pages/annotator-ratings/page")),
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
        Component: React.lazy(() => import("../pages/admin-dashboard/page")),
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
        path: "labels/:id",
        Component: React.lazy(
          () => import("../pages/manager-label-detail/page"),
        ),
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
        path: "projects/:id/edit",
        Component: React.lazy(
          () => import("../pages/manager-project-edit/page"),
        ),
      },
    ],
  },
  {
    layout: React.lazy(
      () => import("../components/common/layout/simple-layout"),
    ),
    path: "/reviewer",
    Component: React.lazy(() => import("../pages/reviewer-queue/page")),
    sidebar: React.lazy(
      () => import("../components/common/sidebar/reviewer-sidebar"),
    ),
    children: [
      {
        path: "workspace/:id",
        Component: React.lazy(() => import("../pages/reviewer-workspace/page")),
      },
      {
        path: "reviews",
        Component: React.lazy(() => import("../pages/reviewer-reports/page")),
      },
      {
        path: "reviews/:id",
        Component: React.lazy(
          () => import("../pages/reviewer-review-detail/page"),
        ),
      },
      {
        path: "review-error-types",
        Component: React.lazy(
          () => import("../pages/reviewer-review-error-types/page"),
        ),
      },
    ],
  },
  { path: "*", Component: React.lazy(() => import("../pages/not-found/page")) },
];
