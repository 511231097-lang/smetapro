import { ROUTES, buildRoute } from "../../../shared/constants/routes";
import {
  IconBuildingCommunity,
  IconClipboardList,
  IconMoneybag,
} from "@tabler/icons-react";

const WS_COLORS = [
  "teal",
  "blue",
  "violet",
  "orange",
  "pink",
  "green",
  "red",
  "indigo",
  "cyan",
  "grape",
] as const;

const getNavItems = (workspaceId: string) =>
  [
    {
      label: "Проекты",
      icon: <IconBuildingCommunity size="20px" />,
      route: buildRoute(ROUTES.PROJECTS, { workspaceId }),
      chevron: true,
    },
    {
      label: "Финансы",
      icon: <IconMoneybag size="20px" />,
      route: buildRoute(ROUTES.FINANCES, { workspaceId }),
      chevron: false,
    },
    {
      label: "Справочники",
      icon: <IconClipboardList size="20px" />,
      route: `/${workspaceId}/references`,
      chevron: false,
    },
  ] as const;

const wsInitials = (name?: string | null): string => {
  if (!name) return "WS";

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
};

const wsColor = (id?: string | null): string => {
  if (!id) return "teal";

  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return WS_COLORS[hash % WS_COLORS.length];
};

export { getNavItems, wsColor, wsInitials };
