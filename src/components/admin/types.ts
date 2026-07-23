export type AdminView = "overview" | "users" | "roles" | "governance" | "catalog" | "settings";

export const adminViewTitles: Record<AdminView, string> = {
  overview: "Governance overview",
  users: "Users",
  roles: "Roles",
  governance: "Access governance",
  catalog: "Permission catalog",
  settings: "Settings",
};

export function isAdminView(value: string | undefined): value is AdminView {
  return Boolean(value && value in adminViewTitles);
}

