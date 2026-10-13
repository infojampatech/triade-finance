import { createFileRoute } from "@tanstack/react-router";
import { ChangelogPage } from "@/features/releases/components/changelog-page";

export const Route = createFileRoute("/changelog")({
  head: () => ({ meta: [{ title: "Novidades · Tríade Finance" }] }),
  component: ChangelogPage,
});
