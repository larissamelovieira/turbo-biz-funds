import { useState, useCallback, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";

const logoWeb = "/logoweb.png";

const NAV_LINKS = [
  { name: "Como Funciona", href: "#como-funciona" },
  { name: "Depoimentos",   href: "#depoimentos"   },
  { name: "Preços",        href: "#planos"         },
  { name: "Dúvidas",       href: "#faq"            },
] as const;

const Navbar = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const closeMenu   = useCallback(() => setIsOpen(false), []);
  const trackClick  = useCallback((name: string) => analytics.click(name, "navbar"), []);

  const handleLogin = useCallback((extraAction?: () => void) => {
    trackClick("login");
    extraAction?.();
    sessionStorage.removeItem("pendingPaymentPlan");
    sessionStorage.removeItem("postRegisterRedirect");
    if (isAuthenticated) {
      logout();
    }
    navigate("/login");
  }, [isAuthenticated, logout, navigate, trackClick]);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {NAV_LINKS.map((link) => (
        <a
          key={link.name}
          href={link.href}
          onClick={onClick}
          className="text-sm font-bold text-white/80 hover:text-white transition-colors duration-150 py-1"
        >
          {link.name}
        </a>
      ))}
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B1F3A]/95 backdrop-blur-md border-b border-white/[0.07]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo — icon + "Doutor Cash" text from logoweb.png */}
          <Link
            to="/"
            className="flex items-center gap-1 flex-shrink-0 group"
            aria-label="Doutor Cash — Início"
          >
            <img
              src={logoWeb}
              alt="DC"
              width={120}
              height={64}
              className="h-16 w-auto transition-transform duration-200 group-hover:scale-105"
            />
            <span className="text-white font-bold text-[15px] leading-snug flex flex-col justify-center">
              <span>Doutor</span>
              <span>Cash</span>
            </span>
          </Link>

          {/* Desktop nav — centered absolutely */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <NavLinks />
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {/* LOGIN — transparent + cyan border */}
            <button
              type="button"
              onClick={() => handleLogin()}
              className="
                inline-flex items-center px-5 py-2 rounded-lg
                border border-[#1B4DBF]/70 text-white text-sm font-bold uppercase tracking-wide
                hover:border-[#2a5dd4] hover:bg-[#1B4DBF]/10
                transition-all duration-150
              "
            >
              LOGIN
            </button>

            {/* CADASTRE-SE — solid #0047FF */}
            <Link
              to="/cadastro"
              onClick={() => trackClick("sign_up")}
              className="
                inline-flex items-center px-5 py-2 rounded-lg
                bg-[#1B4DBF] hover:bg-[#2a5dd4]
                text-white text-sm font-bold uppercase tracking-wide
                shadow-[0_0_18px_rgba(27,77,191,0.35)]
                hover:shadow-[0_0_28px_rgba(27,77,191,0.55)]
                transition-all duration-150
              "
            >
              CADASTRE-SE
            </Link>
          </div>

          {/* Mobile hamburger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-[300px] sm:w-[360px] bg-[#0B1F3A] border-white/10 flex flex-col"
            >
              <div className="flex flex-col gap-6 pt-6 flex-1">
                <Link to="/" onClick={closeMenu} className="flex items-center gap-1">
                  <img src={logoWeb} alt="DC" width={120} height={64} className="h-16 w-auto" />
                  <span className="text-white font-bold text-[15px] leading-snug flex flex-col justify-center">
                    <span>Doutor</span>
                    <span>Cash</span>
                  </span>
                </Link>

                <nav className="flex flex-col gap-4">
                  <NavLinks onClick={closeMenu} />
                </nav>

                <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => handleLogin(closeMenu)}
                    className="
                      flex items-center justify-center w-full px-5 py-2.5 rounded-lg
                      border border-[#1B4DBF]/70 text-white text-sm font-bold uppercase
                      hover:bg-cyan-400/10 transition-all
                    "
                  >
                    LOGIN
                  </button>
                  <Link
                    to="/cadastro"
                    onClick={() => { closeMenu(); trackClick("sign_up_mobile"); }}
                    className="
                      flex items-center justify-center w-full px-5 py-2.5 rounded-lg
                      bg-[#1B4DBF] hover:bg-[#2a5dd4]
                      text-white text-sm font-bold uppercase
                      transition-all
                    "
                  >
                    CADASTRE-SE
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>

        </div>
      </div>
    </nav>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
