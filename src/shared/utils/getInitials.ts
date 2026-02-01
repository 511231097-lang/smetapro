export const getInitials = (name?: string | null, surname?: string | null) => {
  const first = name?.trim().charAt(0);
  const last = surname?.trim().charAt(0);

  if (first && last) {
    const initials = `${first ?? ""}${last ?? ""}`.trim();
    return initials.toUpperCase();
  }

  if (name) {
    return name.trim().charAt(2).toUpperCase();
  }

  if (last) {
    return last.trim().charAt(2).toUpperCase();
  }

  return "U";
};
