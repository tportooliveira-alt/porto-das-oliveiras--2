<?php

declare(strict_types=1);

namespace Drupal\porto_analytics\Service;

use Drupal\Component\Datetime\TimeInterface;
use Drupal\Core\Database\Connection;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Logger\LoggerChannelInterface;

/**
 * Registra eventos do site na tabela porto_eventos.
 *
 * Decisões de privacidade:
 *  - Não armazenamos IP cru. Armazenamos SHA-256(ip + salt_diário).
 *    O salt rotaciona diariamente, então mesmo o backend não consegue
 *    correlacionar um mesmo IP entre dias diferentes.
 *  - User-Agent é truncado em 200 chars (fingerprinting é mais fraco).
 *  - Sem cookies de tracking — só eventos disparados explicitamente.
 */
final class RegistradorEventos {

  private const TIPOS_VALIDOS = [
    'lote_visualizado',
    'lote_listado',
    'whatsapp_clicado',
    'busca_executada',
    'login_iniciado',
    'login_concluido',
    'parcela_baixada',
    'contrato_visualizado',
  ];

  private LoggerChannelInterface $logger;

  public function __construct(
    private readonly Connection $db,
    private readonly TimeInterface $time,
    LoggerChannelFactoryInterface $loggerFactory,
  ) {
    $this->logger = $loggerFactory->get('porto_analytics');
  }

  /**
   * @param array<string,mixed> $meta
   */
  public function registrar(
    string $tipo,
    ?string $loteId,
    int $uid,
    ?string $ip,
    ?string $userAgent,
    ?string $referrer,
    array $meta = [],
  ): bool {
    if (!in_array($tipo, self::TIPOS_VALIDOS, TRUE)) {
      $this->logger->warning('Tipo de evento desconhecido: @tipo', ['@tipo' => $tipo]);
      return FALSE;
    }

    try {
      $this->db->insert('porto_eventos')
        ->fields([
          'tipo'       => $tipo,
          'lote_id'    => $loteId,
          'uid'        => $uid,
          'ip_hash'    => $ip ? $this->hashIp($ip) : NULL,
          'user_agent' => $userAgent ? mb_substr($userAgent, 0, 200) : NULL,
          'referrer'   => $referrer ? mb_substr($referrer, 0, 500) : NULL,
          'meta_json'  => $meta ? json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : NULL,
          'criado_em'  => $this->time->getRequestTime(),
        ])
        ->execute();
      return TRUE;
    }
    catch (\Throwable $e) {
      $this->logger->error('Falha ao registrar evento @tipo: @msg', [
        '@tipo' => $tipo,
        '@msg'  => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * Hash do IP com salt diário. Permite contar visitantes únicos por dia
   * sem armazenar IP — passou o dia, não dá mais pra correlacionar.
   */
  private function hashIp(string $ip): string {
    $salt = 'porto-analytics-' . date('Y-m-d', $this->time->getRequestTime());
    return hash('sha256', $ip . '|' . $salt);
  }

  /**
   * @return array{tipo: string, total: int}[]
   */
  public function contarPorTipo(int $desdeUnix): array {
    $stmt = $this->db->select('porto_eventos', 'e')
      ->fields('e', ['tipo'])
      ->condition('criado_em', $desdeUnix, '>=')
      ->groupBy('tipo');
    $stmt->addExpression('COUNT(*)', 'total');
    $rows = $stmt->execute()->fetchAll();

    return array_map(static fn($r) => [
      'tipo'  => (string) $r->tipo,
      'total' => (int) $r->total,
    ], $rows);
  }

  /**
   * @return array{lote_id: string, total: int}[]
   */
  public function lotesMaisVisualizados(int $desdeUnix, int $limite = 10): array {
    $stmt = $this->db->select('porto_eventos', 'e')
      ->fields('e', ['lote_id'])
      ->condition('tipo', 'lote_visualizado')
      ->condition('lote_id', NULL, 'IS NOT NULL')
      ->condition('criado_em', $desdeUnix, '>=')
      ->groupBy('lote_id')
      ->range(0, $limite);
    $stmt->addExpression('COUNT(*)', 'total');
    $stmt->orderBy('total', 'DESC');
    $rows = $stmt->execute()->fetchAll();

    return array_map(static fn($r) => [
      'lote_id' => (string) $r->lote_id,
      'total'   => (int) $r->total,
    ], $rows);
  }

}
