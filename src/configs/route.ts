import React from "react";
import type { RouterItem } from "../interface/router/router-item.interface";
import { Role } from "../interface/account/enums/role.enum";

export const router: RouterItem[] = [
  {
    path: "/",
    Component: React.lazy(() => import("../pages/login/page")),
    requiresAuth: false,
  },
  {
    path: "/login",
    Component: React.lazy(() => import("../pages/login/page")),
    requiresAuth: false,
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
    requiresAuth: true,
    roles: [Role.ANNOTATOR],
    children: [
      {
        path: "tasks",
        Component: React.lazy(() => import("../pages/annotator-tasks/page")),
        requiresAuth: true,
        roles: [Role.ANNOTATOR],
      },
      {
        path: "submissions",
        Component: React.lazy(
          () => import("../pages/annotator-submissions/page"),
        ),
        requiresAuth: true,
        roles: [Role.ANNOTATOR],
      },
      {
        path: "ratings",
        Component: React.lazy(() => import("../pages/annotator-ratings/page")),
        requiresAuth: true,
        roles: [Role.ANNOTATOR],
      },
      {
        path: "workspace/:id",
        Component: React.lazy(
          () => import("../pages/annotator-workspace/page"),
        ),
        requiresAuth: true,
        roles: [Role.ANNOTATOR],
      },
      {
        path: "detail",
        Component: React.lazy(() => import("../pages/account-detail/page")),
        requiresAuth: true,
        roles: [Role.ANNOTATOR],
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
    requiresAuth: true,
    roles: [Role.ADMIN],
    children: [
      {
        path: "dashboard",
        Component: React.lazy(() => import("../pages/admin-dashboard/page")),
        requiresAuth: true,
        roles: [Role.ADMIN],
      },

      {
        path: "accounts",
        Component: React.lazy(() => import("../pages/admin-accounts/page")),
        requiresAuth: true,
        roles: [Role.ADMIN],
      },
      {
        path: "projects",
        Component: React.lazy(() => import("../pages/admin-projects/page")),
        requiresAuth: true,
        roles: [Role.ADMIN],
      },
      {
        path: "labels",
        Component: React.lazy(() => import("../pages/admin-labels/page")),
        requiresAuth: true,
        roles: [Role.ADMIN],
      },
      {
        path: "presets",
        Component: React.lazy(() => import("../pages/admin-presets/page")),
      },
      {
        path: "label-categories",
        Component: React.lazy(
          () => import("../pages/admin-label-categories/page"),
        ),
        requiresAuth: true,
        roles: [Role.ADMIN],
      },
      {
        path: "detail",
        Component: React.lazy(() => import("../pages/account-detail/page")),
        requiresAuth: true,
        roles: [Role.ADMIN],
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
    requiresAuth: true,
    roles: [Role.MANAGER],
    children: [
      {
        path: "projects",
        Component: React.lazy(() => import("../pages/manager-projects/page")),
        requiresAuth: true,
        roles: [Role.MANAGER],
      },
      {
        path: "labels",
        Component: React.lazy(() => import("../pages/manager-labels/page")),
        requiresAuth: true,
        roles: [Role.MANAGER],
      },
      {
        path: "labels/:id",
        Component: React.lazy(
          () => import("../pages/manager-label-detail/page"),
        ),
        requiresAuth: true,
        roles: [Role.MANAGER],
      },
      {
        path: "presets",
        Component: React.lazy(() => import("../pages/manager-presets/page")),
        requiresAuth: true,
        roles: [Role.MANAGER],
      },
      {
        path: "dashboard",
        Component: React.lazy(() => import("../pages/manager-dashboard/page")),
        requiresAuth: true,
        roles: [Role.MANAGER],
      },
      {
        path: "projects/:id/edit",
        Component: React.lazy(
          () => import("../pages/manager-project-edit/page"),
        ),
        requiresAuth: true,
        roles: [Role.MANAGER],
      },
      {
        path: "detail",
        Component: React.lazy(() => import("../pages/account-detail/page")),
        requiresAuth: true,
        roles: [Role.MANAGER],
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
    requiresAuth: true,
    roles: [Role.REVIEWER],
    children: [
      {
        path: "queue",
        Component: React.lazy(() => import("../pages/reviewer-queue/page")),
        requiresAuth: true,
        roles: [Role.REVIEWER],
      },
      {
        path: "workspace/:id",
        Component: React.lazy(() => import("../pages/reviewer-workspace/page")),
        requiresAuth: true,
        roles: [Role.REVIEWER],
      },
      {
        path: "reviews",
        Component: React.lazy(() => import("../pages/reviewer-reports/page")),
        requiresAuth: true,
        roles: [Role.REVIEWER],
      },
      {
        path: "reviews/:id",
        Component: React.lazy(
          () => import("../pages/reviewer-review-detail/page"),
        ),
        requiresAuth: true,
        roles: [Role.REVIEWER],
      },
      {
        path: "review/detail",
        Component: React.lazy(() => import("../pages/reviewer-redirect/page")),
        requiresAuth: true,
        roles: [Role.REVIEWER],
      },
      {
        path: "review-error-types",
        Component: React.lazy(
          () => import("../pages/reviewer-review-error-types/page"),
        ),
        requiresAuth: true,
        roles: [Role.REVIEWER],
      },
      {
        path: "detail",
        Component: React.lazy(() => import("../pages/account-detail/page")),
        requiresAuth: true,
        roles: [Role.REVIEWER],
      },
    ],
  },
  {
    path: "/unauthorized",
    Component: React.lazy(() => import("../pages/unauthorized/page")),
    requiresAuth: false,
  },
  {
    path: "/forgot-password",
    Component: React.lazy(() => import("../pages/forgot-password/page")),
    requiresAuth: false,
  },
  { path: "*", Component: React.lazy(() => import("../pages/not-found/page")) },
];
