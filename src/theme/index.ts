import {
  type CSSVariablesResolver,
  createTheme,
  type MantineColor,
} from '@mantine/core';

const fontFamily = '"Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif';

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {},
  dark: {
    '--mantine-color-body': '#2C2E33',
    '--mantine-color-default-border': '#495057',
  },
});

export const createAppTheme = (primaryColor: MantineColor = 'teal') =>
  createTheme({
    primaryColor,
    fontFamily,
    colors: {
      dark: [
        '#c9c9c9',
        '#b8b8b8',
        '#828282',
        '#696969',
        '#424242',
        '#3b3b3b',
        '#2e2e2e',
        '#242424',
        '#1f1f1f',
        '#141414',
      ],
      gray: [
        '#f8f9fa',
        '#f1f3f5',
        '#e9ecef',
        '#dee2e6',
        '#ced4da',
        '#adb5bd',
        '#868e96',
        '#495057',
        '#343a40',
        '#212529',
      ],
      red: [
        '#fff5f5',
        '#ffe3e3',
        '#ffc9c9',
        '#ffa8a8',
        '#ff8787',
        '#ff6b6b',
        '#fa5252',
        '#f03e3e',
        '#e03131',
        '#c92a2a',
      ],
      pink: [
        '#fff0f6',
        '#ffdeeb',
        '#fcc2d7',
        '#faa2c1',
        '#f783ac',
        '#f06595',
        '#e64980',
        '#d6336c',
        '#c2255c',
        '#a61e4d',
      ],
      grape: [
        '#f8f0fc',
        '#f3d9fa',
        '#eebefa',
        '#e599f7',
        '#da77f2',
        '#cc5de8',
        '#be4bdb',
        '#ae3ec9',
        '#9c36b5',
        '#862e9c',
      ],
      violet: [
        '#f3f0ff',
        '#e5dbff',
        '#d0bfff',
        '#b197fc',
        '#9775fa',
        '#845ef7',
        '#7950f2',
        '#7048e8',
        '#6741d9',
        '#5f3dc4',
      ],
      indigo: [
        '#edf2ff',
        '#dbe4ff',
        '#bac8ff',
        '#91a7ff',
        '#748ffc',
        '#5c7cfa',
        '#4c6ef5',
        '#4263eb',
        '#3b5bdb',
        '#364fc7',
      ],
      blue: [
        '#e7f5ff',
        '#d0ebff',
        '#a5d8ff',
        '#74c0fc',
        '#4dabf7',
        '#339af0',
        '#228be6',
        '#1c7ed6',
        '#1971c2',
        '#1864ab',
      ],
      cyan: [
        '#e3fafc',
        '#c5f6fa',
        '#99e9f2',
        '#66d9e8',
        '#3bc9db',
        '#22b8cf',
        '#15aabf',
        '#1098ad',
        '#0c8599',
        '#0b7285',
      ],
      teal: [
        '#e6fcf5',
        '#c3fae8',
        '#96f2d7',
        '#63e6be',
        '#38d9a9',
        '#20c997',
        '#12b886',
        '#0ca678',
        '#099268',
        '#087f5b',
      ],
      green: [
        '#ebfbee',
        '#d3f9d8',
        '#b2f2bb',
        '#8ce99a',
        '#69db7c',
        '#51cf66',
        '#40c057',
        '#37b24d',
        '#2f9e44',
        '#2b8a3e',
      ],
      lime: [
        '#f4fce3',
        '#e9fac8',
        '#d8f5a2',
        '#c0eb75',
        '#a9e34b',
        '#94d82d',
        '#82c91e',
        '#74b816',
        '#66a80f',
        '#5c940d',
      ],
      yellow: [
        '#fff9db',
        '#fff3bf',
        '#ffec99',
        '#ffe066',
        '#ffd43b',
        '#fcc419',
        '#fab005',
        '#f59f00',
        '#f08c00',
        '#e67700',
      ],
      orange: [
        '#fff4e6',
        '#ffe8cc',
        '#ffd8a8',
        '#ffc078',
        '#ffa94d',
        '#ff922b',
        '#fd7e14',
        '#f76707',
        '#e8590c',
        '#d9480f',
      ],
    },
    headings: {
      fontFamily,
      fontWeight: '700',
      sizes: {
        h1: { fontSize: '40px', lineHeight: '48px' },
        h2: { fontSize: '32px', lineHeight: '40px' },
        h3: { fontSize: '24px', lineHeight: '32px' },
        h4: { fontSize: '20px', lineHeight: '24px' },
        h5: { fontSize: '16px', lineHeight: '20px' },
        h6: { fontSize: '12px', lineHeight: '16px' },
      },
    },
    fontSizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
    },
    lineHeights: {
      xs: '16px',
      sm: '20px',
      md: '24px',
      lg: '28px',
      xl: '32px',
    },
    radius: {
      xs: '2px',
      sm: '4px',
      md: '8px',
      lg: '16px',
      xl: '24px',
    },
    spacing: {
      node: '0px',
      xxs: '2px',
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      xxl: '32px',
    },
    shadows: {
      xs: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.102)',
      sm: '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 15px -5px rgba(0, 0, 0, 0.102), 0 7px 7px -5px rgba(0, 0, 0, 0.039)',
      md: '0 1px 3px rgba(0, 0, 0, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.102), 0 10px 10px -5px rgba(0, 0, 0, 0.039)',
      lg: '0 1px 3px rgba(0, 0, 0, 0.05), 0 28px 23px -7px rgba(0, 0, 0, 0.102), 0 12px 12px -7px rgba(0, 0, 0, 0.039)',
      xl: '0 1px 3px rgba(0, 0, 0, 0.05), 0 36px 28px -7px rgba(0, 0, 0, 0.102), 0 17px 17px -7px rgba(0, 0, 0, 0.039)',
    },
    components: {
      Button: {
        defaultProps: { radius: 'sm' },
        vars: (_theme, props) => {
          const size = (props.size ?? 'sm').replace('compact-', '');
          const map = {
            xs: { height: 24, px: 12, fz: 12 },
            sm: { height: 32, px: 16, fz: 14 },
            md: { height: 40, px: 20, fz: 16 },
            lg: { height: 48, px: 24, fz: 18 },
            xl: { height: 56, px: 32, fz: 20 },
          } as const;
          const v = map[size as keyof typeof map] ?? map.sm;

          return {
            root: {
              '--button-height': `${v.height}px`,
              '--button-padding-x': `${v.px}px`,
              '--button-fz': `${v.fz}px`,
              '--button-radius': '4px',
            },
          };
        },
        styles: (_theme, props) => {
          const size = (props.size ?? 'sm').replace('compact-', '');
          const lineHeights = {
            xs: '16px',
            sm: '20px',
            md: '24px',
            lg: '28px',
            xl: '32px',
          } as const;
          const lineHeight =
            lineHeights[size as keyof typeof lineHeights] ?? lineHeights.sm;

          return {
            inner: { gap: '8px' },
            label: { fontWeight: 400, lineHeight },
          };
        },
      },
      Input: {
        vars: (_theme, props) => {
          const size = (props.size ?? 'sm').replace('compact-', '');
          const map = {
            xs: { height: 24, fz: 12, py: 5, px: 12, lh: 16 },
            sm: { height: 32, fz: 14, py: 6, px: 12, lh: 20 },
            md: { height: 40, fz: 16, py: 8, px: 16, lh: 24 },
            lg: { height: 48, fz: 18, py: 10, px: 16, lh: 28 },
            xl: { height: 56, fz: 20, py: 12, px: 20, lh: 32 },
          } as const;
          const v = map[size as keyof typeof map] ?? map.sm;

          return {
            wrapper: {
              '--input-height': `${v.height}px`,
              '--input-fz': `${v.fz}px`,
              '--input-radius': '4px',
              '--input-padding-y': `${v.py}px`,
              '--input-line-height': `${v.lh}px`,
              '--input-padding': `${v.px}px`,
            },
          };
        },
        styles: (_theme, props) => {
          const size = (props.size ?? 'sm').replace('compact-', '');
          const map = {
            xs: { lh: '16px' },
            sm: { lh: '20px' },
            md: { lh: '24px' },
            lg: { lh: '28px' },
            xl: { lh: '32px' },
          } as const;
          const v = map[size as keyof typeof map] ?? map.sm;

          return {
            input: { lineHeight: v.lh, fontWeight: 400 },
          };
        },
      },
      InputWrapper: {
        vars: (_theme, props) => {
          const size = (props.size ?? 'sm').replace('compact-', '');
          const label = {
            xs: { fz: 12, lh: 16 },
            sm: { fz: 14, lh: 20 },
            md: { fz: 16, lh: 24 },
            lg: { fz: 18, lh: 28 },
            xl: { fz: 20, lh: 32 },
          } as const;
          const text = {
            xs: { fz: 10, lh: 12.5 },
            sm: { fz: 12, lh: 16 },
            md: { fz: 14, lh: 20 },
            lg: { fz: 16, lh: 24 },
            xl: { fz: 18, lh: 28 },
          } as const;
          const l = label[size as keyof typeof label] ?? label.sm;
          const t = text[size as keyof typeof text] ?? text.sm;

          return {
            label: { '--input-label-size': `${l.fz}px` },
            description: { '--input-description-size': `${t.fz}px` },
            error: { '--input-error-size': `${t.fz}px` },
          };
        },
        styles: (_theme, props) => {
          const size = (props.size ?? 'sm').replace('compact-', '');
          const label = {
            xs: '16px',
            sm: '20px',
            md: '24px',
            lg: '28px',
            xl: '32px',
          } as const;
          const text = {
            xs: '12.5px',
            sm: '16px',
            md: '20px',
            lg: '24px',
            xl: '28px',
          } as const;

          return {
            label: {
              fontWeight: 600,
              lineHeight: label[size as keyof typeof label] ?? label.sm,
            },
            description: {
              fontWeight: 400,
              lineHeight: text[size as keyof typeof text] ?? text.sm,
            },
            error: {
              fontWeight: 400,
              lineHeight: text[size as keyof typeof text] ?? text.sm,
            },
          };
        },
      },
    },
    other: {
      radius: { none: '0px', xxl: '32px' },
      spacing: { none: '0px', xxs: '2px', xxl: '32px' },
      fontSizes: { xxs: '10px' },
      lineHeights: { xxs: '12.5px' },
    },
  });
