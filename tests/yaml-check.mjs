import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import YAML from 'yaml';

const root = 'C:/Users/Thiago Porto/OneDrive/Documentos/Chacreamento';
const arquivos = execSync(`find "${root}/web-backend" -name "*.yml" -o -name "*.yaml"`, { encoding: 'utf8' })
  .split('\n').filter(Boolean);

let okCount = 0;
let falhas = [];

for (const arq of arquivos) {
  try {
    const conteudo = readFileSync(arq, 'utf8');
    const doc = YAML.parse(conteudo);
    if (doc === null || doc === undefined) throw new Error('vazio');
    okCount++;
    console.log('  OK', arq.replace(root + '/', ''));
  } catch (e) {
    falhas.push({ arq: arq.replace(root + '/', ''), erro: e.message });
    console.log('  FAIL', arq.replace(root + '/', ''), '-', e.message);
  }
}

console.log(`\nResumo: ${okCount}/${arquivos.length} OK`);
process.exit(falhas.length === 0 ? 0 : 1);
