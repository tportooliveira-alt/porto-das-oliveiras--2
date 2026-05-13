<?php

declare(strict_types=1);

namespace Drupal\porto_banking\Service;

use Drupal\Component\Datetime\TimeInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\State\StateInterface;
use Drupal\key\KeyRepositoryInterface;
use Drupal\porto_banking\Exception\BankingApiException;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;

/**
 * Cliente HTTP para a API bancária externa.
 *
 * Credenciais via módulo Key, token cacheado em State, timeouts curtos
 * e exceção específica para que o orquestrador decida retry/fila.
 */
final class BankingApiClient {

  private const STATE_TOKEN_KEY = 'porto_banking.access_token';
  private const STATE_TOKEN_EXP = 'porto_banking.access_token_exp';

  private LoggerChannelInterface $logger;
  private string $baseUri;
  private string $keyId;

  public function __construct(
    private readonly ClientInterface $httpClient,
    private readonly KeyRepositoryInterface $keyRepository,
    private readonly ConfigFactoryInterface $configFactory,
    LoggerChannelFactoryInterface $loggerFactory,
    private readonly TimeInterface $time,
    private readonly StateInterface $state,
  ) {
    $this->logger = $loggerFactory->get('porto_banking');
    $config = $configFactory->get('porto_banking.settings');
    $this->baseUri = rtrim((string) $config->get('base_uri'), '/');
    $this->keyId   = (string) $config->get('credentials_key_id');
  }

  /**
   * @return array<int,array<string,mixed>>
   */
  public function listarBoletosPagos(\DateTimeImmutable $de, \DateTimeImmutable $ate): array {
    try {
      $response = $this->httpClient->request('GET', $this->baseUri . '/v1/boletos/pagos', [
        'headers' => $this->cabecalhosAutenticados(),
        'query'   => [
          'data_inicio' => $de->format('Y-m-d'),
          'data_fim'    => $ate->format('Y-m-d'),
        ],
        'timeout'         => 10,
        'connect_timeout' => 5,
      ]);

      $payload = json_decode((string) $response->getBody(), TRUE, 512, JSON_THROW_ON_ERROR);
      return is_array($payload) ? ($payload['data'] ?? []) : [];
    }
    catch (RequestException $e) {
      $this->logger->error('Falha HTTP @code consultando boletos: @msg', [
        '@code' => $e->getCode(),
        '@msg'  => $e->getMessage(),
      ]);
      throw new BankingApiException('Erro na API bancária', 0, $e);
    }
    catch (GuzzleException | \JsonException $e) {
      $this->logger->error('Erro inesperado na integração: @msg', ['@msg' => $e->getMessage()]);
      throw new BankingApiException('Resposta inválida', 0, $e);
    }
  }

  /**
   * @return array<string,string>
   */
  private function cabecalhosAutenticados(): array {
    return [
      'Authorization' => 'Bearer ' . $this->obterAccessToken(),
      'Accept'        => 'application/json',
      'User-Agent'    => 'PortoDasOliveiras/1.0 (+drupal)',
    ];
  }

  private function obterAccessToken(): string {
    $token = $this->state->get(self::STATE_TOKEN_KEY);
    $exp   = (int) $this->state->get(self::STATE_TOKEN_EXP, 0);

    if ($token && $exp > ($this->time->getRequestTime() + 60)) {
      return $token;
    }

    $key = $this->keyRepository->getKey($this->keyId);
    if (!$key) {
      throw new BankingApiException(sprintf('Key "%s" não encontrada.', $this->keyId));
    }
    $credenciais = $key->getKeyValues();

    try {
      $response = $this->httpClient->request('POST', $this->baseUri . '/oauth/token', [
        'form_params' => [
          'grant_type'    => 'client_credentials',
          'client_id'     => $credenciais['client_id'] ?? '',
          'client_secret' => $credenciais['client_secret'] ?? '',
          'scope'         => 'boletos.read extrato.read',
        ],
        'timeout'         => 10,
        'connect_timeout' => 5,
      ]);

      $payload = json_decode((string) $response->getBody(), TRUE, 512, JSON_THROW_ON_ERROR);
      if (!is_array($payload)) {
        throw new BankingApiException('Resposta OAuth não é um objeto JSON.');
      }
      $novoToken    = (string) ($payload['access_token'] ?? '');
      $tempoVidaSeg = (int)    ($payload['expires_in']   ?? 300);

      $this->state->setMultiple([
        self::STATE_TOKEN_KEY => $novoToken,
        self::STATE_TOKEN_EXP => $this->time->getRequestTime() + $tempoVidaSeg,
      ]);

      return $novoToken;
    }
    catch (GuzzleException | \JsonException $e) {
      throw new BankingApiException('Falha ao obter token OAuth', 0, $e);
    }
  }

}
