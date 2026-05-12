<?php

declare(strict_types=1);

namespace Drupal\porto_auth\Authentication;

use Drupal\Core\Authentication\AuthenticationProviderInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\key\KeyRepositoryInterface;
use Drupal\user\UserInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Component\HttpFoundation\Request;

/**
 * Provedor de autenticação baseado em JWT emitido pelo Next.js.
 *
 * Fluxo:
 *  1. Recebe header "Authorization: Bearer <jwt>".
 *  2. Valida assinatura HS256 contra o segredo armazenado no módulo Key.
 *  3. Extrai claim "email"; localiza o usuário Drupal correspondente.
 *  4. Se o usuário não existir, cria com role "authenticated" (cliente).
 *  5. Retorna a entidade User para o framework de auth do Drupal.
 *
 * NÃO substitui o login interno do Drupal — convive com cookie/session auth
 * para a área administrativa. A prioridade 100 garante que tentamos JWT
 * antes do cookie quando o header Bearer está presente.
 */
final class JwtBridgeAuthenticator implements AuthenticationProviderInterface {

  private const KEY_ID  = 'porto_frontend_jwt';
  private const ISSUER  = 'porto-frontend';
  private const AUD     = 'drupal';
  private const ROLE_CLIENTE = 'authenticated';

  private LoggerChannelInterface $logger;

  public function __construct(
    private readonly KeyRepositoryInterface $keyRepository,
    private readonly EntityTypeManagerInterface $entityTypeManager,
    LoggerChannelFactoryInterface $loggerFactory,
  ) {
    $this->logger = $loggerFactory->get('porto_auth');
  }

  public function applies(Request $request): bool {
    $auth = $request->headers->get('Authorization', '');
    return is_string($auth) && str_starts_with($auth, 'Bearer ');
  }

  public function authenticate(Request $request): ?UserInterface {
    $token = substr((string) $request->headers->get('Authorization'), 7);
    if ($token === '') {
      return NULL;
    }

    $segredo = $this->obterSegredo();
    if ($segredo === NULL) {
      $this->logger->error('Key "@id" não encontrada — auth JWT desativada.', ['@id' => self::KEY_ID]);
      return NULL;
    }

    try {
      $claims = JWT::decode($token, new Key($segredo, 'HS256'));
    }
    catch (\Throwable $e) {
      $this->logger->notice('JWT inválido: @msg', ['@msg' => $e->getMessage()]);
      return NULL;
    }

    if (($claims->iss ?? '') !== self::ISSUER || ($claims->aud ?? '') !== self::AUD) {
      return NULL;
    }

    $email = $claims->email ?? NULL;
    if (!is_string($email) || $email === '') {
      return NULL;
    }

    return $this->localizarOuCriarUsuario($email, (string) ($claims->name ?? $email));
  }

  private function obterSegredo(): ?string {
    $key = $this->keyRepository->getKey(self::KEY_ID);
    if (!$key) {
      return NULL;
    }
    $valor = $key->getKeyValue();
    return is_string($valor) && $valor !== '' ? $valor : NULL;
  }

  private function localizarOuCriarUsuario(string $email, string $nome): ?UserInterface {
    $storage = $this->entityTypeManager->getStorage('user');
    $existentes = $storage->loadByProperties(['mail' => $email]);
    /** @var \Drupal\user\UserInterface|null $usuario */
    $usuario = $existentes ? reset($existentes) : NULL;

    if ($usuario) {
      if (!$usuario->isActive()) {
        return NULL;
      }
      return $usuario;
    }

    $usuario = $storage->create([
      'name'   => $this->gerarUsernameUnico($email),
      'mail'   => $email,
      'pass'   => NULL, // sem senha — só entra via JWT/social
      'status' => 1,
      'init'   => $email,
      'roles'  => [self::ROLE_CLIENTE],
    ]);
    $usuario->set('field_display_name', $nome);
    $usuario->save();

    $this->logger->info('Usuário auto-provisionado via JWT: @mail', ['@mail' => $email]);
    return $usuario;
  }

  private function gerarUsernameUnico(string $email): string {
    $base = preg_replace('/[^a-z0-9._-]+/i', '.', strstr($email, '@', TRUE) ?: 'user');
    $candidato = $base;
    $i = 1;
    $storage = $this->entityTypeManager->getStorage('user');
    while ($storage->loadByProperties(['name' => $candidato])) {
      $candidato = $base . $i++;
    }
    return $candidato;
  }

}
