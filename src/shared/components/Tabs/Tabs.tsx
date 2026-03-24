import {
  Tabs as MantineTabs,
  type TabsListProps,
  type TabsProps,
  type TabsTabProps,
} from "@mantine/core";

const tabStyles = {
  tab: {
    padding: 12,
  },
  tabSection: {
    marginRight: 8,
  },
};

export const Tabs = (props: TabsProps) => <MantineTabs {...props} />;

Tabs.List = (props: TabsListProps) => <MantineTabs.List {...props} />;

type TabProps = TabsTabProps & {
  component?: React.ElementType;
  to?: string;
  href?: string;
};

Tabs.Tab = ({ styles, ...props }: TabProps) => (
  <MantineTabs.Tab
    styles={{ ...tabStyles, ...styles }}
    {...(props as TabsTabProps)}
  />
);
