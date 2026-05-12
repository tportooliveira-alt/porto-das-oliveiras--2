<?php

declare(strict_types=1);

namespace Drupal\porto_banking\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\porto_banking\Exception\BankingApiException;

/**
 * Orquestra a sincronização de boletos pagos com o Drupal.
 *
 * Stub inicial — a implementação completa enfileira cada pagamento em
 * `advancedqueue` com retries e idempotência via field_codigo_externo.
 */
final class BoletoSyncService {

  private LoggerChannelInterface $logger;

  public function __construct(
    private readonly BankingApiClient $client,
    private readonly EntityTypeManagerInterface $entityTypeManager,
    LoggerChannelFactoryInterface $loggerFactory,
  ) {
    $this->logger = $loggerFactory->get('porto_banking');
  }

  /**
   * Importa pagamentos das últimas 24h.
   *
   * @return int Quantidade de parcelas atualizadas.
   */
  public function sincronizarUltimoDia(): int {
    $ate = new \DateTimeImmutable('now');
    $de  = $ate->modify('-1 day');

    try {
      $pagamentos = $this->client->listarBoletosPagos($de, $ate);
    }
    catch (BankingApiException $e) {
      $this->logger->error('Sync abortada: @msg', ['@msg' => $e->getMessage()]);
      return 0;
    }

    $atualizadas = 0;
    foreach ($pagamentos as $pagamento) {
      if ($this->aplicarPagamento($pagamento)) {
        $atualizadas++;
      }
    }

    $this->logger->info('Sync concluída — @n parcelas atualizadas.', ['@n' => $atualizadas]);
    return $atualizadas;
  }

  /**
   * @param array<string,mixed> $pagamento
   */
  private function aplicarPagamento(array $pagamento): bool {
    $codigo = (string) ($pagamento['codigo_externo'] ?? '');
    if ($codigo === '') {
      return FALSE;
    }

    $storage = $this->entityTypeManager->getStorage('node');
    $parcelas = $storage->loadByProperties([
      'type' => 'parcela',
      'field_codigo_externo' => $codigo,
    ]);
    /** @var \Drupal\node\NodeInterface|null $parcela */
    $parcela = $parcelas ? reset($parcelas) : NULL;
    if (!$parcela) {
      return FALSE;
    }

    if ($parcela->get('field_pago')->value) {
      return FALSE; // Idempotência — já marcada como paga.
    }

    $parcela->set('field_pago', TRUE);
    $parcela->set('field_data_pagamento', $pagamento['data_pagamento'] ?? date('Y-m-d'));
    $parcela->save();
    return TRUE;
  }

}
