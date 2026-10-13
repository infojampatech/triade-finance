export function getInitials(name?: string | null) {
  if (!name) {
    return "TF";
  }

  const [first = "", second = ""] = name.trim().split(/\s+/);
  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase() || "TF";
}
