<?php

declare(strict_types=1);

namespace Drupal\porto_analytics\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\porto_analytics\Service\RegistradorEventos;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Endpoints admin de analytics e KPIs.
 *
 * Restrição de acesso: verificamos programaticamente se o usuário tem
 * role vendedor, financeiro ou administrator — mais flexível do que
 * declarar _role no routing, que exige configuração de permissão extra.
 */
final class AdminAnalyticsController extends ControllerBase {

  private const ROLES_PERMITIDAS = ['vendedor', 'financeiro', 'administrator'];

  public function __construct(
    private readonly RegistradorEventos $registrador,
    private readonly Connection $db,
  ) {}

  public static function create(ContainerInterface $container): self {
    return new self(
      $container->get('porto_analytics.registrador'),
      $container->get('database'),
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private function temAcesso(): bool {
    $roles = $this->currentUser()->getRoles();
    return (bool) array_intersect(self::ROLES_PERMITIDAS, $roles);
  }

  private function negado(): JsonResponse {
    return new JsonResponse(['erro' => 'Acesso negado'], Response::HTTP_FORBIDDEN);
  }

  // ── GET /api/admin/analytics ───────────────────────────────────────────

  /**
   * Retorna eventos por tipo e top lotes visualizados.
   *
   * Query params:
   *  - dias: int (padrão 30) — janela de análise em dias corridos
   */
  public function analytics(Request $request): JsonResponse {
    if (!$this->temAcesso()) return $this->negado();

    $dias   = max(1, min(365, (int) ($request->query->get('dias', 30))));
    $desde  = strtotime("-{$dias} days");

    return new JsonResponse([
      'por_tipo'     => $this->registrador->contarPorTipo($desde),
      'top_lotes'    => $this->registrador->lotesMaisVisualizados($desde, 10),
      'periodo_dias' => $dias,
    ]);
  }

  // ── GET /api/admin/kpis ────────────────────────────────────────────────

  /**
   * Retorna KPIs financeiros: parcelas pagas/aberto/vencidas e contratos por status.
   */
  public function kpis(): JsonResponse {
    if (!$this->temAcesso()) return $this->negado();

    return new JsonResponse([
      'parcelas'  => $this->kpisParcelas(),
      'contratos' => $this->kpisContratos(),
    ]);
  }

  /** @return array<string, mixed> */
  private function kpisParcelas(): array {
    // Agrupa parcelas por campo field_pago (0 ou 1) e soma valores.
    $stmt = $this->db->select('node__field_pago', 'p');
    $stmt->fields('p', ['field_pago_value']);
    $stmt->addExpression('COUNT(*)', 'total');
    $stmt->addExpression('COALESCE(SUM(v.field_valor_value), 0)', 'soma');
    $stmt->leftJoin(
      'node__field_valor',
      'v',
      'p.entity_id = v.entity_id AND p.bundle = v.bundle',
    );
    $stmt->condition('p.bundle', 'parcela');
    $stmt->groupBy('p.field_pago_value');
    $rows = $stmt->execute()->fetchAll();

    $pagas        = 0;  $valorPago    = 0.0;
    $abertas      = 0;  $valorAberto  = 0.0;

    foreach ($rows as $row) {
      if ((bool) $row->field_pago_value) {
        $pagas     = (int) $row->total;
        $valorPago = (float) $row->soma;
      }
      else {
        $abertas      = (int) $row->total;
        $valorAberto  = (float) $row->soma;
      }
    }

    // Parcelas vencidas = não pagas cujo vencimento já passou.
    $hoje    = date('Y-m-d');
    $vStmt   = $this->db->select('node__field_pago', 'p');
    $vStmt->leftJoin('node__field_vencimento', 'venc', 'p.entity_id = venc.entity_id AND p.bundle = venc.bundle');
    $vStmt->leftJoin('node__field_valor',      'val',  'p.entity_id = val.entity_id  AND p.bundle = val.bundle');
    $vStmt->condition('p.bundle', 'parcela');
    $vStmt->condition('p.field_pago_value', 0);
    $vStmt->condition('venc.field_vencimento_value', $hoje, '<');
    $vStmt->addExpression('COUNT(*)',                            'total');
    $vStmt->addExpression('COALESCE(SUM(val.field_valor_value), 0)', 'soma');
    $vRow = $vStmt->execute()->fetchObject();

    $vencidas    = (int)   ($vRow->total ?? 0);
    $valorVencido = (float) ($vRow->soma  ?? 0);

    return [
      'pagas'         => $pagas,
      'abertas'       => $abertas - $vencidas,  // aberto mas não vencido
      'vencidas'      => $vencidas,
      'valor_pago'    => round($valorPago,    2),
      'valor_aberto'  => round($valorAberto  - $valorVencido, 2),
      'valor_vencido' => round($valorVencido, 2),
    ];
  }

  /** @return array<string, int> */
  private function kpisContratos(): array {
    $stmt = $this->db->select('node__field_status_contrato', 'sc');
    $stmt->fields('sc', ['field_status_contrato_value']);
    $stmt->addExpression('COUNT(*)', 'total');
    $stmt->condition('sc.bundle', 'contrato');
    $stmt->groupBy('sc.field_status_contrato_value');
    $rows = $stmt->execute()->fetchAll();

    $resultado = [];
    foreach ($rows as $row) {
      $resultado[(string) $row->field_status_contrato_value] = (int) $row->total;
    }
    return $resultado;
  }

}
