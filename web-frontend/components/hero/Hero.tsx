import VideoFrame from './VideoFrame';
import CtaPrimary from '@/components/ui/CtaPrimary';
import CtaSecondary from '@/components/ui/CtaSecondary';
import { montarLinkWhatsapp } from '@/lib/whatsapp/format';

const KICKER = 'Loteamento Porto das Oliveiras · BR-262, km 14 · Vitória da Conquista — BA';
const HEADLINE = 'Aqui se planta um sonho.';
const SUBHEAD =
  'Lotes de 300 m² a 30 minutos do centro de Vitória da Conquista. Infraestrutura completa, escritura registrada, parcelamento direto.';
const KICKER_OFFER = '☉ 54 lotes · A partir de R$ 120.000';

type Props = {
  /** Caminho do .mp4 quando o cliente enviar (ex.: '/video/sobrevoo.mp4') */
  videoSrc?: string;
  /** Caminho do pôster (frame estático) */
  videoPoster?: string;
};

export default function Hero({ videoSrc, videoPoster }: Props) {
  const whatsHref = montarLinkWhatsapp('5577999999999', 'Olá! Quero conhecer os lotes do Porto das Oliveiras.');

  return (
    <section className="paper relative overflow-hidden" aria-labelledby="hero-headline">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-12 lg:pb-32 lg:pt-16">
        {/* Kicker line centralizada */}
        <div className="mb-10 flex items-center justify-center gap-4 text-sepia-soft">
          <span className="h-px w-8 bg-linha" aria-hidden />
          <span className="kicker text-center">{KICKER}</span>
          <span className="h-px w-8 bg-linha" aria-hidden />
        </div>

        {/* Vídeo card */}
        <div className="mx-auto max-w-[1280px] animate-fade-up [animation-delay:120ms]">
          <VideoFrame src={videoSrc} posterSrc={videoPoster} caption="Sobrevoo · jan / 2026" />
        </div>

        {/* Headline grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:mt-20 lg:grid-cols-12 lg:gap-8">
          <div className="animate-fade-up [animation-delay:240ms] lg:col-span-6">
            <p className="kicker mb-5 text-oliva">{KICKER_OFFER}</p>
            <h1
              id="hero-headline"
              className="font-serif text-display-lg text-sepia text-balance"
            >
              {HEADLINE}
            </h1>
          </div>
          <div className="animate-fade-up self-end [animation-delay:360ms] lg:col-span-5 lg:col-start-8">
            <p className="mb-7 max-w-[460px] text-[17px] leading-relaxed text-sepia-soft lg:text-[18px]">
              {SUBHEAD}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <CtaPrimary href="/lotes" size="lg">
                Ver lotes disponíveis
              </CtaPrimary>
              <CtaSecondary href={whatsHref} external whats>
                Falar agora
              </CtaSecondary>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-t border-linha bg-areia-clara/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4 lg:py-10">
          <Stat numero="54" rotulo="Lotes" />
          <Stat numero="12 ha" rotulo="Área total" />
          <Stat numero="30 min" rotulo="Do centro" />
          <Stat numero="100%" rotulo="Escriturados" />
        </div>
      </div>
    </section>
  );
}

function Stat({ numero, rotulo }: { numero: string; rotulo: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="font-serif text-[28px] font-medium leading-none text-sepia tracking-tightest sm:text-[36px]">
        {numero}
      </span>
      <span className="kicker">{rotulo}</span>
    </div>
  );
}
