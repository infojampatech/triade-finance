import assert from "node:assert/strict";
import test from "node:test";

const WEB_URL = process.env.WEB_URL || "http://localhost:7002";
const API_URL = process.env.API_URL || "http://127.0.0.1:7001";

test("E2E - Health and API Proxy connectivity", async () => {
  const apiHealth = await fetch(`${API_URL}/api/health`);
  assert.equal(apiHealth.status, 200, "Direct API health must return 200");
  const apiHealthData = await apiHealth.json();
  assert.equal(apiHealthData.status, "ok");

  const webHealthProxy = await fetch(`${WEB_URL}/api/health`);
  assert.equal(webHealthProxy.status, 200, "Web proxy /api/health must return 200");
  const webHealthData = await webHealthProxy.json();
  assert.equal(webHealthData.status, "ok");

  const webApiProxy = await fetch(`${WEB_URL}/api-proxy/health`);
  assert.equal(webApiProxy.status, 200, "Web proxy /api-proxy/health must return 200");
  const webApiProxyData = await webApiProxy.json();
  assert.equal(webApiProxyData.data.status, "ok");
});

test("E2E - Critical User Journey: Authentication, Workspaces, Accounts, Transactions and Dashboard", async () => {
  // 1. Authentication flow
  const loginRes = await fetch(`${WEB_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: WEB_URL,
    },
    body: JSON.stringify({
      email: "admin@triade.local",
      password: "SenhaForte123!",
    }),
  });

  assert.equal(loginRes.status, 200, "Login must succeed with 200");
  const cookieHeader = loginRes.headers.get("set-cookie");
  assert.ok(cookieHeader, "Login response must set session cookie");

  const sessionCookie = cookieHeader.split(";")[0];
  const authHeaders = {
    "Content-Type": "application/json",
    Cookie: sessionCookie,
    Origin: WEB_URL,
  };

  // 2. Validate Session
  const sessionRes = await fetch(`${WEB_URL}/api/auth/get-session`, {
    headers: authHeaders,
  });
  assert.equal(sessionRes.status, 200);
  const sessionData = await sessionRes.json();
  assert.ok(sessionData?.user, "Session must contain authenticated user");
  assert.equal(sessionData.user.email, "admin@triade.local");
  const userId = sessionData.user.id;

  // 3. Workspace Switcher (Pilares da Tríade)
  const workspacesRes = await fetch(`${WEB_URL}/api-proxy/workspaces`, {
    headers: authHeaders,
  });
  assert.equal(workspacesRes.status, 200);
  const workspacesPayload = await workspacesRes.json();
  assert.ok(Array.isArray(workspacesPayload.data), "Workspaces data must be an array");
  assert.ok(workspacesPayload.data.length >= 3, "User must have at least the 3 Triade pillars");

  const types = workspacesPayload.data.map((w: any) => w.type);
  assert.ok(types.includes("personal"), "Must include Pessoal pillar");
  assert.ok(types.includes("family"), "Must include Familiar pillar");
  assert.ok(types.includes("business"), "Must include Negócio pillar");

  // 4. Categories list
  const categoriesRes = await fetch(`${WEB_URL}/api-proxy/categories`, {
    headers: authHeaders,
  });
  assert.equal(categoriesRes.status, 200);
  const categoriesPayload = await categoriesRes.json();
  const categories = categoriesPayload.data;
  assert.ok(categories.length > 0, "Categories must be seeded");

  const salaryCat = categories.find((c: any) => c.name.toLowerCase().includes("salário"));
  const marketCat = categories.find((c: any) => c.name.toLowerCase().includes("mercado"));
  assert.ok(salaryCat, "Salário category must exist");
  assert.ok(marketCat, "Mercado category must exist");

  // 5. Financial Account creation
  const accountRes = await fetch(`${WEB_URL}/api-proxy/accounts`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      name: `Conta E2E ${Date.now()}`,
      type: "checking",
      excludeFromTotal: false,
    }),
  });
  assert.ok([200, 201].includes(accountRes.status), "Account creation must succeed (200 or 201)");
  const accountPayload = await accountRes.json();
  const accountId = accountPayload.data.id;
  assert.ok(accountId, "Created account must have an ID");

  // 6. People list (Find admin person)
  const peopleRes = await fetch(`${WEB_URL}/api-proxy/people`, {
    headers: authHeaders,
  });
  assert.equal(peopleRes.status, 200);
  const peoplePayload = await peopleRes.json();
  const adminPerson = peoplePayload.data.find((p: any) => p.role === "admin");
  assert.ok(adminPerson, "Admin person must exist");

  // 7. Register Income Transaction (Receita: R$ 2.500,00)
  const incomeRes = await fetch(`${WEB_URL}/api-proxy/transactions`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      amount: 2500,
      name: "Receita E2E Teste",
      type: "income",
      condition: "single",
      paymentMethod: "pix",
      purchaseDate: "2026-10-15",
      isSettled: true,
      accountId,
      categoryId: salaryCat.id,
      personId: adminPerson.id,
    }),
  });
  assert.ok(
    [200, 201].includes(incomeRes.status),
    `Income transaction creation must succeed (got ${incomeRes.status}): ${await incomeRes.text()}`,
  );

  // 8. Register Expense Transaction (Despesa: R$ 300,00)
  const expenseRes = await fetch(`${WEB_URL}/api-proxy/transactions`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      amount: 300,
      name: "Despesa E2E Teste",
      type: "expense",
      condition: "single",
      paymentMethod: "pix",
      purchaseDate: "2026-10-15",
      isSettled: true,
      accountId,
      categoryId: marketCat.id,
      personId: adminPerson.id,
    }),
  });
  assert.ok(
    [200, 201].includes(expenseRes.status),
    `Expense transaction creation must succeed (got ${expenseRes.status}): ${await expenseRes.text()}`,
  );

  // 9. Dashboard verification for period 2026-10
  const dashboardRes = await fetch(`${WEB_URL}/api-proxy/dashboard/snapshot?period=2026-10`, {
    headers: authHeaders,
  });
  assert.equal(dashboardRes.status, 200, "Dashboard snapshot query must succeed");
  const dashboardPayload = await dashboardRes.json();
  const metrics = dashboardPayload.data.metrics;

  assert.ok(metrics.income.current >= 2500, "Total income must reflect created income");
  assert.ok(metrics.expenses.current >= 300, "Total expense must reflect created expense");
  assert.equal(
    metrics.balance.current,
    metrics.income.current - metrics.expenses.current,
    "Balance must equal total income minus total expense",
  );
});
