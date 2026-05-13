import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..').replace(/\\/g, '/');
const arquivos = execSync(`find -L "${root}/web-backend/web/modules/custom" -name "*.php"`, { encoding: 'utf8' })
  .split('\n').filter(Boolean);
arquivos.push(`${root}/web-backend/scripts/bootstrap-content-model.php`);

const problemas = [];
function log(ok, msg) {
  console.log(ok ? '  OK  ' : '  FAIL', msg);
  if (!ok) problemas.push(msg);
}

for (const arq of arquivos) {
  const rel = arq.replace(root + '/', '');
  const src = readFileSync(arq, 'utf8');

  // 1. Comeca com <?php
  if (!src.trimStart().startsWith('<?php')) {
    log(false, `${rel}: nao comeca com <?php`);
    continue;
  }

  // 2. declare(strict_types=1) presente
  if (!/declare\s*\(\s*strict_types\s*=\s*1\s*\)/.test(src)) {
    log(false, `${rel}: sem declare(strict_types=1)`);
    continue;
  }

  // 3. namespace declarado
  if (!/^namespace\s+[\w\\]+;/m.test(src)) {
    // bootstrap script nao tem namespace — OK
    if (!arq.endsWith('bootstrap-content-model.php')) {
      log(false, `${rel}: sem 'namespace'`);
      continue;
    }
  }

  // 4. Chaves balanceadas
  const abertas = (src.match(/\{/g) || []).length;
  const fechadas = (src.match(/\}/g) || []).length;
  if (abertas !== fechadas) {
    log(false, `${rel}: chaves desbalanceadas ({:${abertas}, }:${fechadas})`);
    continue;
  }

  // 5. Parenteses balanceados
  const pa = (src.match(/\(/g) || []).length;
  const pf = (src.match(/\)/g) || []).length;
  if (pa !== pf) {
    log(false, `${rel}: parenteses desbalanceados ((:${pa}, ):${pf})`);
    continue;
  }

  // 6. Colchetes balanceados
  const ca = (src.match(/\[/g) || []).length;
  const cf = (src.match(/\]/g) || []).length;
  if (ca !== cf) {
    log(false, `${rel}: colchetes desbalanceados ([:${ca}, ]:${cf})`);
    continue;
  }

  // 7. Classe declarada (exceto script puro)
  if (!arq.endsWith('bootstrap-content-model.php')) {
    if (!/^(final\s+|abstract\s+)?class\s+\w+/m.test(src)) {
      log(false, `${rel}: sem 'class' declarada`);
      continue;
    }
  }

  // 8. Use statements bem-formados (sem virgula final, sem barra dupla)
  const uses = [...src.matchAll(/^use\s+([\w\\]+)(?:\s+as\s+\w+)?;/gm)];
  let useOk = true;
  for (const u of uses) {
    if (u[1].includes('\\\\')) {
      log(false, `${rel}: use mal-formado '${u[1]}'`);
      useOk = false;
      break;
    }
  }
  if (!useOk) continue;

  log(true, `${rel}: sanity OK (${abertas} chaves, ${uses.length} use)`);
}

console.log(`\nResumo: ${problemas.length === 0 ? `${arquivos.length} arquivos OK` : problemas.length + ' PROBLEMAS'}`);
process.exit(problemas.length === 0 ? 0 : 1);
