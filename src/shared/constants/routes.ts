export const ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  APP: "/app",
  PROJECTS: "/:workspaceId/projects",
  PROJECT_CREATE: "/:workspaceId/projects/new",
  PROJECT_EDIT: "/:workspaceId/projects/:projectId",
  ADMIN_ROOT: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_USER: "/admin/users/:userId",
  ADMIN_WORKSPACES: "/admin/workspaces",
  ADMIN_WORKSPACE: "/admin/workspaces/:workspaceId",
  PROFILE: "/:workspaceId/profile",
  PROFILE_COMMON: "/:workspaceId/profile/common",
  PROFILE_SESSIONS: "/:workspaceId/profile/sessions",
  PROFILE_APPEARANCE: "/:workspaceId/profile/appearance",
  FINANCES: "/:workspaceId/finances",
  REFERENCES: "/:workspaceId/references",
  LOGOUT: "/:workspaceId/logout",
  WORKSPACE: "/:workspaceId/workspace",
  WORKSPACE_GENERAL: "/:workspaceId/workspace/general",
  WORKSPACE_MEMBERS: "/:workspaceId/workspace/members",
  WORKSPACE_ROLES: "/:workspaceId/workspace/roles",
  WORKSPACE_CREATE: "/workspaces/create",
  INVITE_ACCEPT: "/invite/:token",
};

/** Заменяет параметры вида :param в строке маршрута на реальные значения */
export const buildRoute = (
  route: string,
  params: Record<string, string>,
): string =>
  Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, value),
    route,
  );
