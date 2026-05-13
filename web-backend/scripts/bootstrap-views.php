<?php
/**
 * @file
 * Bootstrap das Views REST/JSON com Contextual Filter por current-user:uid.
 *
 * Cria duas Views servindo endpoints que o Next.js consome:
 *   - /api/minhas-parcelas  → node de tipo `parcela` filtrado por
 *                              field_cliente = [current-user:uid]
 *   - /api/meus-contratos   → node de tipo `contrato` filtrado por
 *                              field_cliente = [current-user:uid]
 *
 * O Contextual Filter é cravado no Drupal — o cliente não tem como passar
 * o uid de outra pessoa via querystring. Defesa-em-profundidade contra IDOR
 * que complementa o `hook_node_access` do porto_auth.
 *
 * Uso:
 *   ddev drush scr scripts/bootstrap-views.php
 *   ddev drush config:export -y       # versionar as Views em config/sync
 *
 * Após esse script rodar:
 *   - `jsonapi_views` (módulo) deve estar habilitado
 *   - rota: GET /jsonapi/views/{view_id}/{display_id}
 *   - ou via REST: GET /api/{path}?_format=json com header Authorization Bearer
 */

declare(strict_types=1);

use Drupal\views\Entity\View;

/**
 * Cria/atualiza a View e o display REST.
 *
 * @param array<string,mixed> $config
 */
function porto_criar_view_minha(string $viewId, array $config): void {
  $existing = View::load($viewId);
  if ($existing) {
    echo "  View '$viewId' já existe — pulando.\n";
    return;
  }
  View::create($config)->save();
  echo "  ✓ View '$viewId' criada.\n";
}

// ====================================================================
// minhas_parcelas
// ====================================================================
porto_criar_view_minha('minhas_parcelas', [
  'id'          => 'minhas_parcelas',
  'label'       => 'Minhas parcelas',
  'description' => 'Parcelas do cliente autenticado. Filtro cravado em current-user:uid.',
  'base_table'  => 'node_field_data',
  'base_field'  => 'nid',
  'core'        => '11.x',
  'module'      => 'views',
  'tag'         => '',
  'display' => [
    'default' => porto_view_display_default('parcela', 'field_cliente_target_id'),
    'rest_minhas_parcelas' => [
      'display_plugin' => 'rest_export',
      'id'             => 'rest_minhas_parcelas',
      'display_title'  => 'REST: minhas parcelas',
      'position'       => 1,
      'display_options' => [
        'display_extenders' => [],
        'path'              => 'api/minhas-parcelas',
        'auth'              => ['cookie' => 'cookie', 'jwt_auth' => 'jwt_auth'],
        'style'             => ['type' => 'serializer'],
        'row'               => ['type' => 'data_entity'],
        'defaults'          => [
          'access'             => FALSE,
          'auth'               => FALSE,
          'style'              => FALSE,
          'row'                => FALSE,
          'arguments'          => FALSE,
          'filters'            => FALSE,
          'sorts'              => FALSE,
        ],
        'access' => [
          'type'    => 'role',
          'options' => ['role' => ['authenticated' => 'authenticated']],
        ],
        'arguments' => porto_view_contextual_filter('field_cliente_target_id'),
        'filters'   => porto_view_bundle_filter('parcela'),
        'sorts'     => porto_view_sort('field_vencimento_value', 'ASC'),
      ],
    ],
  ],
]);

// ====================================================================
// meus_contratos
// ====================================================================
porto_criar_view_minha('meus_contratos', [
  'id'          => 'meus_contratos',
  'label'       => 'Meus contratos',
  'description' => 'Contratos do cliente autenticado. Filtro cravado em current-user:uid.',
  'base_table'  => 'node_field_data',
  'base_field'  => 'nid',
  'core'        => '11.x',
  'module'      => 'views',
  'display' => [
    'default' => porto_view_display_default('contrato', 'field_cliente_target_id'),
    'rest_meus_contratos' => [
      'display_plugin' => 'rest_export',
      'id'             => 'rest_meus_contratos',
      'display_title'  => 'REST: meus contratos',
      'position'       => 1,
      'display_options' => [
        'display_extenders' => [],
        'path'              => 'api/meus-contratos',
        'auth'              => ['cookie' => 'cookie', 'jwt_auth' => 'jwt_auth'],
        'style'             => ['type' => 'serializer'],
        'row'               => ['type' => 'data_entity'],
        'defaults'          => [
          'access'    => FALSE, 'auth' => FALSE,
          'style'     => FALSE, 'row'  => FALSE,
          'arguments' => FALSE, 'filters' => FALSE, 'sorts' => FALSE,
        ],
        'access' => [
          'type'    => 'role',
          'options' => ['role' => ['authenticated' => 'authenticated']],
        ],
        'arguments' => porto_view_contextual_filter('field_cliente_target_id'),
        'filters'   => porto_view_bundle_filter('contrato'),
        'sorts'     => porto_view_sort('field_data_assinatura_value', 'DESC'),
      ],
    ],
  ],
]);

echo "\nViews criadas. Agora rode:\n";
echo "  ddev drush cr\n";
echo "  ddev drush config:export -y\n";

/* ---------------- helpers de display ---------------- */

/**
 * @return array<string,mixed>
 */
function porto_view_display_default(string $bundle, string $argField): array {
  return [
    'display_plugin' => 'default',
    'id'             => 'default',
    'display_title'  => 'Padrão',
    'position'       => 0,
    'display_options' => [
      'access' => [
        'type'    => 'role',
        'options' => ['role' => ['authenticated' => 'authenticated']],
      ],
      'cache' => ['type' => 'tag'],
      'query' => ['type' => 'views_query'],
      'arguments' => porto_view_contextual_filter($argField),
      'filters'   => porto_view_bundle_filter($bundle),
      'sorts'     => porto_view_sort('created', 'DESC'),
    ],
  ];
}

/**
 * Contextual Filter — `[current-user:uid]` via token default_action='default'.
 *
 * @return array<string,mixed>
 */
function porto_view_contextual_filter(string $field): array {
  return [
    $field => [
      'id'             => $field,
      'table'          => 'node__' . preg_replace('/_target_id$/', '', $field),
      'field'          => $field,
      'plugin_id'      => 'numeric',
      'default_action' => 'default',
      'default_argument_type'    => 'user',
      'default_argument_options' => ['user_uid' => TRUE],
      'specify_validation' => TRUE,
      'validate' => ['type' => 'user', 'fail' => 'access denied'],
      'break_phrase' => FALSE,
      'not'         => FALSE,
    ],
  ];
}

/**
 * @return array<string,mixed>
 */
function porto_view_bundle_filter(string $bundle): array {
  return [
    'type' => [
      'id'       => 'type',
      'table'    => 'node_field_data',
      'field'    => 'type',
      'plugin_id' => 'bundle',
      'operator' => 'in',
      'value'    => [$bundle => $bundle],
    ],
    'status' => [
      'id'       => 'status',
      'table'    => 'node_field_data',
      'field'    => 'status',
      'plugin_id' => 'boolean',
      'value'    => '1',
    ],
  ];
}

/**
 * @return array<string,mixed>
 */
function porto_view_sort(string $field, string $direction): array {
  return [
    $field => [
      'id'    => $field,
      'table' => 'node__' . preg_replace('/_value$/', '', $field),
      'field' => $field,
      'plugin_id' => 'standard',
      'order' => $direction,
    ],
  ];
}
