# Configuração versionada (Configuration Management)

Esta pasta é a **fonte da verdade** para a configuração do Drupal.
Use Drush para sincronizar:

```powershell
# Exportar o estado atual do site para esta pasta:
ddev drush config:export -y

# Importar esta pasta para o site (depois de pull/merge):
ddev drush config:import -y

# Diff antes de importar:
ddev drush config:status
```

## O que está versionado aqui

- Roles e permissões (`user.role.*.yml`)
- Content Types (`node.type.lote.yml`, etc.)
- Campos (`field.storage.*.yml`, `field.field.*.yml`)
- Form e view displays (`core.entity_form_display.*.yml`, `core.entity_view_display.*.yml`)
- Views (`views.view.*.yml`)
- Settings de JSON:API role access (`jsonapi_role_access.config.yml`)

## O que NÃO entra aqui

- Conteúdo (nós, usuários) — isso vai por seed scripts (Drush ou `default_content`).
- Configurações que mudam por ambiente — usar `settings.local.php` ou Config Split.

## Bootstrap do site

Os YAMLs nesta pasta são o suficiente para `drush site:install --existing-config`.
Mais campos serão adicionados aqui à medida que evoluímos o modelo.
