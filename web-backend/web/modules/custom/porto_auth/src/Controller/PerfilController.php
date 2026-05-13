<?php

declare(strict_types=1);

namespace Drupal\porto_auth\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Endpoint GET /api/minhas-roles — retorna as roles do usuário autenticado.
 *
 * Usado pelo Next.js logo após o sign-in para guardar as roles no token JWT
 * e controlar acesso à área admin.
 */
final class PerfilController extends ControllerBase {

  public function minhasRoles(): JsonResponse {
    // TRUE = exclui 'authenticated' e 'anonymous' (só roles customizadas).
    $roles = array_values($this->currentUser()->getRoles(TRUE));
    return new JsonResponse([
      'uid'   => (int) $this->currentUser()->id(),
      'roles' => $roles,
    ]);
  }

}
