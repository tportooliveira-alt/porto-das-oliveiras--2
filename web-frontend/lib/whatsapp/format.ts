const DDI = '55';
const DDD_PADRAO = '77'; // Vitória da Conquista — BA

export function montarLinkWhatsapp(numeroLocal: string, mensagem: string): string {
  const digitos = numeroLocal.replace(/\D/g, '');
  const numero = digitos.length === 9 ? `${DDI}${DDD_PADRAO}${digitos}` : `${DDI}${digitos}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
