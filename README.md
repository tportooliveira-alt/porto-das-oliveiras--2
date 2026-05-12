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
- Composer 2 (opcional — o DDEV traz)

### Frontend

```bash
cd web-frontend
npm install
cp .env.example .env.local   # preencher credenciais
npm run dev                  # http://localhost:3000
```

### Backend

```bash
cd web-backend
ddev start                   # provisiona PHP, MariaDB, Mailpit
ddev composer install
ddev drush site:install --existing-config -y
ddev launch                  # https://porto-das-oliveiras.ddev.site
```

## Roles e permissões

| Role           | Acesso                                                       |
|----------------|--------------------------------------------------------------|
| anonymous      | Lotes públicos                                                |
| authenticated  | Próprios contratos, parcelas, documentos                      |
| vendedor       | Edita lotes, lê contratos                                     |
| financeiro     | Edita parcelas, dispara sincronização bancária                |
| administrador  | Acesso total                                                  |
