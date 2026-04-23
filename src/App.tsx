import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedLayout from './layouts/ProtectedLayout';
import RequireAuth from './layouts/RequireAuth';
import RequireGuest from './layouts/RequireGuest';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LoginPage from './pages/auth/LoginPage';
import LogoutPage from './pages/auth/LogoutPage';
import RegisterPage from './pages/auth/RegisterPage';
import FinancesPage from './pages/finances/FinancesPage';
import InviteAcceptPage from './pages/invite/InviteAcceptPage';
import ProfileAppearancePage from './pages/profile/ProfileAppearancePage';
import ProfileCommonPage from './pages/profile/ProfileCommonPage';
import ProfilePage from './pages/profile/ProfilePage';
import ProjectPage from './pages/projects/ProjectPage';
import ProjectsPage from './pages/projects/ProjectsPage.tsx';
import ReferencesPage from './pages/references/ReferencesPage';
import WorkspaceGeneralPage from './pages/workspace/WorkspaceGeneralPage';
import WorkspaceMembersPage from './pages/workspace/WorkspaceMembersPage';
import WorkspacePage from './pages/workspace/WorkspacePage';
import WorkspaceRolesPage from './pages/workspace/WorkspaceRolesPage';
import CreateWorkspacePage from './pages/workspaces/CreateWorkspacePage';
import { ROUTES } from './shared/constants/routes';

const App = () => {
  return (
    <Routes>
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
      <Route path={ROUTES.INVITE_ACCEPT} element={<InviteAcceptPage />} />
      <Route element={<RequireAuth />}>
        <Route
          path={ROUTES.WORKSPACE_CREATE}
          element={<CreateWorkspacePage />}
        />
      </Route>

      <Route path="/:workspaceId" element={<ProtectedLayout />}>
        <Route path="projects/:projectId" element={<ProjectPage />} />
        <Route path="projects" element={<ProjectsPage />} />

        <Route path="profile" element={<ProfilePage />}>
          <Route index element={<Navigate to="common" replace />} />

          <Route path="common" element={<ProfileCommonPage />} />

          <Route path="appearance" element={<ProfileAppearancePage />} />
        </Route>

        <Route path="finances" element={<FinancesPage />} />

        <Route path="references" element={<ReferencesPage />} />

        <Route path="logout" element={<LogoutPage />} />

        <Route path="workspace" element={<WorkspacePage />}>
          <Route index element={<Navigate to="general" replace />} />

          <Route path="general" element={<WorkspaceGeneralPage />} />

          <Route path="members" element={<WorkspaceMembersPage />} />

          <Route path="roles" element={<WorkspaceRolesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
    </Routes>
  );
};

export default App;
