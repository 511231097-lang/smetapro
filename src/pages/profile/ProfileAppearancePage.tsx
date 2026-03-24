import type { MantineColor } from '@mantine/core';
import {
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import { IconCheck, IconMoon, IconSun } from '@tabler/icons-react';
import { usePrimaryColor } from '../../providers/PrimaryColorProvider';

const COLOR_OPTIONS: { color: MantineColor; hex: string }[] = [
  { color: 'teal', hex: '#12b886' },
  { color: 'blue', hex: '#228be6' },
  { color: 'grape', hex: '#be4bdb' },
  { color: 'orange', hex: '#fd7e14' },
  { color: 'cyan', hex: '#15aabf' },
  { color: 'yellow', hex: '#fab005' },
];

const ProfileAppearancePage = () => {
  const { setColorScheme, colorScheme } = useMantineColorScheme();
  const { primaryColor, setPrimaryColor } = usePrimaryColor();

  return (
    <Stack gap={16} maw={672}>
      <Paper radius="md" p={24}>
        <Stack gap={20}>
          <Title order={4}>Оформление</Title>

          <Box>
            <Text fz={12} fw={600} tt="uppercase" c="dimmed" mb={8}>
              Тема
            </Text>
            <Group gap={8} grow>
              <Button
                variant="outline"
                color={colorScheme === 'light' ? undefined : 'gray'}
                leftSection={<IconSun size={16} />}
                onClick={() => setColorScheme('light')}
              >
                Светлая тема
              </Button>
              <Button
                variant="outline"
                color={colorScheme === 'dark' ? undefined : 'gray'}
                leftSection={<IconMoon size={16} />}
                onClick={() => setColorScheme('dark')}
              >
                Темная тема
              </Button>
            </Group>
          </Box>

          <Box>
            <Text fz={12} fw={600} tt="uppercase" c="dimmed" mb={8}>
              Основной цвет
            </Text>
            <Group gap={8}>
              {COLOR_OPTIONS.map(({ color, hex }) => (
                <UnstyledButton
                  key={color}
                  aria-label={color}
                  style={{
                    backgroundColor: hex,
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  onClick={() => setPrimaryColor(color)}
                >
                  {primaryColor === color && (
                    <IconCheck size={16} color="white" />
                  )}
                </UnstyledButton>
              ))}
            </Group>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default ProfileAppearancePage;
