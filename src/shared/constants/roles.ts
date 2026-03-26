export const OWNER_ROLE_CODE = 'owner';

export const isOwnerRoleCode = (roleCode: string | null | undefined) =>
  roleCode?.trim().toLowerCase() === OWNER_ROLE_CODE;
