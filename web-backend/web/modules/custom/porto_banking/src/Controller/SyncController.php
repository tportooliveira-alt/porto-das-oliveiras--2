<?php

declare(strict_types=1);

namespace Drupal\porto_banking\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\DependencyInjection\ContainerInjectionInterface;
use Drupal\porto_banking\Service\BoletoSyncService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Endpoint administrativo para disparar a sincronização bancária.
 *
 * Protegido por permissão "sync banking api" (ver porto_banking.routing.yml).
 */
final class SyncController extends ControllerBase implements ContainerInjectionInterface {

  public function __construct(private readonly BoletoSyncService $sync) {}

  public static function create(ContainerInterface $container): self {
    return new self($container->get('porto_banking.sync'));
  }

  public function executar(): array {
    $total = $this->sync->sincronizarUltimoDia();

    return [
      '#markup' => $this->t('Sincronização concluída: @n parcelas atualizadas.', ['@n' => $total]),
    ];
  }

}
