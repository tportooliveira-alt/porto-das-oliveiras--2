import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import YAML from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..').replace(/\\/g, '/');
const sync = `${root}/web-backend/config/sync`;

const arquivos = readdirSync(sync).filter(f => f.endsWith('.yml'));
const docs = {};
for (const f of arquivos) {
  docs[f.replace('.yml', '')] = YAML.parse(readFileSync(`${sync}/${f}`, 'utf8'));
}

const problemas = [];
function log(ok, msg) {
  console.log(ok ? '  OK  ' : '  FAIL', msg);
  if (!ok) problemas.push(msg);
}

// 1. Cada field.field.* tem field.storage.* correspondente?
for (const nome of Object.keys(docs)) {
  if (!nome.startsWith('field.field.')) continue;
  const doc = docs[nome];
  // dependencies.config inclui 'field.storage.node.field_XXX'?
  const depsConfig = doc.dependencies?.config ?? [];
  const storageDep = depsConfig.find(d => d.startsWith('field.storage.'));
  if (!storageDep) {
    log(false, `${nome}: sem dependency em field.storage.*`);
    continue;
  }
  if (!docs[storageDep]) {
    log(false, `${nome}: dep '${storageDep}' nao existe no config/sync`);
  } else {
    log(true, `${nome}: storage '${storageDep}' presente`);
  }

  // dependencies.config inclui node.type.X?
  const typeDep = depsConfig.find(d => d.startsWith('node.type.'));
  if (typeDep && !docs[typeDep]) {
    log(false, `${nome}: dep '${typeDep}' nao existe`);
  } else if (typeDep) {
    log(true, `${nome}: node.type '${typeDep}' presente`);
  }

  // Confere consistencia: o bundle do field bate com node.type.X?
  const bundleDoBundle = doc.bundle;
  if (typeDep && typeDep !== `node.type.${bundleDoBundle}`) {
    log(false, `${nome}: bundle='${bundleDoBundle}' mas dep aponta '${typeDep}'`);
  }

  // field_name no field bate com field_name no storage?
  const stg = docs[storageDep];
  if (stg && stg.field_name !== doc.field_name) {
    log(false, `${nome}: field_name='${doc.field_name}' difere do storage '${stg.field_name}'`);
  } else if (stg) {
    log(true, `${nome}: field_name '${doc.field_name}' consistente com storage`);
  }
}

// 2. Roles referenciam permissions de modulos declarados nas deps?
for (const nome of Object.keys(docs)) {
  if (!nome.startsWith('user.role.')) continue;
  const doc = docs[nome];
  const modDeps = doc.dependencies?.module ?? [];
  // Algumas permissions sao "sync banking api" — vem do modulo porto_banking
  const perms = doc.permissions ?? [];
  if (perms.some(p => p === 'sync banking api') && !modDeps.includes('porto_banking')) {
    log(false, `${nome}: usa 'sync banking api' mas sem dep em porto_banking`);
  } else {
    log(true, `${nome}: permissions declaradas com deps coerentes`);
  }
}

// 3. node.type.* tem name + type basicos?
for (const nome of Object.keys(docs)) {
  if (!nome.startsWith('node.type.')) continue;
  const doc = docs[nome];
  const bundleId = nome.replace('node.type.', '');
  if (doc.type !== bundleId) {
    log(false, `${nome}: campo 'type' (${doc.type}) difere do id do arquivo (${bundleId})`);
  } else {
    log(true, `${nome}: 'type' consistente com nome de arquivo`);
  }
  log(typeof doc.name === 'string' && doc.name.length > 0, `${nome}: tem 'name'`);
}

console.log(`\nResumo: ${problemas.length === 0 ? 'TUDO OK' : problemas.length + ' PROBLEMAS'}`);
process.exit(problemas.length === 0 ? 0 : 1);
