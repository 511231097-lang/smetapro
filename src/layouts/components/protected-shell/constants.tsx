import {
  IconBuildingCommunity,
  IconClipboardList,
  IconMoneybag,
} from '@tabler/icons-react';
import { buildRoute, ROUTES } from '../../../shared/constants/routes';

const SIDEBAR_WIDTH = 248;
const COLLAPSED_SIDEBAR_WIDTH = 60;

const getNavItems = (workspaceId: string) =>
  [
    {
      label: 'Проекты',
      icon: <IconBuildingCommunity size="20px" />,
      route: buildRoute(ROUTES.PROJECTS, { workspaceId }),
      chevron: true,
    },
    {
      label: 'Финансы',
      icon: <IconMoneybag size="20px" />,
      route: buildRoute(ROUTES.FINANCES, { workspaceId }),
      chevron: false,
    },
    {
      label: 'Справочники',
      icon: <IconClipboardList size="20px" />,
      route: buildRoute(ROUTES.REFERENCES, { workspaceId }),
      chevron: false,
    },
  ] as const;

const wsInitials = (name?: string | null): string => {
  if (!name) return 'WS';

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
};

export { COLLAPSED_SIDEBAR_WIDTH, getNavItems, SIDEBAR_WIDTH, wsInitials };
