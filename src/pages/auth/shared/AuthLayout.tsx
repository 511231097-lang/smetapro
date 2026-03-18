import { Box, Stack, Text } from "@mantine/core";
import loginHeroImage from "../../../assets/login-hero.png";
import logo from "../../../assets/logo.svg";
import classes from "./AuthLayout.module.css";

const AuthHero = () => (
  <Box
    className={classes.hero}
    data-testid="login-hero"
    style={{ backgroundImage: `url(${loginHeroImage})` }}
  >
    <Stack className={classes.heroOverlay} align="center">
      <img src={logo} alt="Сметчик ПРО" className={classes.heroLogo} />
      <Text ta="center" c="white" className={classes.heroText}>
        Эффективный контроль смет и финансовых потоков
        <br />
        на каждом этапе работы с клиентом
      </Text>
    </Stack>
  </Box>
);

interface AuthPageLayoutProps {
  children: React.ReactNode;
  layoutTestId?: string;
}

export const AuthPageLayout = ({
  children,
  layoutTestId,
}: AuthPageLayoutProps) => (
  <Box component="section" className={classes.page}>
    <Box className={classes.layout} data-testid={layoutTestId}>
      <Box className={classes.formColumn}>{children}</Box>
      <Box className={classes.heroColumn}>
        <AuthHero />
      </Box>
    </Box>
  </Box>
);

interface AuthFormWrapperProps {
  children: React.ReactNode;
}

export const AuthFormWrapper = ({ children }: AuthFormWrapperProps) => (
  <Stack gap={12} className={classes.formWrapper}>
    {children}
  </Stack>
);

export { classes as authLayoutClasses };
