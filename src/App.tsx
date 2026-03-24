import { Navigate, Route, Routes } from "react-router-dom";
import ProjectsPage from "./pages/projects/ProjectsPage";
import ProfilePage from "./pages/profile/ProfilePage";
import ProfileCommonPage from "./pages/profile/ProfileCommonPage";
import ProfileSessionsPage from "./pages/profile/ProfileSessionsPage";
import ProtectedLayout from "./layouts/ProtectedLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import FinancesPage from "./pages/finances/FinancesPage";
import LogoutPage from "./pages/auth/LogoutPage";
import { ROUTES } from "./shared/constants/routes";
import WorkspacePage from "./pages/workspace/WorkspacePage";

import WorkspaceMembersPage from "./pages/workspace/WorkspaceMembersPage";
import WorkspaceProfilePage from "./pages/workspace/WorkspaceProfilePage";
import CreateWorkspacePage from "./pages/workspaces/CreateWorkspacePage";
import RequireAuth from "./layouts/RequireAuth";
import RequireGuest from "./layouts/RequireGuest";
import CreateProjectPage from "./pages/projects/CreateProjectPage";
import EditProjectPage from "./pages/projects/EditProjectPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminWorkspacesPage from "./pages/admin/AdminWorkspacesPage";
import AdminUserDetailPage from "./pages/admin/AdminUserDetailPage";
import AdminWorkspaceDetailPage from "./pages/admin/AdminWorkspaceDetailPage";
import AdminLayout from "./layouts/AdminLayout";

const App = () => {
  return (
    <Routes>
      {/* "/" и "/app" — ProtectedLayout сам редиректит на /:workspaceId/projects */}
      <Route path={ROUTES.ROOT} element={<ProtectedLayout />} />
      <Route
        path={ROUTES.APP}
        element={<Navigate to={ROUTES.ROOT} replace />}
      />
      <Route element={<RequireGuest />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route
          path={ROUTES.WORKSPACE_CREATE}
          element={<CreateWorkspacePage />}
        />
      </Route>

      <Route path="/:workspaceId" element={<ProtectedLayout />}>
        <Route path="projects" element={<ProjectsPage />} />
        {/* <Route path="projects/new" element={<CreateProjectPage />} /> */}
        {/* <Route path="projects/:projectId" element={<EditProjectPage />} /> */}
        <Route path="profile" element={<ProfilePage />}>
          <Route index element={<Navigate to="common" replace />} />
          <Route path="common" element={<ProfileCommonPage />} />
          <Route path="sessions" element={<ProfileSessionsPage />} />
        </Route>
        <Route path="finances" element={<FinancesPage />} />
        <Route path="logout" element={<LogoutPage />} />
        <Route path="workspace" element={<WorkspacePage />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<WorkspaceProfilePage />} />
          <Route path="members" element={<WorkspaceMembersPage />} />
        </Route>
      </Route>

      {/* <Route element={<AdminLayout />}>
        <Route
          path={ROUTES.ADMIN_ROOT}
          element={<Navigate to={ROUTES.ADMIN_USERS} replace />}
        />
        <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
        <Route path={ROUTES.ADMIN_USER} element={<AdminUserDetailPage />} />
        <Route
          path={ROUTES.ADMIN_WORKSPACES}
          element={<AdminWorkspacesPage />}
        />
        <Route
          path={ROUTES.ADMIN_WORKSPACE}
          element={<AdminWorkspaceDetailPage />}
        />
      </Route> */}

      <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
    </Routes>
  );
};

export default App;
