<?php
/**
 * @file
 * Bootstrap programático do modelo de conteúdo.
 *
 * Cria os campos restantes de Lote, Contrato e Parcela via API do Drupal.
 * Roda uma vez após `site:install`, depois use `drush config:export` para
 * versionar tudo em config/sync.
 *
 * Uso:
 *   ddev drush scr scripts/bootstrap-content-model.php
 *   ddev drush config:export -y
 *
 * Decisão de design: o modelo é volumoso (≈ 25 campos somando os 3 tipos)
 * e cada campo gera ≥ 3 YAMLs no Drupal (storage, field, displays).
 * Manter isso 100% à mão é frágil; manter via código tipado é robusto e
 * sobrevive a refactors. Os YAMLs continuam sendo a fonte da verdade —
 * este script só é o "seed inicial" para gerá-los.
 */

declare(strict_types=1);

use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;

/**
 * Cria storage + field instance se ainda não existirem.
 *
 * @param array<string,mixed> $storage
 * @param array<string,mixed> $field
 */
function porto_criar_campo(array $storage, array $field): void {
  $storageId = "{$storage['entity_type']}.{$storage['field_name']}";
  if (!FieldStorageConfig::load($storageId)) {
    FieldStorageConfig::create($storage)->save();
  }
  $fieldId = "{$field['entity_type']}.{$field['bundle']}.{$field['field_name']}";
  if (!FieldConfig::load($fieldId)) {
    FieldConfig::create($field)->save();
  }
}

// =====================================================================
// LOTE — campos restantes
// =====================================================================
foreach ([
  ['storage' => ['field_name' => 'field_quadra',   'entity_type' => 'node', 'type' => 'string',  'cardinality' => 1, 'settings' => ['max_length' => 16]],
   'field'   => ['bundle' => 'lote', 'label' => 'Quadra',  'required' => true]],
  ['storage' => ['field_name' => 'field_numero',   'entity_type' => 'node', 'type' => 'integer', 'cardinality' => 1, 'settings' => []],
   'field'   => ['bundle' => 'lote', 'label' => 'Número do lote', 'required' => true]],
  ['storage' => ['field_name' => 'field_metragem', 'entity_type' => 'node', 'type' => 'decimal', 'cardinality' => 1, 'settings' => ['precision' => 10, 'scale' => 2]],
   'field'   => ['bundle' => 'lote', 'label' => 'Metragem (m²)', 'required' => true]],
  ['storage' => ['field_name' => 'field_descricao','entity_type' => 'node', 'type' => 'text_long','cardinality' => 1, 'settings' => []],
   'field'   => ['bundle' => 'lote', 'label' => 'Descrição', 'required' => false]],
] as $spec) {
  porto_criar_campo(
    $spec['storage'],
    $spec['field'] + ['field_name' => $spec['storage']['field_name'], 'entity_type' => 'node']
  );
}

// =====================================================================
// CONTRATO
// =====================================================================
foreach ([
  ['storage' => ['field_name' => 'field_cliente',         'entity_type' => 'node', 'type' => 'entity_reference', 'cardinality' => 1,
                 'settings' => ['target_type' => 'user']],
   'field'   => ['bundle' => 'contrato', 'label' => 'Cliente', 'required' => true,
                 'settings' => ['handler' => 'default:user']]],
  ['storage' => ['field_name' => 'field_lote',            'entity_type' => 'node', 'type' => 'entity_reference', 'cardinality' => 1,
                 'settings' => ['target_type' => 'node']],
   'field'   => ['bundle' => 'contrato', 'label' => 'Lote', 'required' => true,
                 'settings' => ['handler' => 'default:node', 'handler_settings' => ['target_bundles' => ['lote' => 'lote']]]]],
  ['storage' => ['field_name' => 'field_valor_total',     'entity_type' => 'node', 'type' => 'decimal', 'cardinality' => 1,
                 'settings' => ['precision' => 12, 'scale' => 2]],
   'field'   => ['bundle' => 'contrato', 'label' => 'Valor total (R$)', 'required' => true]],
  ['storage' => ['field_name' => 'field_data_assinatura', 'entity_type' => 'node', 'type' => 'datetime', 'cardinality' => 1,
                 'settings' => ['datetime_type' => 'date']],
   'field'   => ['bundle' => 'contrato', 'label' => 'Data de assinatura', 'required' => true]],
  ['storage' => ['field_name' => 'field_status_contrato', 'entity_type' => 'node', 'type' => 'list_string', 'cardinality' => 1,
                 'settings' => ['allowed_values' => [
                   ['value' => 'ativo',         'label' => 'Ativo'],
                   ['value' => 'quitado',       'label' => 'Quitado'],
                   ['value' => 'inadimplente',  'label' => 'Inadimplente'],
                   ['value' => 'cancelado',     'label' => 'Cancelado'],
                 ]]],
   'field'   => ['bundle' => 'contrato', 'label' => 'Status', 'required' => true, 'default_value' => [['value' => 'ativo']]]],
  ['storage' => ['field_name' => 'field_arquivo_contrato','entity_type' => 'node', 'type' => 'file', 'cardinality' => 1,
                 'settings' => ['uri_scheme' => 'private', 'file_extensions' => 'pdf doc docx']],
   'field'   => ['bundle' => 'contrato', 'label' => 'Arquivo do contrato', 'required' => false,
                 'settings' => ['file_directory' => 'contratos/[date:custom:Y]/[date:custom:m]']]],
] as $spec) {
  porto_criar_campo(
    $spec['storage'],
    $spec['field'] + ['field_name' => $spec['storage']['field_name'], 'entity_type' => 'node']
  );
}

// =====================================================================
// PARCELA
// =====================================================================
foreach ([
  ['storage' => ['field_name' => 'field_contrato',         'entity_type' => 'node', 'type' => 'entity_reference', 'cardinality' => 1,
                 'settings' => ['target_type' => 'node']],
   'field'   => ['bundle' => 'parcela', 'label' => 'Contrato', 'required' => true,
                 'settings' => ['handler' => 'default:node', 'handler_settings' => ['target_bundles' => ['contrato' => 'contrato']]]]],
  // Denormalizado para Contextual Filter mais simples na View "Minhas Parcelas".
  ['storage' => ['field_name' => 'field_cliente_parcela',  'entity_type' => 'node', 'type' => 'entity_reference', 'cardinality' => 1,
                 'settings' => ['target_type' => 'user']],
   'field'   => ['bundle' => 'parcela', 'label' => 'Cliente', 'required' => true,
                 'settings' => ['handler' => 'default:user']]],
  ['storage' => ['field_name' => 'field_numero_parcela',   'entity_type' => 'node', 'type' => 'integer', 'cardinality' => 1, 'settings' => []],
   'field'   => ['bundle' => 'parcela', 'label' => 'Nº da parcela', 'required' => true]],
  ['storage' => ['field_name' => 'field_valor_parcela',    'entity_type' => 'node', 'type' => 'decimal', 'cardinality' => 1,
                 'settings' => ['precision' => 12, 'scale' => 2]],
   'field'   => ['bundle' => 'parcela', 'label' => 'Valor (R$)', 'required' => true]],
  ['storage' => ['field_name' => 'field_vencimento',       'entity_type' => 'node', 'type' => 'datetime', 'cardinality' => 1,
                 'settings' => ['datetime_type' => 'date']],
   'field'   => ['bundle' => 'parcela', 'label' => 'Vencimento', 'required' => true]],
  ['storage' => ['field_name' => 'field_pago',             'entity_type' => 'node', 'type' => 'boolean', 'cardinality' => 1, 'settings' => []],
   'field'   => ['bundle' => 'parcela', 'label' => 'Paga?', 'required' => false, 'default_value' => [['value' => 0]]]],
  ['storage' => ['field_name' => 'field_data_pagamento',   'entity_type' => 'node', 'type' => 'datetime', 'cardinality' => 1,
                 'settings' => ['datetime_type' => 'date']],
   'field'   => ['bundle' => 'parcela', 'label' => 'Data de pagamento', 'required' => false]],
  ['storage' => ['field_name' => 'field_codigo_externo',   'entity_type' => 'node', 'type' => 'string', 'cardinality' => 1,
                 'settings' => ['max_length' => 64]],
   'field'   => ['bundle' => 'parcela', 'label' => 'Código no banco', 'required' => false]],
  ['storage' => ['field_name' => 'field_boleto_pdf',       'entity_type' => 'node', 'type' => 'file', 'cardinality' => 1,
                 'settings' => ['uri_scheme' => 'private', 'file_extensions' => 'pdf']],
   'field'   => ['bundle' => 'parcela', 'label' => 'Boleto (PDF)', 'required' => false,
                 'settings' => ['file_directory' => 'boletos/[date:custom:Y]/[date:custom:m]']]],
] as $spec) {
  porto_criar_campo(
    $spec['storage'],
    $spec['field'] + ['field_name' => $spec['storage']['field_name'], 'entity_type' => 'node']
  );
}

echo "Campos criados. Agora rode: drush config:export -y\n";
