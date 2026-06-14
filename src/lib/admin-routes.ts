/** Routes réservées ADMIN (middleware + nav). */
export const ADMIN_ONLY_PATH_PREFIXES = ["/types", "/parametres"] as const;

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
