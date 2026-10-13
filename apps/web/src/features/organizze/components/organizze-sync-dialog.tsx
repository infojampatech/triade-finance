import type { OrganizzeSyncPreviewOutput } from "@openmonetis/validators/organizze";
import { ArrowRight, CheckCircle2, FileSpreadsheet, Loader2, RefreshCw, Sparkles, UploadCloud } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MobileFormContent as DialogContent } from "@/components/forms/mobile-form-content";
import { MobileFormDialog as Dialog } from "@/components/forms/mobile-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useOrganizzePreviewMutation,
  useOrganizzeSyncMutation,
} from "../organizze.mutations";
import { describeSyncSuccessMessage, formatWorkspaceBadge } from "../organizze.presentation";

const placeholderCsv = `Categoria;Tipo;Orcamento
Alimentacao / Supermercado;Despesa;1800,00
Moradia / Aluguel;Despesa;2500,00
Moradia / Luz;Despesa;320,00
Servidores Cloud;Despesa;500,00
Lazer;Despesa;400,00
Salario;Receita;`;

export function OrganizzeSyncDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [content, setContent] = useState("");
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [preview, setPreview] = useState<OrganizzeSyncPreviewOutput | null>(null);

  const previewMutation = useOrganizzePreviewMutation();
  const syncMutation = useOrganizzeSyncMutation();

  const handlePreview = async () => {
    if (!content.trim()) {
      toast.error("Insira o conteúdo CSV ou JSON do Organizze para analisar.");
      return;
    }

    try {
      let isJson = false;
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(content);
        isJson = true;
      } catch {
        isJson = false;
      }

      const res = await previewMutation.mutateAsync(
        isJson
          ? { ...payload, defaultPeriod: period }
          : { csvContent: content, defaultPeriod: period },
      );
      setPreview(res);
      toast.success("Dados analisados com sucesso!");
    } catch {
      toast.error("Falha ao analisar dados do Organizze. Verifique o formato inserido.");
    }
  };

  const handleSync = async () => {
    if (!preview) return;

    try {
      let isJson = false;
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(content);
        isJson = true;
      } catch {
        isJson = false;
      }

      const result = await syncMutation.mutateAsync(
        isJson
          ? { ...payload, defaultPeriod: period }
          : { csvContent: content, defaultPeriod: period },
      );

      toast.success(describeSyncSuccessMessage(result));
      setPreview(null);
      setContent("");
      onOpenChange(false);
    } catch {
      toast.error("Ocorreu um erro ao sincronizar os dados com a Tríade.");
    }
  };

  const handleFillExample = () => {
    setContent(placeholderCsv);
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <UploadCloud className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Conector Organizze & Orçamentos</DialogTitle>
              <DialogDescription>
                Importe e sincronize seu plano de contas, árvore de categorias e tetos de gastos com direcionamento inteligente para a Tríade.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="w-1/2">
              <Label htmlFor="sync-period" className="text-xs font-medium">
                Mês de Referência dos Orçamentos
              </Label>
              <Input
                id="sync-period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFillExample}
              className="text-xs gap-1.5 self-end"
            >
              <FileSpreadsheet className="size-3.5" />
              Preencher Exemplo CSV
            </Button>
          </div>

          <div>
            <Label htmlFor="sync-content" className="text-xs font-medium">
              Conteúdo CSV ou JSON Exportado do Organizze
            </Label>
            <Textarea
              id="sync-content"
              rows={7}
              placeholder={placeholderCsv}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setPreview(null);
              }}
              className="mt-1 font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Cole o arquivo CSV de categorias/orçamentos ou o JSON estruturado do Organizze.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handlePreview}
              disabled={previewMutation.isPending || !content.trim()}
              variant="secondary"
              className="w-full gap-2"
            >
              {previewMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Analisar e Pré-visualizar Tríade
            </Button>
          </div>

          {preview && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Resumo da Análise
                </h4>
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline">{preview.totalAccounts} contas</Badge>
                  <Badge variant="outline">{preview.totalCategories} categorias</Badge>
                  <Badge variant="default">{preview.totalBudgets} orçamentos</Badge>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
                <p className="font-medium text-foreground">Direcionamento Automático para Workspaces:</p>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {preview.categories.map((c, i) => {
                    const badge = formatWorkspaceBadge(c.targetWorkspaceType);
                    return (
                      <div
                        key={`${c.name}-${i}`}
                        className="flex items-center justify-between py-1 px-2 rounded bg-background/80 border text-[11px]"
                      >
                        <span className="font-medium">
                          {c.fullName || c.name}{" "}
                          <span className="text-muted-foreground">({c.type === "expense" ? "Despesa" : "Receita"})</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <Badge variant={badge.variant} className="text-[10px] h-4">
                            {badge.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {preview.budgets.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {preview.budgets.length} teto(s) de gastos identificados
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        Serão configurados no Workspace Familiar para o período {preview.defaultPeriod}.
                      </p>
                    </div>
                    <Badge variant="default">Familiar</Badge>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="w-full gap-2 mt-2"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Sincronizar com a Tríade Agora
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
