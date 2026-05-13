/**
 * Testa a lógica pura de parcelas (statusDaParcela + resumoFinanceiro).
 *
 * Roda sem Drupal, sem rede — copia os mesmos algoritmos do
 * web-frontend/lib/drupal/parcelas.ts e valida casos críticos.
 *
 * Se a lógica do TypeScript mudar, esse arquivo precisa ser atualizado
 * em paralelo. O CI executa esse script em todo PR.
 */

import assert from 'node:assert/strict';

// ─────────────── implementação espelhada do parcelas.ts ───────────────

function toIsoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function statusDaParcela(p, hoje = new Date()) {
  if (p.pago) return 'paga';
  const vencISO = toIsoDate(p.vencimento);
  const hojeISO = toIsoDate(hoje);
  return vencISO < hojeISO ? 'vencida' : 'aberta';
}

function resumoFinanceiro(parcelas, hoje = new Date()) {
  let totalPago = 0, totalAberto = 0, totalVencido = 0;
  let proximaParcela;
  for (const p of parcelas) {
    const status = statusDaParcela(p, hoje);
    if (status === 'paga')        totalPago    += p.valor;
    else if (status === 'aberta') totalAberto  += p.valor;
    else                          totalVencido += p.valor;
    if (status !== 'paga') {
      const venc = new Date(p.vencimento);
      if (!proximaParcela || venc < new Date(proximaParcela.vencimento)) {
        proximaParcela = p;
      }
    }
  }
  const total = totalPago + totalAberto + totalVencido;
  return {
    totalParcelas: parcelas.length,
    totalPago, totalAberto, totalVencido,
    proximaParcela,
    percentualPago: total > 0 ? Math.round((totalPago / total) * 100) : 0,
  };
}

// ─────────────── fixtures ───────────────

const hoje = new Date('2026-05-13T12:00:00Z');

const PAGA = {
  id: '1', numero: 1, valor: 1000, vencimento: '2026-04-10', pago: true, dataPagamento: '2026-04-08',
};
const ABERTA_FUTURA = {
  id: '2', numero: 2, valor: 1000, vencimento: '2026-06-10', pago: false,
};
const VENCIDA = {
  id: '3', numero: 3, valor: 1000, vencimento: '2026-05-01', pago: false,
};
const VENCE_HOJE = {
  id: '4', numero: 4, valor: 1000, vencimento: '2026-05-13', pago: false,
};

let okCount = 0;
function t(label, fn) {
  try {
    fn();
    console.log(`  OK   ${label}`);
    okCount++;
  } catch (e) {
    console.log(`  FAIL ${label}`);
    console.error(`         ${e.message}`);
    process.exitCode = 1;
  }
}

// ─────────────── statusDaParcela ───────────────

t('parcela paga retorna "paga"', () => {
  assert.equal(statusDaParcela(PAGA, hoje), 'paga');
});

t('parcela com vencimento futuro retorna "aberta"', () => {
  assert.equal(statusDaParcela(ABERTA_FUTURA, hoje), 'aberta');
});

t('parcela não paga com vencimento passado retorna "vencida"', () => {
  assert.equal(statusDaParcela(VENCIDA, hoje), 'vencida');
});

t('parcela que vence hoje (não paga) ainda é "aberta"', () => {
  // Convenção: até as 23h59 do dia do vencimento ainda dá pra pagar
  assert.equal(statusDaParcela(VENCE_HOJE, hoje), 'aberta');
});

t('parcela paga ignora vencimento (mesmo passado)', () => {
  const pagaAtrasada = { ...PAGA, vencimento: '2020-01-01' };
  assert.equal(statusDaParcela(pagaAtrasada, hoje), 'paga');
});

// ─────────────── resumoFinanceiro ───────────────

t('resumo de lista vazia tem percentualPago=0 e sem próxima parcela', () => {
  const r = resumoFinanceiro([], hoje);
  assert.equal(r.totalParcelas, 0);
  assert.equal(r.totalPago, 0);
  assert.equal(r.totalAberto, 0);
  assert.equal(r.totalVencido, 0);
  assert.equal(r.proximaParcela, undefined);
  assert.equal(r.percentualPago, 0);
});

t('resumo soma valores corretamente por categoria', () => {
  const r = resumoFinanceiro([PAGA, ABERTA_FUTURA, VENCIDA], hoje);
  assert.equal(r.totalPago, 1000);
  assert.equal(r.totalAberto, 1000);
  assert.equal(r.totalVencido, 1000);
  assert.equal(r.totalParcelas, 3);
});

t('percentualPago é arredondado corretamente', () => {
  // 1 paga + 2 não pagas = 1/3 = 33.33...% → 33%
  const r = resumoFinanceiro([PAGA, ABERTA_FUTURA, VENCIDA], hoje);
  assert.equal(r.percentualPago, 33);
});

t('100% pago quando todas as parcelas estão pagas', () => {
  const r = resumoFinanceiro([PAGA, { ...PAGA, id: '5' }], hoje);
  assert.equal(r.percentualPago, 100);
});

t('proximaParcela é a vencida mais antiga quando há vencidas + abertas', () => {
  const r = resumoFinanceiro([PAGA, ABERTA_FUTURA, VENCIDA], hoje);
  assert.equal(r.proximaParcela.id, VENCIDA.id);
});

t('proximaParcela é a aberta mais próxima quando não há vencidas', () => {
  const futura1 = { ...ABERTA_FUTURA, id: '6', vencimento: '2026-07-10' };
  const futura2 = { ...ABERTA_FUTURA, id: '7', vencimento: '2026-06-10' };
  const r = resumoFinanceiro([PAGA, futura1, futura2], hoje);
  assert.equal(r.proximaParcela.id, '7');
});

t('proximaParcela é undefined quando tudo está pago', () => {
  const r = resumoFinanceiro([PAGA, { ...PAGA, id: '8' }], hoje);
  assert.equal(r.proximaParcela, undefined);
});

console.log(`\nResumo: ${okCount} testes passaram${process.exitCode === 1 ? ' (alguns falharam)' : ''}`);
