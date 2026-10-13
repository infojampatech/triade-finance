import assert from "node:assert/strict";
import test from "node:test";

const WEB_URL = process.env.WEB_URL || "http://localhost:7002";

test("E2E - Organizze connector: preview, account & category sync, family budgets idempotency", async () => {
  // 1. Authenticate with master admin credentials
  const loginRes = await fetch(`${WEB_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: WEB_URL },
    body: JSON.stringify({ email: "admin@triade.local", password: "SenhaForte123!" }),
  });
  assert.equal(loginRes.status, 200, "Sign-in must succeed");
  const sessionCookie = (loginRes.headers.get("set-cookie") ?? "").split(";")[0] as string;
  const sessionHeaders = {
    "Content-Type": "application/json",
    Cookie: sessionCookie,
    Origin: WEB_URL,
  };

  const run = Date.now();
  const testAccountName = `Inter PJ E2E ${run}`;
  const testMercadoCategory = `Supermercado E2E ${run}`;
  const testCloudCategory = `Servidores Cloud E2E ${run}`;

  const payload = {
    accounts: [{ name: testAccountName, type: "checking" }],
    categories: [
      { name: testMercadoCategory, parentName: "Alimentação", type: "expense" },
      { name: testCloudCategory, type: "expense" },
    ],
    budgets: [
      { categoryName: testMercadoCategory, amount: 2400, period: "2026-10" },
    ],
    defaultPeriod: "2026-10",
  };

  // 2. Test Preview endpoint
  const previewRes = await fetch(`${WEB_URL}/api-proxy/organizze/preview`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify(payload),
  });
  assert.equal(previewRes.status, 200, "Preview endpoint must return 200");
  const previewData = (await previewRes.json()).data;
  assert.equal(previewData.totalAccounts, 1);
  assert.equal(previewData.totalCategories, 2);
  assert.equal(previewData.totalBudgets, 1);

  const mercadoItem = previewData.categories.find(
    (c: { name: string }) => c.name === testMercadoCategory,
  );
  assert.ok(mercadoItem);
  assert.equal(mercadoItem.targetWorkspaceType, "family", "Domestic category must route to Family workspace");

  const cloudItem = previewData.categories.find(
    (c: { name: string }) => c.name === testCloudCategory,
  );
  assert.ok(cloudItem);
  assert.equal(cloudItem.targetWorkspaceType, "business", "Cloud servers must route to Business workspace");

  // 3. Test Sync endpoint (First execution)
  const syncRes = await fetch(`${WEB_URL}/api-proxy/organizze/sync`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify(payload),
  });
  assert.equal(syncRes.status, 200, "Sync endpoint must return 200");
  const syncResult = (await syncRes.json()).data;
  assert.equal(syncResult.accountsCreated, 1);
  assert.equal(syncResult.categoriesCreated, 2);
  assert.equal(syncResult.budgetsCreated, 1);

  // 4. Validate that budget appears in standard Budgets API
  const budgetsRes = await fetch(`${WEB_URL}/api-proxy/budgets?period=2026-10`, {
    method: "GET",
    headers: sessionHeaders,
  });
  assert.equal(budgetsRes.status, 200, "Budgets query must return 200");
  const budgetsData = (await budgetsRes.json()).data;
  const createdBudget = budgetsData.items.find(
    (b: { categoryName: string }) => b.categoryName === testMercadoCategory,
  );
  assert.ok(createdBudget, "Synchronized family budget must be present in the period overview");
  assert.equal(createdBudget.amount, 2400);

  // 5. Test Idempotency (Second execution with updated amount)
  const updatedPayload = {
    ...payload,
    budgets: [
      { categoryName: testMercadoCategory, amount: 2600, period: "2026-10" },
    ],
  };

  const reSyncRes = await fetch(`${WEB_URL}/api-proxy/organizze/sync`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify(updatedPayload),
  });
  assert.equal(reSyncRes.status, 200, "Re-sync must succeed");
  const reSyncResult = (await reSyncRes.json()).data;
  assert.equal(reSyncResult.accountsCreated, 0, "No duplicate accounts should be created");
  assert.equal(reSyncResult.accountsExisting, 1);
  assert.equal(reSyncResult.categoriesCreated, 0, "No duplicate categories should be created");
  assert.equal(reSyncResult.categoriesExisting, 2);
  assert.equal(reSyncResult.budgetsUpdated, 1, "Existing budget limit should be updated without error");
});
