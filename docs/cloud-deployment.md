# Arquitetura de Deploy em Nuvem com Custo Zero

Este documento consolida as opções recomendadas para hospedar o **Tríade Finance** em produção sem custos recorrentes de servidor ou licença.

---

## 1. Topologia Recomendada: Supabase + Cloudflare Tunnel (100% Custo Zero)

Esta é a opção com melhor performance, segurança e soberania de dados.

```
+-------------------------------------------------------------+
|                     SEU DISPOSITIVO                         |
|           (PWA no Celular, Tablet ou Desktop)               |
+-------------------------------------------------------------+
                              |
                     HTTPS Seguro (SSL)
                              |
                              v
+-------------------------------------------------------------+
|                 CLOUDFLARE ZERO TRUST CDN                   |
|       - Proteção DDoS                                       |
|       - DNS Global Gratuito                                 |
|       - Certificado SSL Automático                          |
+-------------------------------------------------------------+
                              |
                    Túnel Criptografado
                              |
                              v
+-------------------------------------------------------------+
|             SEU SERVIDOR / MINI PC / NOTEBOOK               |
|  Docker Compose (API + Web + Worker + Cloudflared)          |
|  Zero portas abertas no roteador                            |
+-------------------------------------------------------------+
                              |
                  PostgreSQL Pooler (SSL)
                              |
                              v
+-------------------------------------------------------------+
|                    SUPABASE FREE TIER                       |
|  - PostgreSQL 16 Gerenciado                                 |
|  - 500 MB de armazenamento gratuito                         |
|  - Backups automáticos diários                              |
+-------------------------------------------------------------+
```

### Principais Benefícios:
1. **R$ 0,00/mês:** Zero cobrança de nuvem, zero custos de IP fixo.
2. **Soberania:** A aplicação roda na sua infraestrutura, os dados ficam seguros no PostgreSQL da nuvem.
3. **PWA Instalável:** Funciona como app no iPhone e Android sem precisar passar por App Store ou Google Play.
4. **Sem Riscos de Firewall:** Nenhum redirecionamento de porta necessário.

---

## 2. Passo a Passo Rápido

1. **Configure o Banco de Dados:**
   - Siga o guia [docs/supabase-deployment.md](supabase-deployment.md).
   - Obtenha a connection string e rode `pnpm db:migrate`.

2. **Configure o Acesso Externo:**
   - Siga o guia [docs/cloudflare-tunnel.md](cloudflare-tunnel.md).
   - Configure o domínio e o `CLOUDFLARE_TUNNEL_TOKEN`.

3. **Suba os Containers:**
   ```bash
   docker compose -f compose.yml -f compose.tunnel.yml up -d
   ```

4. **Ative a Sincronização Automática:**
   - No GitHub do seu repositório, adicione as secrets:
     - `TRIADE_URL`: sua URL HTTPS (ex: `https://financas.seudominio.com.br`)
     - `PIERRE_INTEGRATION_TOKEN`: token gerado no painel da Tríade em Dispositivos.
   - O workflow `.github/workflows/sync-pierre.yml` rodará a cada 4 horas mantendo os lançamentos atualizados e o Supabase acordado!
