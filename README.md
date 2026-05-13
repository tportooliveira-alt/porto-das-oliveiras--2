# Porto das Oliveiras

Sistema de vendas e gestão imobiliária para o loteamento Porto das Oliveiras
(Vitória da Conquista — BA).

## Arquitetura

- **web-frontend/** — Next.js 14 (App Router) hospedado na Vercel.
- **web-backend/** — Drupal 11 headless, exposto via JSON:API, rodando localmente em DDEV.
- **Autenticação** — NextAuth.js no Next.js (Google + Microsoft), ponte via JWT para o Drupal.
- **IA** — Google Gemini consumido pelo Next.js (server-side em Route Handlers).

## Setup local

### Pré-requisitos
- Node.js 20+
- Docker Desktop
- DDEV (`winget install ddev`)
- **Windows: WSL2 instalado** (`wsl --install` como admin + reboot). Sem WSL2 o
  Docker Desktop não sobe em Win11 Home.
- Composer 2 (opcional — o DDEV traz)

### Frontend

```bash
cd web-frontend
npm install
cp .env.example .env.local   # preencher credenciais (ver tabela abaixo)
npm run dev                  # http://localhost:3000
```

> **OneDrive**: o `npm install` trava se o diretório estiver dentro do OneDrive.
> Solução: copiar `web-frontend/` para uma pasta fora (ex.: `C:\temp\porto-test`)
> antes do `npm install` e rodar de lá.

### Backend

```bash
cd web-backend
# Fix do binário docker-compose que vem com DDEV (rodar uma vez):
ddev config global --required-docker-compose-version="" --use-docker-compose-from-path=false

ddev start                   # provisiona PHP, MariaDB, Mailpit
ddev composer install        # se travar em packagist, ver troubleshooting

# Primeiro setup (não há config exportada ainda):
ddev drush site:install standard --site-name="Porto das Oliveiras" -y
# ANOTAR o admin password mostrado aqui — usado para acessar /user/login

ddev drush en jsonapi_extras jsonapi_views jsonapi_role_access key restui \
  pathauto entity_print porto_auth porto_banking porto_analytics -y
ddev drush config:import -y --partial --source=../config/sync
ddev drush scr scripts/bootstrap-content-model.php
ddev drush config:export -y

# Liberar JSON:API público + dar acesso a anonymous:
ddev drush role:perm:add anonymous "access content"
ddev drush ev '\Drupal::configFactory()->getEditable("jsonapi_role_access.settings")->set("roles.anonymous","anonymous")->save();'
ddev drush cr

ddev launch                  # http://porto-das-oliveiras.ddev.site
```

Após esse setup, o repo passa a ser fonte da verdade — futuros checkouts podem
usar `--existing-config`.

### Variáveis de ambiente (`web-frontend/.env.local`)

| Chave | Origem |
|---|---|
| `AUTH_SECRET` | Gerar: `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `_SECRET` | Google Cloud Console → OAuth client |
| `AUTH_MICROSOFT_ENTRA_ID_ID` / `_SECRET` | Azure Portal → App registration |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | `https://login.microsoftonline.com/common/v2.0` |
| `DRUPAL_BASE_URL` | `http://porto-das-oliveiras.ddev.site` (sem HTTPS local) |
| `DRUPAL_JWT_SECRET` | 48+ chars, **mesmo valor** salvo na Key `porto_frontend_jwt` no Drupal |
| `GEMINI_API_KEY` | aistudio.google.com/apikey |

Para criar a Key compartilhada no Drupal:

```bash
ddev drush key:save porto_frontend_jwt "<segredo-48-chars>" \
  --label="Porto Frontend JWT" --key-type=authentication \
  --key-provider=config --key-input=text_field -y
```

## Testes estáticos

Validação sem Docker/Drupal (só Node) — ver [tests/README.md](tests/README.md).

## Roles e permissões

| Role           | Acesso                                                       |
|----------------|--------------------------------------------------------------|
| anonymous      | Lotes públicos                                                |
| authenticated  | Próprios contratos, parcelas, documentos                      |
| vendedor       | Edita lotes, lê contratos                                     |
| financeiro     | Edita parcelas, dispara sincronização bancária                |
| administrador  | Acesso total                                                  |

## Troubleshooting

| Sintoma | Causa / Fix |
|---|---|
| `docker info` retorna `Docker Desktop is unable to start` | WSL2 ausente. Rodar `wsl --install` (admin) e reiniciar. |
| `ddev composer install` trava em `repo.packagist.org timeout` | CDN do packagist instável. `ddev exec composer config -g repo.packagist composer https://packagist.org` |
| `drush scr bootstrap`: `settings.allowed_values.0.label.0 doesn't exist` | Em PHP, `allowed_values` deve ser associativo `value => label` (sem array de objetos) |
| JSON:API 403 mesmo com `access content` | `jsonapi_role_access` nega por padrão — habilitar `anonymous` na config (ver setup) |
| `filter[path.alias]=...` retorna 500 `'path' not found` | JSON:API não expõe o pseudo-campo `path`. Usar `/jsonapi/node/lote/<uuid>` direto. |
| HTTP/HTTPS bate em "plain HTTP sent to HTTPS port" | Verificar se `.ddev/config.yaml` tem `web_extra_exposed_ports` ruim — remover. |
