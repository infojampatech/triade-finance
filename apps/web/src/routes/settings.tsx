import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/settings/components/settings-page";
import { validateSettingsSearch } from "@/features/settings/settings.presentation";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Ajustes · Tríade Finance" }] }),
  component: SettingsPage,
  validateSearch: validateSettingsSearch,
});
