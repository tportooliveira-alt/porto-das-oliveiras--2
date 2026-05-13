<?php

declare(strict_types=1);

namespace Drupal\porto_notifications\Service;

use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\Mail\MailManagerInterface;
use Drupal\node\NodeInterface;

/**
 * Despacha notificações transacionais (email) usando o sistema de mail
 * do Drupal — Mailpit em dev (DDEV), SMTP/SendGrid em produção.
 *
 * Templates ficam em templates/email-*.html.twig.
 * Hooks (hook_mail) ficam em porto_notifications.module.
 */
final class Mailer {

  private LoggerChannelInterface $logger;

  public function __construct(
    private readonly MailManagerInterface $mailManager,
    private readonly LanguageManagerInterface $languageManager,
    LoggerChannelFactoryInterface $loggerFactory,
    private readonly ModuleHandlerInterface $moduleHandler,
  ) {
    $this->logger = $loggerFactory->get('porto_notifications');
  }

  /**
   * Notifica o cliente que sua parcela está próxima do vencimento.
   *
   * Disparado por cron diário (ver porto_notifications.module).
   */
  public function parcelaVencendo(NodeInterface $parcela, int $diasAtePrazo): bool {
    $cliente = $parcela->get('field_cliente')->entity;
    if (!$cliente || !$cliente->getEmail()) return FALSE;

    return $this->enviar('parcela_vencendo', $cliente->getEmail(), [
      'parcela_numero'    => (int) $parcela->get('field_numero')->value,
      'parcela_valor'     => (float) $parcela->get('field_valor')->value,
      'parcela_venc'      => (string) $parcela->get('field_vencimento')->value,
      'parcela_nid'       => (int) $parcela->id(),
      'dias_ate_prazo'    => $diasAtePrazo,
      'cliente_nome'      => $cliente->getDisplayName(),
    ]);
  }

  /**
   * Notifica que uma parcela foi marcada como paga (após sync bancária).
   */
  public function parcelaPaga(NodeInterface $parcela): bool {
    $cliente = $parcela->get('field_cliente')->entity;
    if (!$cliente || !$cliente->getEmail()) return FALSE;

    return $this->enviar('parcela_paga', $cliente->getEmail(), [
      'parcela_numero'  => (int) $parcela->get('field_numero')->value,
      'parcela_valor'   => (float) $parcela->get('field_valor')->value,
      'data_pagamento'  => (string) $parcela->get('field_data_pagamento')->value,
      'cliente_nome'    => $cliente->getDisplayName(),
    ]);
  }

  /**
   * Notifica o cliente que seu contrato foi efetivado (status = ativo).
   */
  public function contratoAtivado(NodeInterface $contrato): bool {
    $cliente = $contrato->get('field_cliente')->entity;
    if (!$cliente || !$cliente->getEmail()) return FALSE;

    return $this->enviar('contrato_ativado', $cliente->getEmail(), [
      'contrato_titulo'   => $contrato->label(),
      'valor_total'       => (float) $contrato->get('field_valor_total')->value,
      'data_assinatura'   => (string) $contrato->get('field_data_assinatura')->value,
      'cliente_nome'      => $cliente->getDisplayName(),
    ]);
  }

  /**
   * @param array<string,mixed> $params
   */
  private function enviar(string $key, string $to, array $params): bool {
    $langcode = $this->languageManager->getCurrentLanguage()->getId();
    try {
      $resultado = $this->mailManager->mail(
        'porto_notifications',
        $key,
        $to,
        $langcode,
        $params,
        NULL,
        TRUE,
      );
      $ok = !empty($resultado['result']);
      $this->logger->info('Email @key para @to: @status', [
        '@key'    => $key,
        '@to'     => $to,
        '@status' => $ok ? 'enviado' : 'falhou',
      ]);
      return $ok;
    }
    catch (\Throwable $e) {
      $this->logger->error('Falha ao enviar email @key para @to: @msg', [
        '@key' => $key,
        '@to'  => $to,
        '@msg' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

}
