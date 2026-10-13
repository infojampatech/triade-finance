import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTriadeRulePresets,
  createInboxRuleDraft,
  type InboxRuleCandidate,
  resolveInboxRules,
} from "./inbox-rules";

function makeRule(overrides: Partial<InboxRuleCandidate>): InboxRuleCandidate {
  return {
    id: "rule-1",
    name: "Regra Teste",
    priority: 100,
    isActive: true,
    matchMode: "all",
    conditions: [{ field: "originalText", operator: "contains", value: "teste" }],
    categoryId: null,
    personId: null,
    workspaceId: null,
    accountId: null,
    ...overrides,
  };
}

test("createInboxRuleDraft accepts a rule with only workspaceId or only accountId", () => {
  const draftWithWorkspace = createInboxRuleDraft({
    userId: "user-1",
    name: "Direciona Negócio",
    priority: 10,
    isActive: true,
    matchMode: "all",
    conditions: [{ field: "originalText", operator: "contains", value: "PJ" }],
    categoryId: null,
    personId: null,
    workspaceId: "ws-business",
    accountId: null,
  });
  assert.equal(draftWithWorkspace.workspaceId, "ws-business");

  const draftWithAccount = createInboxRuleDraft({
    userId: "user-1",
    name: "Conta Itaú",
    priority: 20,
    isActive: true,
    matchMode: "all",
    conditions: [{ field: "originalText", operator: "contains", value: "itau" }],
    categoryId: null,
    personId: null,
    workspaceId: null,
    accountId: "acc-itau",
  });
  assert.equal(draftWithAccount.accountId, "acc-itau");

  assert.throws(
    () =>
      createInboxRuleDraft({
        userId: "user-1",
        name: "Sem Ação",
        priority: 10,
        isActive: true,
        matchMode: "all",
        conditions: [{ field: "originalText", operator: "contains", value: "nada" }],
        categoryId: null,
        personId: null,
        workspaceId: null,
        accountId: null,
      }),
    { name: "InboxRuleError", code: "inbox_rule_actions_required" },
  );
});

test("resolveInboxRules assigns workspaceId and accountId independently", () => {
  const item = {
    sourceApp: "com.itau",
    sourceAppName: "Itaú PJ",
    originalTitle: "Pix Enviado",
    originalText: "Pix enviado para Fornecedor no valor de R$ 500,00",
    parsedName: "Fornecedor",
    parsedAmount: 500,
  };

  const rules: InboxRuleCandidate[] = [
    makeRule({
      id: "rule-ws",
      name: "Workspace Negócio",
      priority: 10,
      conditions: [{ field: "originalText", operator: "contains", value: "fornecedor" }],
      workspaceId: "ws-business",
    }),
    makeRule({
      id: "rule-cat",
      name: "Categoria Fornecedores",
      priority: 20,
      conditions: [{ field: "originalText", operator: "contains", value: "fornecedor" }],
      categoryId: "cat-suppliers",
    }),
    makeRule({
      id: "rule-acc",
      name: "Conta Itaú",
      priority: 30,
      conditions: [{ field: "sourceAppName", operator: "contains", value: "Itaú" }],
      accountId: "acc-itau",
    }),
  ];

  const resolution = resolveInboxRules(item, rules);

  assert.equal(resolution.workspaceId, "ws-business");
  assert.equal(resolution.categoryId, "cat-suppliers");
  assert.equal(resolution.accountId, "acc-itau");
  assert.equal(resolution.personId, null);
  assert.deepEqual(
    resolution.appliedRules.map((r) => r.id),
    ["rule-ws", "rule-cat", "rule-acc"],
  );
  assert.deepEqual(resolution.appliedRules[0]?.fields, ["workspaceId"]);
  assert.deepEqual(resolution.appliedRules[1]?.fields, ["categoryId"]);
  assert.deepEqual(resolution.appliedRules[2]?.fields, ["accountId"]);
});

test("Triade presets correctly classify business, family and personal transactions", () => {
  const presets = buildTriadeRulePresets({
    personalId: "ws-personal",
    familyId: "ws-family",
    businessId: "ws-business",
  }).map((preset, index) => ({
    id: `preset-${index}`,
    ...preset,
  }));

  const businessItem = {
    sourceApp: "com.bb.pj",
    sourceAppName: "Banco do Brasil Empresas",
    originalTitle: "Pagamento",
    originalText: "Pagamento de Nota Fiscal para Prestador de Serviços",
    parsedName: "Prestador",
    parsedAmount: 1200,
  };
  const businessResolution = resolveInboxRules(businessItem, presets);
  assert.equal(businessResolution.workspaceId, "ws-business");

  const familyItem = {
    sourceApp: "com.nubank",
    sourceAppName: "Nubank",
    originalTitle: "Compra Aprovada",
    originalText: "Compra aprovada em Supermercado Carrefour no valor de R$ 380,00",
    parsedName: "Supermercado Carrefour",
    parsedAmount: 380,
  };
  const familyResolution = resolveInboxRules(familyItem, presets);
  assert.equal(familyResolution.workspaceId, "ws-family");

  const personalItem = {
    sourceApp: "com.nubank",
    sourceAppName: "Nubank",
    originalTitle: "Compra Aprovada",
    originalText: "Compra aprovada em Farmacia Drogasil no valor de R$ 45,00",
    parsedName: "Farmacia Drogasil",
    parsedAmount: 45,
  };
  const personalResolution = resolveInboxRules(personalItem, presets);
  assert.equal(personalResolution.workspaceId, "ws-personal");
});
