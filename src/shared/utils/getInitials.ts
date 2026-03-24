export const getInitials = (name?: string | null, surname?: string | null) => {
  const first = name?.trim().charAt(0) ?? '';
  const last = surname?.trim().charAt(0) ?? '';

  if (first && last) {
    return `${first}${last}`.toUpperCase();
  }

  if (first) {
    return first.toUpperCase();
  }

  if (last) {
    return last.toUpperCase();
  }

  return 'U';
};
