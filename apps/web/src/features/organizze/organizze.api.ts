import type {
  OrganizzeSyncInput,
  OrganizzeSyncPreviewOutput,
  OrganizzeSyncResultOutput,
} from "@openmonetis/validators/organizze";
import { requestApiWithResponseMessage as request } from "@/lib/api-client";

export function previewOrganizzeSync(input: OrganizzeSyncInput) {
  return request<OrganizzeSyncPreviewOutput>("/organizze/preview", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function syncOrganizze(input: OrganizzeSyncInput) {
  return request<OrganizzeSyncResultOutput>("/organizze/sync", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
