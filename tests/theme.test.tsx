import { describe, expect, test } from '@rstest/core';
import { createAppTheme, cssVariablesResolver } from '../src/theme';

describe('theme', () => {
  test('creates theme with provided primary color', () => {
    const theme = createAppTheme('blue');

    expect(theme.primaryColor).toBe('blue');
    expect(theme.headings.fontFamily).toContain('Roboto');
    expect(theme.fontSizes.md).toBe('16px');
    expect(theme.other.radius.xxl).toBe('32px');
  });

  test('uses teal by default when primary color is not passed', () => {
    const theme = createAppTheme();

    expect(theme.primaryColor).toBe('teal');
  });

  test('exposes dark css variables resolver', () => {
    const theme = createAppTheme();
    const resolved = cssVariablesResolver(theme);

    expect(resolved.dark['--mantine-color-body']).toBe('#2C2E33');
    expect(resolved.dark['--mantine-color-default-border']).toBe('#495057');
  });

  test('maps Button component sizes and compact values', () => {
    const theme = createAppTheme('teal');
    const buttonVars = theme.components.Button?.vars;
    const buttonStyles = theme.components.Button?.styles;

    expect(buttonVars).toBeDefined();
    expect(buttonStyles).toBeDefined();

    const lgVars = buttonVars?.({} as never, { size: 'lg' }) ?? {};
    const compactMdVars = buttonVars?.({} as never, {
      size: 'compact-md',
    }) ?? { root: {} };
    const fallbackVars = buttonVars?.({} as never, {
      size: 'unknown',
    }) ?? { root: {} };
    const xsStyles = buttonStyles?.({} as never, { size: 'xs' }) ?? {};
    const fallbackStyles =
      buttonStyles?.({} as never, {
        size: 'unknown',
      }) ?? {};

    expect(lgVars.root?.['--button-height']).toBe('48px');
    expect(compactMdVars.root?.['--button-height']).toBe('40px');
    expect(fallbackVars.root?.['--button-height']).toBe('32px');
    expect(xsStyles.label?.lineHeight).toBe('16px');
    expect(fallbackStyles.label?.lineHeight).toBe('20px');
  });

  test('maps Input and InputWrapper component size tokens', () => {
    const theme = createAppTheme('teal');
    const inputVars = theme.components.Input?.vars;
    const inputStyles = theme.components.Input?.styles;
    const wrapperVars = theme.components.InputWrapper?.vars;
    const wrapperStyles = theme.components.InputWrapper?.styles;

    expect(inputVars).toBeDefined();
    expect(inputStyles).toBeDefined();
    expect(wrapperVars).toBeDefined();
    expect(wrapperStyles).toBeDefined();

    const inputXlVars = inputVars?.({} as never, { size: 'xl' }) ?? {
      wrapper: {},
    };
    const inputFallbackVars = inputVars?.({} as never, {
      size: 'unknown',
    }) ?? { wrapper: {} };
    const inputCompactStyles = inputStyles?.({} as never, {
      size: 'compact-md',
    }) ?? { input: {} };
    const wrapperMdVars = wrapperVars?.({} as never, {
      size: 'md',
    }) ?? { label: {}, description: {}, error: {} };
    const wrapperFallbackStyles = wrapperStyles?.({} as never, {
      size: 'unknown',
    }) ?? { label: {}, description: {}, error: {} };

    expect(inputXlVars.wrapper?.['--input-height']).toBe('56px');
    expect(inputFallbackVars.wrapper?.['--input-height']).toBe('32px');
    expect(inputCompactStyles.input?.lineHeight).toBe('24px');

    expect(wrapperMdVars.label?.['--input-label-size']).toBe('16px');
    expect(wrapperMdVars.description?.['--input-description-size']).toBe(
      '14px',
    );
    expect(wrapperMdVars.error?.['--input-error-size']).toBe('14px');

    expect(wrapperFallbackStyles.label?.lineHeight).toBe('20px');
    expect(wrapperFallbackStyles.description?.lineHeight).toBe('16px');
    expect(wrapperFallbackStyles.error?.lineHeight).toBe('16px');
  });
});
