<?php

declare(strict_types=1);

namespace Drupal\porto_banking\Controller;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Session\AccountInterface;
use Drupal\entity_print\PrintBuilderInterface;
use Drupal\entity_print\Plugin\EntityPrintPluginManagerInterface;
use Drupal\node\NodeInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gera o PDF do boleto de uma parcela e devolve como download autenticado.
 *
 * Defesa em camadas:
 *  - Rota exige _entity_access: 'node.view' (gerenciado pelo Drupal access system)
 *  - Bundle precisa ser 'parcela' (rejeitamos qualquer outro tipo)
 *  - Verificação adicional: field_cliente == current user (mesmo se o
 *    access system permitir, garantimos que ninguém vê boleto alheio)
 *
 * O PDF é renderizado via entity_print (módulo contrib), que internamente
 * usa o engine configurado em /admin/config/content/entityprint (default:
 * Dompdf — suficiente para boletos simples). Em produção, podemos trocar
 * para WkHtmlToPdf via porto-banking-pdf-engine para layout mais fiel.
 */
final class BoletoPdfController extends ControllerBase {

  public function __construct(
    private readonly PrintBuilderInterface $printBuilder,
    private readonly EntityPrintPluginManagerInterface $pluginManager,
  ) {}

  public static function create(ContainerInterface $container): self {
    return new self(
      $container->get('entity_print.print_builder'),
      $container->get('plugin.manager.entity_print.print_engine'),
    );
  }

  public function baixar(NodeInterface $node, AccountInterface $account): Response {
    if ($node->bundle() !== 'parcela') {
      throw $this->createNotFoundException();
    }

    // Defesa explícita contra IDOR — não confia só no access system.
    $clienteRef = $node->hasField('field_cliente') ? $node->get('field_cliente')->target_id : NULL;
    if ((int) $clienteRef !== (int) $account->id() && !$account->hasPermission('administer nodes')) {
      throw $this->createAccessDeniedException('Parcela pertence a outro cliente.');
    }

    /** @var \Drupal\entity_print\Plugin\PrintEngineInterface $engine */
    $engine = $this->pluginManager->createSelectedInstance('pdf');

    $titulo = sprintf(
      'boleto-parcela-%s-%s',
      $node->get('field_numero')->value ?? '0',
      $node->id(),
    );

    // Streaming direto — não grava no disco. O entity_print monta o
    // PDF a partir do view mode "pdf" do bundle (configurável no admin).
    return $this->printBuilder->deliverPrintable([$node], $engine, FALSE, $titulo);
  }

}
