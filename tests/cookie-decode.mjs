import { encode, decode } from '@auth/core/jwt';

// NextAuth v5 usa o módulo @auth/core/jwt para codificar/decodificar o
// cookie de sessão. O `next-auth/jwt` reexporta isso.
// Vou simular o que acontece:
//   1) NextAuth encode o token interno (que contém o drupalJwt) num cookie
//   2) Nosso client.ts decode esse cookie e extrai o drupalJwt

const AUTH_SECRET = 'um-AUTH_SECRET-de-teste-com-mais-de-32-chars-XYZ';
const COOKIE_NAME = 'authjs.session-token'; // dev (sem __Secure-)

// Token interno do NextAuth — após o callback jwt() ter rodado:
const tokenInterno = {
  email: 'fulano@gmail.com',
  name: 'Fulano de Tal',
  drupalJwt: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmdWxhbm9AZ21haWwuY29tIn0.SIGNATURE',
  drupalJwtExp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 7 * 86400,
};

// 1) Encode (NextAuth faz isso quando seta o cookie)
const cookieValue = await encode({
  token: tokenInterno,
  secret: AUTH_SECRET,
  salt: COOKIE_NAME,
  maxAge: 7 * 86400,
});

console.log('  OK   Cookie encoded:', cookieValue.slice(0, 60) + '...');
console.log('  OK   Tamanho do cookie:', cookieValue.length, 'chars');

// 2) Decode (o que client.ts faz)
const decoded = await decode({
  token: cookieValue,
  secret: AUTH_SECRET,
  salt: COOKIE_NAME,
});

if (!decoded) {
  console.log('  FAIL decode retornou null');
  process.exit(1);
}

console.log('  OK   decode.email:', decoded.email);
console.log('  OK   decode.drupalJwt presente:', typeof decoded.drupalJwt === 'string');
console.log('  OK   decode.drupalJwt =', decoded.drupalJwt.slice(0, 50) + '...');

if (decoded.drupalJwt !== tokenInterno.drupalJwt) {
  console.log('  FAIL drupalJwt nao bate apos roundtrip');
  process.exit(1);
}
console.log('  OK   drupalJwt sobreviveu ao encode/decode 100% intacto');

// 3) Salt errado: decode LANCA. client.ts trata via try/catch.
try {
  await decode({
    token: cookieValue,
    secret: AUTH_SECRET,
    salt: '__Secure-authjs.session-token',
  });
  console.log('  FAIL salt errado deveria LANCAR mas aceitou');
  process.exit(1);
} catch (e) {
  console.log('  OK   salt errado lanca exception:', e.message);
}

// 4) Secret errado: idem
try {
  await decode({
    token: cookieValue,
    secret: 'AUTH_SECRET_diferente_para_teste-XYZ-32-chars',
    salt: COOKIE_NAME,
  });
  console.log('  FAIL secret errado deveria LANCAR mas aceitou');
  process.exit(1);
} catch (e) {
  console.log('  OK   secret errado lanca exception:', e.message);
}

console.log('\nCookie encode -> decode: roundtrip OK, salt/secret errados lancam.');
console.log('=> client.ts FAZ try/catch e retorna null -> drupalFetch nao manda');
console.log('   Authorization header. Comportamento correto.');
