import { Suspense, useState, useEffect, useRef } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const Problem = lazyWithRetry(() => import("@/components/landing/Problem"));
const HowItWorks = lazyWithRetry(() => import("@/components/landing/HowItWorks"));
const Testimonials = lazyWithRetry(() => import("@/components/landing/Testimonials"));
const Pricing = lazyWithRetry(() => import("@/components/landing/Pricing"));
const FAQ = lazyWithRetry(() => import("@/components/landing/FAQ"));
const Footer = lazyWithRetry(() => import("@/components/landing/Footer"));

const SectionFallback = ({ height = 400 }: { height?: number }) => (
  <div style={{ minHeight: height }} />
);

const LazySection = ({ children, height = 400, id }: { children: React.ReactNode; height?: number; id?: string }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tryScrollTo = () => {
      // double rAF: wait for Suspense to paint before scrolling
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          el.scrollIntoView({ behavior: "smooth", block: "start" })
        )
      );
    };

    const checkHash = () => {
      if (id && window.location.hash === `#${id}`) {
        setShouldRender(true);
        tryScrollTo();
      }
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "300px" }
    );
    observer.observe(el);

    return () => {
      window.removeEventListener("hashchange", checkHash);
      observer.disconnect();
    };
  }, [id]);

  return (
    <div id={id} ref={ref} style={{ minHeight: shouldRender ? undefined : height }}>
      {shouldRender ? (
        <Suspense fallback={<SectionFallback height={height} />}>
          {children}
        </Suspense>
      ) : (
        <SectionFallback height={height} />
      )}
    </div>
  );
};

const Index = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="organizaai-theme">
      <div className="min-h-screen relative" style={{ background: "linear-gradient(to bottom, #030712, #020617 40%, #010409)" }}>
        <Navbar />
        <Hero />

        <LazySection height={500}>
          <Problem />
        </LazySection>

        <LazySection height={600} id="como-funciona">
          <HowItWorks />
        </LazySection>

        <LazySection height={700} id="planos">
          <Pricing />
        </LazySection>

        <LazySection height={500} id="depoimentos">
          <Testimonials />
        </LazySection>

        <LazySection height={400} id="faq">
          <FAQ />
        </LazySection>

        <LazySection height={200}>
          <Footer />
        </LazySection>

      </div>
    </ThemeProvider>
  );
};

export default Index;
