import { readFileSync, existsSync } from 'fs';
import YAML from 'yaml';

const root = 'C:/Users/Thiago Porto/OneDrive/Documentos/Chacreamento';
const BS = String.fromCharCode(92); // single backslash

let problemas = [];

function log(ok, msg) {
  console.log(ok ? '  OK  ' : '  FAIL', msg);
  if (!ok) problemas.push(msg);
}

function checarServices(modulo) {
  const servicesPath = `${root}/web-backend/web/modules/custom/${modulo}/${modulo}.services.yml`;
  if (!existsSync(servicesPath)) return;
  const yml = YAML.parse(readFileSync(servicesPath, 'utf8'));
  const services = yml.services ?? {};

  for (const [id, def] of Object.entries(services)) {
    const fqcn = def.class;
    if (!fqcn) { log(false, `[${modulo}] service ${id} sem 'class'`); continue; }
    const partes = fqcn.split(BS);
    if (partes[0] !== 'Drupal' || partes[1] !== modulo) {
      log(false, `[${modulo}] service ${id}: classe '${fqcn}' fora do namespace esperado`);
      continue;
    }
    const subPath = partes.slice(2).join('/');
    const phpPath = `${root}/web-backend/web/modules/custom/${modulo}/src/${subPath}.php`;
    if (!existsSync(phpPath)) {
      log(false, `[${modulo}] service ${id}: arquivo nao existe (${subPath}.php)`);
      continue;
    }
    log(true, `[${modulo}] service ${id} -> ${subPath}.php`);

    const conteudo = readFileSync(phpPath, 'utf8');
    const nsLine = conteudo.match(/^namespace\s+([^\s;]+);/m);
    const nsEsperado = ['Drupal', modulo, ...partes.slice(2, -1)].join(BS);
    if (!nsLine) {
      log(false, `[${modulo}] ${subPath}.php sem 'namespace'`);
    } else if (nsLine[1] !== nsEsperado) {
      log(false, `[${modulo}] ${subPath}.php namespace='${nsLine[1]}', esperado '${nsEsperado}'`);
    } else {
      log(true, `[${modulo}] namespace OK em ${subPath}.php`);
    }

    const args = def.arguments ?? [];
    const ctorMatch = conteudo.match(/public function __construct\s*\(([\s\S]*?)\)\s*\{/);
    if (ctorMatch) {
      const params = ctorMatch[1]
        .split(/,(?![^()]*\))/)
        .map(p => p.trim())
        .filter(Boolean);
      if (params.length !== args.length) {
        log(false, `[${modulo}] service ${id}: services.yml passa ${args.length} args, __construct espera ${params.length}`);
      } else {
        log(true, `[${modulo}] service ${id}: aridade construtor (${args.length}) bate`);
      }
    }
  }
}

function checarRouting(modulo) {
  const rPath = `${root}/web-backend/web/modules/custom/${modulo}/${modulo}.routing.yml`;
  if (!existsSync(rPath)) return;
  const yml = YAML.parse(readFileSync(rPath, 'utf8'));
  for (const [rotaId, def] of Object.entries(yml)) {
    const ctrl = def.defaults?._controller;
    if (!ctrl) continue;
    const ctrlSemBarra = ctrl.replace(/^\\/, '');
    const idx = ctrlSemBarra.indexOf('::');
    if (idx < 0) { log(false, `[${modulo}] route ${rotaId}: _controller '${ctrl}' sem '::'`); continue; }
    const fqcn = ctrlSemBarra.slice(0, idx);
    const metodo = ctrlSemBarra.slice(idx + 2);
    const partes = fqcn.split(BS);
    if (partes[0] !== 'Drupal' || partes[1] !== modulo) {
      log(false, `[${modulo}] route ${rotaId}: classe '${fqcn}' fora do namespace`);
      continue;
    }
    const subPath = partes.slice(2).join('/');
    const phpPath = `${root}/web-backend/web/modules/custom/${modulo}/src/${subPath}.php`;
    if (!existsSync(phpPath)) {
      log(false, `[${modulo}] route ${rotaId}: arquivo nao existe (${subPath}.php)`);
      continue;
    }
    const conteudo = readFileSync(phpPath, 'utf8');
    const re = new RegExp(`public function ${metodo}\\s*\\(`);
    if (!re.test(conteudo)) {
      log(false, `[${modulo}] route ${rotaId}: metodo '${metodo}' nao encontrado em ${subPath}.php`);
    } else {
      log(true, `[${modulo}] route ${rotaId} -> ${subPath}.php::${metodo}`);
    }
  }
}

function checarInfo(modulo) {
  const infoPath = `${root}/web-backend/web/modules/custom/${modulo}/${modulo}.info.yml`;
  const info = YAML.parse(readFileSync(infoPath, 'utf8'));
  log(!!info.name, `[${modulo}] info.yml tem 'name'`);
  log(info.type === 'module', `[${modulo}] info.yml type=module`);
  log(!!info.core_version_requirement, `[${modulo}] info.yml tem core_version_requirement`);
}

for (const m of ['porto_auth', 'porto_banking']) {
  console.log(`\n== ${m} ==`);
  checarInfo(m);
  checarServices(m);
  checarRouting(m);
}

console.log(`\nResumo: ${problemas.length === 0 ? 'TUDO OK' : problemas.length + ' PROBLEMA(S)'}`);
process.exit(problemas.length === 0 ? 0 : 1);
