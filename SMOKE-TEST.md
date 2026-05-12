# Smoke test ponta-a-ponta

> **Objetivo**: provar, no menor número de passos possível, que **Next.js está
> conversando com o Drupal**. Em vez de quebrar a cabeça depurando um lote que
> não aparece depois de implementar tudo, fazemos um "Hello World" do
> pipeline inteiro — cadastrar 1 lote no admin do Drupal e ver ele renderizar
> na home do Next.js.

## Pré-requisitos

- Docker Desktop rodando.
- DDEV instalado (`winget install ddev`).
- Node 20+ e npm.
- Credenciais OAuth criadas:
  - **Google**: https://console.cloud.google.com/apis/credentials → OAuth Client → redirect `http://localhost:3000/api/auth/callback/google`.
  - **Microsoft**: https://portal.azure.com → App registrations → "Personal Microsoft accounts and any directory" → redirect `http://localhost:3000/api/auth/callback/microsoft-entra-id`.
- API key do Gemini: https://aistudio.google.com/apikey.

## Roteiro

### 1. Backend Drupal

```powershell
cd web-backend
ddev start
ddev composer install
# Primeira instalação (não tem config exportada ainda):
ddev drush site:install standard --site-name="Porto das Oliveiras" -y
# Habilitar módulos contrib + custom:
ddev drush en jsonapi_extras jsonapi_views jsonapi_role_access key restui pathauto entity_print porto_auth porto_banking -y
# Criar Content Types (lote, contrato, parcela) + roles versionados.
# --partial ignora YAMLs com UUIDs faltantes — OK no primeiro boot.
ddev drush config:import -y --partial --source=../config/sync
# Criar os ~17 campos restantes via API:
ddev drush scr scripts/bootstrap-content-model.php
# Agora exportar tudo (com UUIDs gerados) para o config/sync — daqui em
# diante o repo passa a ser fonte da verdade.
ddev drush config:export -y
```

### 2. Chave JWT compartilhada

```powershell
# Gerar segredo (mínimo 32 chars para HS256):
$segredo = -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
# Criar a Key no Drupal:
#  - key_type=authentication aceita texto livre (simples).
#  - key_provider=config armazena no banco em campo encriptado.
ddev drush key:create porto_frontend_jwt `
  --key-type=authentication `
  --key-provider=config `
  --key-input=text_field `
  --key-value="$segredo"
# Anotar para colocar no .env.local do front:
$segredo
```

### 3. Cadastrar 1 lote pelo admin do Drupal

```powershell
ddev launch /node/add/lote
```

Preencher: título `Q01-L01`, quadra `01`, número `1`, metragem `300`,
valor `120000`, status `Disponível`. Salvar.

Validar o JSON:API:

```powershell
ddev exec curl -s "https://porto-das-oliveiras.ddev.site/jsonapi/node/lote?fields[node--lote]=title,field_status,field_valor" | jq
```

Esperado: 1 item com `attributes.title == "Q01-L01"`.

### 4. Frontend Next.js

```powershell
cd ../web-frontend
npm install
Copy-Item .env.example .env.local
# Editar .env.local — preencher AUTH_SECRET, AUTH_GOOGLE_ID/SECRET,
# AUTH_MICROSOFT_*, GEMINI_API_KEY e o DRUPAL_JWT_SECRET com o $segredo do passo 2.
npm run dev
```

Abrir http://localhost:3000 → o card do lote `Q01-L01` deve aparecer com badge
verde "Disponível". Se aparecer, **o caminho público funciona**.

### 5. Login do cliente

- Clicar em "Cliente" no menu → redireciona para `/login`.
- Entrar com Google ou Microsoft.
- Esperado:
  - NextAuth completa OAuth.
  - Após callback, redirect para `/painel`.
  - No Drupal: `ddev drush user:list` mostra um usuário recém-criado com seu email (auto-provisionado pelo `porto_auth`).

### 6. Parcela visível só ao dono

- No admin do Drupal: criar um Contrato apontando para o usuário recém-criado, criar 1 Parcela com `field_cliente_parcela` = esse usuário.
- Voltar ao Next.js, ir em **Parcelas** — deve aparecer.
- Logar com outra conta Google/Microsoft — não deve aparecer nada (sem precisar configurar nada extra: a View tem Contextual Filter `[current-user:uid]`).

## Quando esse teste falha — onde olhar

| Sintoma                                    | Causa provável                                 |
|--------------------------------------------|-----------------------------------------------|
| Home vazia, sem erros                       | JSON:API não exposto ou role anonymous sem acesso a node:lote |
| `Drupal 401` ao listar parcelas             | JWT inválido (segredo desalinhado entre front e Key module) |
| Login Microsoft volta com erro              | Issuer errado — usar `https://login.microsoftonline.com/common/v2.0` para Hotmail |
| Login OK mas `auth()` retorna null no front | `AUTH_SECRET` ausente ou domínio do callback errado no provider |
| Usuário não aparece no Drupal após login    | Módulo `porto_auth` não habilitado ou Key `porto_frontend_jwt` não criada |
| CORS bloqueia o front                       | Em produção, configurar `services.yml` do Drupal — em DDEV local funciona via mesma origem se usarmos proxy `/api/drupal/...` |

Só seguir para implementar o resto (Gemini avançado, Entity Print, integração bancária)
**depois** que esse smoke test inteiro passar. É a garantia de que a fundação está sã.
