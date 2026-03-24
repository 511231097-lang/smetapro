import { beforeEach, describe, expect, test } from '@rstest/core';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  PrimaryColorProvider,
  usePrimaryColor,
} from '../src/providers/PrimaryColorProvider';

const PrimaryColorConsumer = () => {
  const { primaryColor, setPrimaryColor } = usePrimaryColor();

  return (
    <div>
      <span data-testid="primary-color">{primaryColor}</span>
      <button type="button" onClick={() => setPrimaryColor('red')}>
        set red
      </button>
    </div>
  );
};

describe('PrimaryColorProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('uses teal as default color', () => {
    render(
      <PrimaryColorProvider>
        <PrimaryColorConsumer />
      </PrimaryColorProvider>,
    );

    expect(screen.getByTestId('primary-color')).toHaveTextContent('teal');
  });

  test('reads initial value from localStorage', () => {
    localStorage.setItem('primaryColor', 'orange');

    render(
      <PrimaryColorProvider>
        <PrimaryColorConsumer />
      </PrimaryColorProvider>,
    );

    expect(screen.getByTestId('primary-color')).toHaveTextContent('orange');
  });

  test('updates both state and localStorage on color change', () => {
    render(
      <PrimaryColorProvider>
        <PrimaryColorConsumer />
      </PrimaryColorProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'set red' }));

    expect(screen.getByTestId('primary-color')).toHaveTextContent('red');
    expect(localStorage.getItem('primaryColor')).toBe('red');
  });
});
