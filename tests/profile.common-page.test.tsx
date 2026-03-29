import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, rstest, test } from '@rstest/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = rstest.hoisted(() => ({
  mutateProfile: rstest.fn(),
  useGetAuthMe: rstest.fn(),
  usePatchProfile: rstest.fn(),
}));

rstest.mock('../src/shared/api/generated/smetchik', () => ({
  getGetAuthMeQueryKey: () => ['/api/v1/auth/me'],
  getGetProfileQueryKey: () => ['/api/v1/profile'],
  useGetAuthMe: mocks.useGetAuthMe,
  usePatchProfile: mocks.usePatchProfile,
}));

import ProfileCommonPage from '../src/pages/profile/ProfileCommonPage';

const renderPage = () => {
  render(
    <MantineProvider>
      <ProfileCommonPage />
    </MantineProvider>,
  );
};

describe('ProfileCommonPage', () => {
  beforeEach(() => {
    mocks.mutateProfile.mockReset();
    mocks.useGetAuthMe.mockReset();
    mocks.usePatchProfile.mockReset();

    mocks.useGetAuthMe.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          email: 'ivan@example.com',
          name: 'Иван',
          surname: 'Петров',
          phone: '79990001122',
        },
      },
      isLoading: false,
      isError: false,
    });

    mocks.usePatchProfile.mockReturnValue({
      mutate: mocks.mutateProfile,
      isPending: false,
    });
  });

  test('renders email field as readonly', () => {
    renderPage();

    expect(screen.getByLabelText('Почта')).toHaveAttribute('readonly');
  });

  test('requires non-empty phone before submitting', async () => {
    renderPage();

    const phoneInput = screen.getByLabelText(/Телефон/i);
    await waitFor(() => expect(phoneInput).toHaveValue('79990001122'));

    fireEvent.change(phoneInput, { target: { value: '' } });
    const form = phoneInput.closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    expect(mocks.mutateProfile).not.toHaveBeenCalled();
  });

  test('submits normalized profile values', () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Фамилия'), {
      target: { value: ' Сидоров ' },
    });
    fireEvent.change(screen.getByLabelText(/Телефон/i), {
      target: { value: ' 7 (999) 555-44-33 ' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(mocks.mutateProfile).toHaveBeenCalledWith({
      data: {
        name: 'Иван',
        surname: 'Сидоров',
        phone: '7 (999) 555-44-33',
      },
    });
  });
});
