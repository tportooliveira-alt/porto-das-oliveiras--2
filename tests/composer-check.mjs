import { readFileSync } from 'fs';

const path = 'C:/Users/Thiago Porto/OneDrive/Documentos/Chacreamento/web-backend/composer.json';
let composer;
try {
  composer = JSON.parse(readFileSync(path, 'utf8'));
  console.log('  OK JSON parse');
} catch (e) {
  console.log('  FAIL JSON parse:', e.message);
  process.exit(1);
}

const requiredKeys = ['name', 'type', 'require', 'extra', 'repositories', 'config'];
const missing = requiredKeys.filter(k => !(k in composer));
if (missing.length) {
  console.log('  FAIL missing keys:', missing.join(', '));
  process.exit(1);
}
console.log('  OK chaves obrigatorias presentes');

// installer-paths existem em extra?
if (!composer.extra?.['installer-paths']) {
  console.log('  FAIL extra.installer-paths ausente');
  process.exit(1);
}
console.log('  OK installer-paths configurado');

// drupal-scaffold com web-root?
const scaffoldRoot = composer.extra?.['drupal-scaffold']?.locations?.['web-root'];
if (scaffoldRoot !== 'web/') {
  console.log(`  FAIL drupal-scaffold web-root = "${scaffoldRoot}", esperado "web/"`);
  process.exit(1);
}
console.log('  OK drupal-scaffold web-root');

// Repositório packages.drupal.org presente?
const drupalRepo = Object.values(composer.repositories ?? {}).find(r => r.url?.includes('drupal.org'));
if (!drupalRepo) {
  console.log('  FAIL repositorio drupal.org ausente');
  process.exit(1);
}
console.log('  OK repositorio drupal.org configurado');

// allow-plugins inclui composer/installers + drupal/core-composer-scaffold?
const allow = composer.config?.['allow-plugins'] ?? {};
const required = ['composer/installers', 'drupal/core-composer-scaffold'];
const missingPlugins = required.filter(p => !allow[p]);
if (missingPlugins.length) {
  console.log('  FAIL allow-plugins faltando:', missingPlugins.join(', '));
  process.exit(1);
}
console.log('  OK allow-plugins configurado');

// Lista de deps importantes
const deps = composer.require ?? {};
const importantes = ['drupal/core-recommended', 'drupal/jsonapi_extras', 'drupal/key', 'firebase/php-jwt', 'drush/drush'];
const faltando = importantes.filter(d => !deps[d]);
if (faltando.length) {
  console.log('  FAIL deps importantes faltando:', faltando.join(', '));
  process.exit(1);
}
console.log('  OK deps importantes presentes:', importantes.join(', '));

// Não pode mais ter drupal/jwt (removemos)
if (deps['drupal/jwt']) {
  console.log('  FAIL drupal/jwt ainda presente — removemos antes');
  process.exit(1);
}
console.log('  OK drupal/jwt foi removido');

console.log('\nResumo: composer.json passou em todas as checagens');
