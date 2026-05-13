<?php

declare(strict_types=1);

namespace Drupal\porto_analytics\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\porto_analytics\Service\RegistradorEventos;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Endpoint POST /api/track — recebe um evento JSON e grava na tabela.
 *
 * Payload esperado:
 * {
 *   "tipo": "lote_visualizado",
 *   "lote_id": "uuid-opcional",
 *   "meta": { campos arbitrários }
 * }
 *
 * Rate limit é responsabilidade do middleware do Next.js que faz proxy.
 * Aqui validamos só formato e tipo conhecido.
 */
final class TrackController extends ControllerBase {

  public function __construct(
    private readonly RegistradorEventos $registrador,
  ) {}

  public static function create(ContainerInterface $container): self {
    return new self($container->get('porto_analytics.registrador'));
  }

  public function registrar(Request $request): JsonResponse {
    $payload = json_decode((string) $request->getContent(), TRUE);
    if (!is_array($payload)) {
      return new JsonResponse(['erro' => 'JSON inválido'], Response::HTTP_BAD_REQUEST);
    }

    $tipo = (string) ($payload['tipo'] ?? '');
    if ($tipo === '') {
      return new JsonResponse(['erro' => 'Campo "tipo" obrigatório'], Response::HTTP_BAD_REQUEST);
    }

    $loteId = isset($payload['lote_id']) ? (string) $payload['lote_id'] : NULL;
    $meta   = is_array($payload['meta'] ?? NULL) ? $payload['meta'] : [];

    $ok = $this->registrador->registrar(
      $tipo,
      $loteId,
      (int) $this->currentUser()->id(),
      $request->getClientIp(),
      $request->headers->get('User-Agent'),
      $request->headers->get('Referer'),
      $meta,
    );

    return new JsonResponse(
      ['registrado' => $ok],
      $ok ? Response::HTTP_ACCEPTED : Response::HTTP_BAD_REQUEST,
    );
  }

}
