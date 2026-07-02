import { memo, useEffect, useRef } from "react";
import { analytics } from "@/lib/analytics";
import CTAButton from "@/components/landing/CTAButton";

const ROWS = 20;
const COL_STEP = 22;
const BG_COLOR = "rgba(2,6,23,";

const WaveMesh = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const s = useRef({ W: 0, H: 0, time: 0, animId: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const st = s.current;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      st.W = canvas.offsetWidth;
      st.H = canvas.offsetHeight;
      if (st.W === 0 || st.H === 0) return;
      canvas.width = Math.round(st.W * dpr);
      canvas.height = Math.round(st.H * dpr);
    };

    const animate = () => {
      st.animId = requestAnimationFrame(animate);
      const ctx = canvas.getContext("2d");
      const { W, H } = st;
      if (!ctx || W === 0 || H === 0) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      st.time += 0.012;

      for (let r = 0; r < ROWS; r++) {
        const t = r / (ROWS - 1);
        const baseY = H * 0.05 + t * H * 0.92;
        const amp  = 4 + t * 32;
        const freq = 0.007 - t * 0.0008;
        const phase = r * 1.1;
        const rowAlpha = 0.06 + t * 0.72;
        const dotR = 0.7 + t * 1.5;

        // shadowBlur removido — era 1000 sombras/frame, ~30% do custo GPU
        for (let x = 0; x <= W; x += COL_STEP) {
          const xFactor = x / W;
          const alpha = rowAlpha * (0.28 + xFactor * 0.72);
          const y = baseY + Math.sin(x * freq + phase + st.time) * amp;
          ctx.fillStyle = `rgba(80,150,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Fade top
      const fadeTop = ctx.createLinearGradient(0, 0, 0, H * 0.55);
      fadeTop.addColorStop(0,    BG_COLOR + "1)");
      fadeTop.addColorStop(0.62, BG_COLOR + "1)");
      fadeTop.addColorStop(1,    BG_COLOR + "0)");
      ctx.fillStyle = fadeTop;
      ctx.fillRect(0, 0, W, H * 0.55);

      // Fade left
      const fadeL = ctx.createLinearGradient(0, 0, W * 0.06, 0);
      fadeL.addColorStop(0, BG_COLOR + "1)");
      fadeL.addColorStop(1, BG_COLOR + "0)");
      ctx.fillStyle = fadeL;
      ctx.fillRect(0, 0, W * 0.06, H);

      // Fade right
      const fadeR = ctx.createLinearGradient(W * 0.94, 0, W, 0);
      fadeR.addColorStop(0, BG_COLOR + "0)");
      fadeR.addColorStop(1, BG_COLOR + "1)");
      ctx.fillStyle = fadeR;
      ctx.fillRect(W * 0.94, 0, W * 0.06, H);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    st.animId = requestAnimationFrame(animate);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(st.animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute bottom-0 left-0 w-full h-[260px] pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
});

WaveMesh.displayName = "WaveMesh";

const AVATAR_SRCS = [
  "https://i.pravatar.cc/64?img=47",
  "https://i.pravatar.cc/64?img=35",
  "https://i.pravatar.cc/64?img=12",
  "https://i.pravatar.cc/64?img=25",
];

const AvatarStack = memo(() => (
  <div className="flex items-center gap-3">
    <div className="flex -space-x-3">
      {AVATAR_SRCS.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Usuário ${i + 1}`}
          width={36}
          height={36}
          loading="eager"
          decoding="async"
          className="w-9 h-9 rounded-full border-2 border-[#06091c] object-cover"
          style={{ zIndex: AVATAR_SRCS.length - i }}
        />
      ))}
    </div>
    <div className="text-center sm:text-left leading-tight">
      <div className="text-white font-extrabold text-sm">+DE 5 MIL</div>
      <div className="text-white font-extrabold text-xs uppercase tracking-wide">
        PESSOAS SAÍRAM<br/>DAS DÍVIDAS
      </div>
    </div>
  </div>
));

AvatarStack.displayName = "AvatarStack";

// CSS stagger — substitui framer-motion (economiza ~100KB do bundle inicial)
const fadeUp: React.CSSProperties = {
  opacity: 0,
  animation: "fade-in-up 0.6s ease-out forwards",
};

const Hero = memo(() => {
  return (
    <section
      className="relative overflow-hidden pt-20"
      style={{ background: "transparent" }}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center pt-16 pb-24 sm:pb-40 lg:pb-52">
          {/* Headline */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight mb-5"
            style={{
              ...fadeUp,
              animationDelay: "0s",
              background: "linear-gradient(to bottom, #C8D8F0 0%, #FFFFFF 50%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Não sabe para onde está
            <br />
            indo o seu dinheiro?
          </h1>

          {/* Subtitle */}
          <p
            className="text-base md:text-lg lg:text-xl text-[#94A3B8] max-w-xl lg:max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ ...fadeUp, animationDelay: "0.12s" }}
          >
            Tenha um assistente financeiro trabalhando 24 horas para você.
            <br className="hidden md:block" />
            Mande áudio ou texto. Seu assistente financeiro resolve tudo pra você.
          </p>

          {/* CTA row */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-5 relative z-20 w-full"
            style={{ ...fadeUp, animationDelay: "0.24s" }}
          >
            <CTAButton
              to="/cadastro"
              onClick={() => analytics.click("hero_cta", "hero")}
            >
              COMECE AGORA
            </CTAButton>
            <AvatarStack />
          </div>
        </div>
      </div>

      {/* Wave mesh */}
      <WaveMesh />
    </section>
  );
});

Hero.displayName = "Hero";

export default Hero;
