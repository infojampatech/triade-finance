# Deploy com Custo Zero: Cloudflare Tunnel & HTTPS Seguro

Este guia ensina como publicar o **Tríade Finance** na internet com **domínio próprio**, **certificado SSL/HTTPS automático**, proteção contra ataques DDoS e **zero portas abertas** no firewall ou roteador, utilizando o **Cloudflare Zero Trust** (gratuito para até 50 usuários).

---

## 1. Por Que Usar Cloudflare Tunnel?

- **Custo Zero:** 100% gratuito pela Cloudflare.
- **Sem IP Fixo:** Funciona mesmo em conexões residenciais (CGNAT / IP dinâmico de operadora).
- **Sem Port Forwarding:** Não precisa abrir a porta 80 ou 443 no seu roteador.
- **HTTPS & SSL Automático:** Certificado gerenciado e renovado pela Cloudflare.
- **Acesso Global:** Você e sua família podem acessar o app no celular de qualquer lugar do mundo como PWA.

---

## 2. Pré-requisitos

1. Um domínio registrado (ex: `seudominio.com.br`, que custa ~R$ 40/ano no Registro.br ou gratuito em outros provedores).
2. O domínio configurado com os nameservers gratuitos da [Cloudflare](https://dash.cloudflare.com).

---

## 3. Passo a Passo: Criando o Túnel na Cloudflare

1. Acesse o **[Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com)**.
2. No menu lateral, navegue até **Networks** $\rightarrow$ **Tunnels** (ou **Access** $\rightarrow$ **Tunnels**).
3. Clique em **"Add a tunnel"** e selecione o tipo **Cloudflare (cloudflared)**.
4. Dê um nome ao túnel: `triade-finance` e clique em **Save tunnel**.
5. Na tela de instalação, selecione o ambiente **Docker**. A Cloudflare exibirá um comando com um token longo:
   ```bash
   docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token <TOKEN_LONGO>
   ```
   **Copie apenas o `<TOKEN_LONGO>`** (esse é o seu `CLOUDFLARE_TUNNEL_TOKEN`).
6. Clique em **Next**.
7. Na aba **Public Hostnames**, configure a rota pública para o container:
   - **Subdomain:** `financas` (ou `app` / `triade`)
   - **Domain:** selecione o seu domínio (ex: `seudominio.com.br`)
   - **Path:** deixe vazio
   - **Type:** `HTTP`
   - **URL:** `web:7002` (nome do serviço web na rede interna Docker)
8. Clique em **Save hostname**.

---

## 4. Configuração no Tríade Finance

### 4.1 Adicione as variáveis no seu `.env`
No arquivo `.env` do seu servidor/máquina:

```dotenv
# Domínio público HTTPS configurado no Cloudflare Tunnel
OPENMONETIS_URL=https://financas.seudominio.com.br
BETTER_AUTH_URL=https://financas.seudominio.com.br
WEB_URL=https://financas.seudominio.com.br
CORS_ORIGIN=https://financas.seudominio.com.br

# Token do túnel copiado do dashboard da Cloudflare
CLOUDFLARE_TUNNEL_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.2 Iniciando a Aplicação com o Túnel
O repositório já inclui o arquivo de sobreposição [compose.tunnel.yml](file:///f:/DEV/DEV_PES/triade-finance/compose.tunnel.yml). Inicie com:

```bash
docker compose -f compose.yml -f compose.tunnel.yml up -d
```

O container `cloudflared` iniciará automaticamente, estabelecerá a conexão segura de saída com a rede Cloudflare e passará a responder no seu domínio HTTPS imediatamente!

---

## 5. Instalando como PWA no Celular

1. Abra o navegador do celular (Chrome no Android ou Safari no iOS).
2. Acesse `https://financas.seudominio.com.br`.
3. Toque em **"Adicionar à tela de início"** ou **"Instalar aplicativo"**.
4. O Tríade Finance será instalado como aplicativo nativo com ícone e tela cheia!
