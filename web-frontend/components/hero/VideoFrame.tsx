'use client';

import { useRef, useState } from 'react';
import PlayButton from './PlayButton';

type Props = {
  src?: string;       // Caminho do .mp4 quando você adicionar
  posterSrc?: string; // Caminho do pôster (frame inicial) quando tiver
  caption?: string;   // Texto do canto superior esquerdo (kicker)
  className?: string;
};

/**
 * Vídeo card central da Versão A.
 *
 * Enquanto `src` não é fornecido, mostra um pôster terroso animado em CSS
 * com o play overlay. Quando você anexar o mp4 + poster.webp, é só passar
 * via props e o `<video>` real assume.
 */
export default function VideoFrame({
  src,
  posterSrc,
  caption = 'Sobrevoo · Porto das Oliveiras',
  className = '',
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    const v = videoRef.current;
    if (!v) {
      setPlaying((p) => !p);
      return;
    }
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (v) v.muted = !v.muted;
    setMuted((m) => !m);
  };

  return (
    <figure
      className={`relative w-full overflow-hidden rounded-card shadow-card transition-all duration-500 ease-out-soft hover:shadow-hover hover:-translate-y-1 ${className}`}
      style={{ aspectRatio: '16 / 9' }}
    >
      {src ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <div className="video-poster absolute inset-0 h-full w-full" aria-label="Pôster — vídeo será adicionado">
          {/* "Filmstrip" decorativo, pequeno detalhe para o placeholder */}
          <div className="absolute inset-x-0 bottom-12 flex justify-center gap-1 opacity-40">
            <span className="h-px w-12 bg-branco" />
            <span className="h-px w-12 bg-branco/60" />
            <span className="h-px w-12 bg-branco/30" />
          </div>
        </div>
      )}

      {/* Caption canto superior esquerdo */}
      <figcaption className="kicker absolute left-6 top-6 z-10 text-branco/85">
        ☉ {caption}
      </figcaption>

      {/* Play overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {!playing && (
          <span className="pointer-events-auto">
            <PlayButton size={104} onClick={handlePlay} />
          </span>
        )}
      </div>

      {/* Controles canto inferior direito */}
      {src && (
        <div className="absolute bottom-5 right-5 z-10 flex gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-full bg-branco/15 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-branco backdrop-blur-sm transition-colors hover:bg-branco/25"
            aria-label={muted ? 'Ativar som' : 'Tirar som'}
          >
            {muted ? '🔇 Som' : '🔊'}
          </button>
        </div>
      )}

      {/* Gradient discreto no rodapé pra legibilidade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-oliva-escuro/60 to-transparent"
      />
    </figure>
  );
}
