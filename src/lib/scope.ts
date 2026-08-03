const HOSPITAL_SCOPED_ROLES = [
  'hospital_admin',
  'hr_officer',
];

export function getHospitalScope(user: { role: string; hospital_id?: string | null } | null): string | undefined {
  if (!user?.hospital_id) return undefined;
  return HOSPITAL_SCOPED_ROLES.includes(user.role) ? user.hospital_id : undefined;
}

export function isHospitalScopedRole(role: string): boolean {
  return HOSPITAL_SCOPED_ROLES.includes(role);
}
