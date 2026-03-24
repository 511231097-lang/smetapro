import {
  Box,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun, IconDeviceDesktop } from "@tabler/icons-react";

const ProfileAppearancePage = () => {
  const { setColorScheme, colorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");
  const isDark = computedColorScheme === "dark";

  return (
    <Stack gap={16} maw={672}>
      <Paper radius="md" p={24}>
        <Stack gap={20}>
          <Title order={4}>Оформление</Title>

          <Box>
            <Text fz={14} fw={600} mb={8}>
              Тема интерфейса
            </Text>
            <SegmentedControl
              value={colorScheme}
              onChange={(v) => setColorScheme(v as "light" | "dark" | "auto")}
              data={[
                {
                  value: "light",
                  label: (
                    <Group gap={6} wrap="nowrap">
                      <IconSun size={14} />
                      <span>Светлая</span>
                    </Group>
                  ),
                },
                {
                  value: "auto",
                  label: (
                    <Group gap={6} wrap="nowrap">
                      <IconDeviceDesktop size={14} />
                      <span>Системная</span>
                    </Group>
                  ),
                },
                {
                  value: "dark",
                  label: (
                    <Group gap={6} wrap="nowrap">
                      <IconMoon size={14} />
                      <span>Тёмная</span>
                    </Group>
                  ),
                },
              ]}
            />
            <Text fz={12} c="dimmed" mt={8}>
              {colorScheme === "auto"
                ? `Автоматически (сейчас: ${isDark ? "тёмная" : "светлая"})`
                : colorScheme === "dark"
                  ? "Тёмная тема включена"
                  : "Светлая тема включена"}
            </Text>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default ProfileAppearancePage;
