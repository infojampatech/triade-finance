import assert from "node:assert/strict";
import test from "node:test";

const WEB_URL = process.env.WEB_URL || "http://localhost:7002";

test("E2E - Pierre connector: token auth, inbox ingestion and idempotent re-import", async () => {
  const loginRes = await fetch(`${WEB_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: WEB_URL },
    body: JSON.stringify({ email: "admin@triade.local", password: "SenhaForte123!" }),
  });
  assert.equal(loginRes.status, 200);
  const sessionCookie = (loginRes.headers.get("set-cookie") ?? "").split(";")[0] as string;
  const sessionHeaders = {
    "Content-Type": "application/json",
    Cookie: sessionCookie,
    Origin: WEB_URL,
  };

  const tokenRes = await fetch(`${WEB_URL}/api-proxy/device-tokens`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({ name: `Pierre E2E ${Date.now()}` }),
  });
  assert.ok([200, 201].includes(tokenRes.status), `token creation failed: ${tokenRes.status}`);
  const created = (await tokenRes.json()).data;
  const pierreUrl = `${WEB_URL}/api-proxy/integrations/pierre/transactions`;

  try {
    const run = Date.now();
    const payload = {
      transactions: [
        {
          externalId: `e2e-${run}-1`,
          date: "2026-10-10",
          amount: -42.9,
          accountId: "acc-pj",
          accountName: "Conta PJ",
          description: `Padaria E2E ${run}`,
        },
        {
          externalId: `e2e-${run}-2`,
          date: "2026-10-11",
          amount: 1500,
          accountId: "acc-pj",
          accountName: "Conta PJ",
          description: `Cliente E2E ${run}`,
        },
      ],
    };

    const unauthorized = await fetch(pierreUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(unauthorized.status, 401, "Pierre route must require an integration token");

    const bearer = { "Content-Type": "application/json", Authorization: `Bearer ${created.token}` };
    const first = await fetch(pierreUrl, {
      method: "POST",
      headers: bearer,
      body: JSON.stringify(payload),
    });
    assert.equal(first.status, 200);
    const firstData = (await first.json()).data;
    assert.equal(firstData.imported, 2);
    assert.equal(firstData.duplicates, 0);

    const second = await fetch(pierreUrl, {
      method: "POST",
      headers: bearer,
      body: JSON.stringify(payload),
    });
    const secondData = (await second.json()).data;
    assert.equal(secondData.imported, 0);
    assert.equal(secondData.duplicates, 2, "Re-import must be deduplicated");

    const invalid = await fetch(pierreUrl, {
      method: "POST",
      headers: bearer,
      body: JSON.stringify({ transactions: [{ date: "x", amount: 0 }] }),
    });
    assert.equal(invalid.status, 400);

    const inboxRes = await fetch(`${WEB_URL}/api-proxy/inbox?status=pending&pageSize=50`, {
      headers: sessionHeaders,
    });
    assert.equal(inboxRes.status, 200);
    const inbox = (await inboxRes.json()).data;
    const names = inbox.items.map((item: { originalText: string }) => item.originalText);
    assert.ok(
      names.some((text: string) => text.includes(`Padaria E2E ${run}`)),
      "Imported expense must wait in the inbox",
    );
    assert.ok(
      names.some((text: string) => text.includes(`Cliente E2E ${run}`)),
      "Imported income must wait in the inbox",
    );
  } finally {
    await fetch(`${WEB_URL}/api-proxy/device-tokens/${created.id}`, {
      method: "DELETE",
      headers: sessionHeaders,
    });
  }
});
