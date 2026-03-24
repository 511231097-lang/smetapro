import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { WorkspacesWorkspaceResponse } from "../shared/api/generated/schemas";

type WorkspaceContextValue = {
  workspaceList: WorkspacesWorkspaceResponse[];
  activeWorkspaceId: string | null;
  activeWorkspace?: WorkspacesWorkspaceResponse;
  setActiveWorkspaceId: (id: string | null) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

type WorkspaceProviderProps = {
  children: ReactNode;
  workspaces: WorkspacesWorkspaceResponse[];
  activeWorkspaceId: string | null;
};

const WorkspaceProvider = ({
  children,
  workspaces,
  activeWorkspaceId,
}: WorkspaceProviderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const setActiveWorkspaceId = useCallback(
    (id: string | null) => {
      if (!id) return;
      // Оставляем текущий суб-путь: /:workspaceId/subpath → /newId/subpath
      const parts = location.pathname.split("/").filter(Boolean);
      const subPath = parts.slice(1).join("/");
      navigate(`/${id}/${subPath || "projects"}`);
    },
    [navigate, location.pathname],
  );

  const activeWorkspace = useMemo(() => {
    if (!workspaces.length) {
      return undefined;
    }
    return (
      workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
      workspaces[0]
    );
  }, [activeWorkspaceId, workspaces]);

  const value = useMemo(
    () => ({
      workspaceList: workspaces,
      activeWorkspaceId,
      activeWorkspace,
      setActiveWorkspaceId,
    }),
    [activeWorkspace, activeWorkspaceId, setActiveWorkspaceId, workspaces],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
};

export { WorkspaceProvider, useWorkspace };
