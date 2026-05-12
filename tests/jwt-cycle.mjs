import { SignJWT, jwtVerify } from 'jose';

const SEGREDO = 'um-segredo-de-teste-com-mais-de-32-caracteres-OK-XYZ';
const ISSUER = 'porto-frontend';
const AUDIENCE = 'drupal';

const chave = new TextEncoder().encode(SEGREDO);

// 1. Mint igual ao que o auth.ts faz
const tokenAssinado = await new SignJWT({
  email: 'fulano@gmail.com',
  name: 'Fulano de Tal',
  provider: 'google',
})
  .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
  .setIssuer(ISSUER)
  .setAudience(AUDIENCE)
  .setSubject('fulano@gmail.com')
  .setIssuedAt()
  .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
  .sign(chave);

console.log('  OK   JWT assinado:', tokenAssinado.slice(0, 60) + '...');

// 2. Verificar como o firebase/php-jwt fará:
//    - Mesma chave HS256
//    - Validar iss + aud + exp
const { payload, protectedHeader } = await jwtVerify(tokenAssinado, chave, {
  issuer: ISSUER,
  audience: AUDIENCE,
});

console.log('  OK   header alg:', protectedHeader.alg);
console.log('  OK   payload.email:', payload.email);
console.log('  OK   payload.iss:', payload.iss);
console.log('  OK   payload.aud:', payload.aud);
console.log('  OK   payload.sub:', payload.sub);
console.log('  OK   payload.exp:', new Date(payload.exp * 1000).toISOString());

// 3. Tentar verificar com segredo errado — DEVE falhar
try {
  await jwtVerify(tokenAssinado, new TextEncoder().encode('segredo-errado-de-teste-XYZ-com-32-chars'));
  console.log('  FAIL segredo errado deveria rejeitar mas aceitou!');
  process.exit(1);
} catch (e) {
  console.log('  OK   segredo errado rejeitado:', e.code || e.message);
}

// 4. Tentar verificar com issuer errado — DEVE falhar
try {
  await jwtVerify(tokenAssinado, chave, { issuer: 'outro-issuer' });
  console.log('  FAIL issuer errado deveria rejeitar mas aceitou!');
  process.exit(1);
} catch (e) {
  console.log('  OK   issuer errado rejeitado:', e.code || e.message);
}

// 5. JWT expirado — DEVE falhar
const tokenExpirado = await new SignJWT({ email: 'x@x.com' })
  .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
  .setIssuer(ISSUER).setAudience(AUDIENCE)
  .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
  .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
  .sign(chave);

try {
  await jwtVerify(tokenExpirado, chave, { issuer: ISSUER, audience: AUDIENCE });
  console.log('  FAIL token expirado deveria rejeitar mas aceitou!');
  process.exit(1);
} catch (e) {
  console.log('  OK   token expirado rejeitado:', e.code || e.message);
}

console.log('\nCiclo JWT mint -> verify -> rejeicoes esperadas: TODOS OK');
