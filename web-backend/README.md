# Backend Drupal — Porto das Oliveiras

## Setup local (DDEV)

```powershell
cd web-backend
ddev start
ddev composer install
ddev drush site:install --existing-config -y
ddev drush user:role:add administrator admin
ddev launch
```

URL local: https://porto-das-oliveiras.ddev.site

## Estrutura

```
web-backend/
├── .ddev/                        # Configuração DDEV
├── composer.json                 # Dependências do Drupal e contrib
├── config/sync/                  # Configuration Management (export)
└── web/                          # Docroot
    ├── modules/
    │   ├── contrib/              # Módulos via composer (ignorado no git)
    │   └── custom/
    │       ├── porto_auth/       # JWT auto-provision Google/Microsoft
    │       └── porto_banking/    # Integração API bancária
    ├── themes/custom/
    └── sites/default/
```

## Sincronizar configuração

```powershell
# Exportar mudanças locais para o repositório:
ddev drush config:export

# Importar config do repositório no Drupal local:
ddev drush config:import
```

## Trocar chave JWT

A chave HS256 usada na ponte com o Next.js fica no módulo `key`:

```powershell
ddev drush key:set porto_frontend_jwt "<segredo-gerado>"
```

Esse mesmo segredo precisa estar em `web-frontend/.env.local` como `DRUPAL_JWT_SECRET`.
