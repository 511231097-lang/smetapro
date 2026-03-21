import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { WorkspacesWorkspaceResponse } from "../shared/api/generated/schemas";

const WORKSPACE_STORAGE_KEY = "active_workspace_id";

type WorkspaceContextValue = {
  workspaceList: WorkspacesWorkspaceResponse[];
  activeWorkspaceId: string | null;
  activeWorkspace?: WorkspacesWorkspaceResponse;
  setActiveWorkspaceId: (id: string | null) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const getStoredWorkspaceId = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const value = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    return value && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
};

const setStoredWorkspaceId = (value: string | null) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (value) {
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, value);
      return;
    }
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
};

type WorkspaceProviderProps = {
  children: ReactNode;
  workspaces: WorkspacesWorkspaceResponse[];
};

const WorkspaceProvider = ({
  children,
  workspaces,
}: WorkspaceProviderProps) => {
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<
    string | null
  >(() => getStoredWorkspaceId());

  const setActiveWorkspaceId = useCallback((id: string | null) => {
    setActiveWorkspaceIdState(id);
    setStoredWorkspaceId(id);
  }, []);

  const activeWorkspace = useMemo(() => {
    if (!workspaces.length) {
      return undefined;
    }
    return (
      workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
      workspaces[0]
    );
  }, [activeWorkspaceId, workspaces]);

  useEffect(() => {
    if (workspaces.length === 0) {
      if (activeWorkspaceId) {
        setActiveWorkspaceId(null);
      }
      return;
    }

    const isValid = workspaces.some(
      (workspace) => workspace.id === activeWorkspaceId,
    );
    if (!activeWorkspaceId || !isValid) {
      const firstId = workspaces[0]?.id ?? null;
      if (firstId !== activeWorkspaceId) {
        setActiveWorkspaceId(firstId);
      }
    }
  }, [activeWorkspaceId, setActiveWorkspaceId, workspaces]);

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

export {
  WorkspaceProvider,
  useWorkspace,
  getStoredWorkspaceId,
  setStoredWorkspaceId,
};
