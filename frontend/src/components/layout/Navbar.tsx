// 'use client';
// import { useLayoutEffect, useRef, useState } from 'react';
// import { gsap } from 'gsap';
// import Link from 'next/link';
// import { ArrowUpRight } from 'lucide-react';

// interface NavLink { label: string; href?: string; ariaLabel?: string; }
// interface NavItem { label: string; bgColor: string; textColor: string; links: NavLink[]; }

// interface CardNavProps {
//   items: NavItem[];
//   ease?: string;
//   baseColor?: string;
//   menuColor?: string;
//   buttonBgColor?: string;
//   buttonTextColor?: string;
// }

// const CardNav = ({
//   items,
//   ease = 'power3.out',
//   baseColor = 'rgba(13, 17, 23, 0.84)',
//   menuColor,
//   buttonBgColor = '#00e5a0',
//   buttonTextColor = '#050507',
// }: CardNavProps) => {
//   const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
//   const [isExpanded, setIsExpanded] = useState(false);
//   const navRef = useRef<HTMLElement>(null);
//   const cardsRef = useRef<HTMLDivElement[]>([]);
//   const tlRef = useRef<gsap.core.Timeline | null>(null);

//   const calculateHeight = () => {
//     const navEl = navRef.current;
//     if (!navEl) return 260;
//     const isMobile = window.matchMedia('(max-width: 768px)').matches;
//     if (isMobile) {
//       const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement;
//       if (contentEl) {
//         const prev = { visibility: contentEl.style.visibility, position: contentEl.style.position, height: contentEl.style.height };
//         contentEl.style.visibility = 'visible';
//         contentEl.style.position = 'static';
//         contentEl.style.height = 'auto';
//         void contentEl.offsetHeight;
//         const result = 60 + contentEl.scrollHeight + 16;
//         Object.assign(contentEl.style, prev);
//         return result;
//       }
//     }
//     return 260;
//   };

//   const createTimeline = () => {
//     const navEl = navRef.current;
//     if (!navEl) return null;
//     gsap.set(navEl, { height: 60, overflow: 'hidden' });
//     gsap.set(cardsRef.current, { y: 50, opacity: 0 });
//     const tl = gsap.timeline({ paused: true });
//     tl.to(navEl, { height: calculateHeight, duration: 0.4, ease });
//     tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');
//     return tl;
//   };

//   useLayoutEffect(() => {
//     const tl = createTimeline();
//     tlRef.current = tl;
//     return () => { tl?.kill(); };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [ease, items]);

//   useLayoutEffect(() => {
//     const handleResize = () => {
//       if (!tlRef.current) return;
//       tlRef.current.kill();
//       const newTl = createTimeline();
//       if (!newTl) return;
//       if (isExpanded) newTl.progress(1);
//       tlRef.current = newTl;
//     };
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isExpanded]);

//   const toggleMenu = () => {
//     const tl = tlRef.current;
//     if (!tl) return;
//     if (!isExpanded) {
//       setIsHamburgerOpen(true);
//       setIsExpanded(true);
//       tl.play(0);
//     } else {
//       setIsHamburgerOpen(false);
//       tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
//       tl.reverse();
//     }
//   };

//   return (
//     <div className="fixed inset-x-0 top-4 z-[99] px-4 md:top-6 md:px-6">
//       <nav
//         ref={navRef}
//         className="section-shell relative block h-[60px] max-w-5xl overflow-hidden rounded-2xl p-0 shadow-2xl backdrop-blur-xl will-change-[height]"
//         style={{ backgroundColor: baseColor, border: '1px solid rgba(255,255,255,0.08)' }}
//       >
//         {/* Top bar */}
//         <div className="absolute inset-x-0 top-0 z-[2] grid h-[60px] grid-cols-[auto_1fr_auto] items-center px-4 md:grid-cols-[1fr_auto_1fr] md:px-5">
//           {/* Hamburger */}
//           <div
//             className="group flex h-full w-10 cursor-pointer flex-col items-center justify-center gap-[5px] justify-self-start"
//             onClick={toggleMenu}
//             role="button"
//             aria-label={isExpanded ? 'Close menu' : 'Open menu'}
//             tabIndex={0}
//             style={{ color: menuColor || '#8b96a8' }}
//           >
//             <div className={`w-[22px] h-[1.5px] bg-current transition-all duration-300 origin-center ${isHamburgerOpen ? 'translate-y-[3.5px] rotate-45' : ''}`} />
//             <div className={`w-[22px] h-[1.5px] bg-current transition-all duration-300 origin-center ${isHamburgerOpen ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
//           </div>

//           {/* Logo / Brand */}
//           <div className="flex items-center gap-3 justify-self-center">
//             <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--accent)] bg-[rgba(0,229,160,0.05)]">
//               <div className="h-2.5 w-2.5 rounded-sm bg-[var(--accent)]" />
//             </div>
//             <span className="font-display text-sm font-bold tracking-[0.22em] text-[var(--text-primary)]">
//               MODAL<span className="text-[var(--accent)]">AI</span>
//             </span>
//           </div>

//           {/* CTA */}
//           <div className="hidden items-center gap-2 justify-self-end md:flex">
//             <Link
//               href="/auth/login"
//               className="ui-button ui-button-sm border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
//             >
//               Login
//             </Link>
//             <Link
//               href="/auth/register"
//               className="ui-button ui-button-sm transition-all hover:opacity-90"
//               style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
//             >
//               Register
//             </Link>
//           </div>
//         </div>

//         {/* Expanded cards */}
//         <div
//           className={`card-nav-content absolute bottom-0 left-0 right-0 top-[60px] z-[1] flex flex-col gap-2 p-2 ${isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'} md:flex-row md:items-end md:gap-3`}
//           aria-hidden={!isExpanded}
//         >
//           {items.slice(0, 3).map((item, idx) => (
//             <div
//               key={idx}
//               className="relative flex min-h-[64px] flex-1 select-none flex-col gap-2 rounded-xl p-4 md:h-full"
//               ref={(el) => { if (el) cardsRef.current[idx] = el; }}
//               style={{ backgroundColor: item.bgColor, color: item.textColor }}
//             >
//               <div className="font-display text-lg font-semibold tracking-tight">{item.label}</div>
//               <div className="mt-auto flex flex-col gap-0.5">
//                 {item.links?.map((lnk, i) => (
//                   <Link
//                     key={i}
//                     href={lnk.href || '#'}
//                     className="inline-flex items-center gap-1.5 text-xs opacity-80 hover:opacity-100 transition-opacity"
//                     aria-label={lnk.ariaLabel}
//                   >
//                     <ArrowUpRight size={11} />
//                     {lnk.label}
//                   </Link>
//                 ))}
//               </div>
//             </div>
//           ))}

//           {/* Mobile auth buttons */}
//           <div className="flex gap-2 md:hidden">
//             <Link href="/auth/login" className="ui-button ui-button-sm flex-1 border border-[var(--border-default)] text-[var(--text-secondary)]">Login</Link>
//             <Link href="/auth/register" className="ui-button ui-button-sm flex-1" style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}>Register</Link>
//           </div>
//         </div>
//       </nav>
//     </div>
//   );
// };

// export default CardNav;








'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface NavLink { label: string; href?: string; ariaLabel?: string; }
interface NavItem  { label: string; bgColor: string; textColor: string; links: NavLink[]; }

interface CardNavProps {
  items: NavItem[];
  ease?: string;
}

const CardNav = ({ items, ease = 'power3.out' }: CardNavProps) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded]           = useState(false);
  const navRef   = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef    = useRef<gsap.core.Timeline | null>(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement;
      if (contentEl) {
        const prev = {
          visibility: contentEl.style.visibility,
          position:   contentEl.style.position,
          height:     contentEl.style.height,
        };
        contentEl.style.visibility = 'visible';
        contentEl.style.position   = 'static';
        contentEl.style.height     = 'auto';
        void contentEl.offsetHeight;
        const result = 60 + contentEl.scrollHeight + 16;
        Object.assign(contentEl.style, prev);
        return result;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;
    gsap.set(navEl,           { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });
    const tl = gsap.timeline({ paused: true });
    tl.to(navEl,           { height: calculateHeight, duration: 0.4, ease });
    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');
    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => { tl?.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      tlRef.current.kill();
      const newTl = createTimeline();
      if (!newTl) return;
      if (isExpanded) newTl.progress(1);
      tlRef.current = newTl;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  return (
    <div className="fixed inset-x-0 top-4 z-[99] px-4 md:top-6 md:px-6">
      <nav
        ref={navRef}
        className="section-shell-tight relative block h-[60px] overflow-hidden rounded-2xl shadow-2xl backdrop-blur-xl will-change-[height]"
        style={{
          backgroundColor: 'rgba(13,17,23,0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* ── Top bar ── */}
        <div className="absolute inset-x-0 top-0 z-[2] grid h-[60px] grid-cols-[auto_1fr_auto] items-center px-4 md:grid-cols-[1fr_auto_1fr] md:px-5">

          {/* Hamburger */}
          <button
            className="group flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-[5px] justify-self-start"
            onClick={toggleMenu}
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
          >
            <span
              className={`block h-[1.5px] w-[22px] bg-neutral-400 transition-all duration-300 origin-center ${
                isHamburgerOpen ? 'translate-y-[3.5px] rotate-45' : ''
              }`}
            />
            <span
              className={`block h-[1.5px] w-[22px] bg-neutral-400 transition-all duration-300 origin-center ${
                isHamburgerOpen ? '-translate-y-[3.5px] -rotate-45' : ''
              }`}
            />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 justify-self-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-400/8">
              <div className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
            </div>
            <span className="font-display text-sm font-bold tracking-[0.22em] text-white">
              MODAL<span className="text-emerald-400">AI</span>
            </span>
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-2 justify-self-end md:flex">
            <Link
              href="/auth/login"
              className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-neutral-300 transition-all hover:border-white/30 hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-black transition-opacity hover:opacity-90"
            >
              Register
            </Link>
          </div>
        </div>

        {/* ── Expanded dropdown ── */}
        <div
          className={`card-nav-content absolute bottom-0 left-0 right-0 top-[60px] z-[1] flex flex-col gap-2 p-2 md:flex-row md:items-end md:gap-3 ${
            isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
          }`}
          aria-hidden={!isExpanded}
        >
          {items.slice(0, 3).map((item, idx) => (
            <div
              key={idx}
              ref={(el) => { if (el) cardsRef.current[idx] = el; }}
              className="relative flex min-h-[64px] flex-1 select-none flex-col gap-2 rounded-xl p-4 md:h-full"
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <p className="font-display text-lg font-semibold tracking-tight">{item.label}</p>
              <div className="mt-auto flex flex-col gap-1">
                {item.links?.map((lnk, i) => (
                  <Link
                    key={i}
                    href={lnk.href || '#'}
                    aria-label={lnk.ariaLabel}
                    className="inline-flex items-center gap-1.5 text-xs opacity-75 transition-opacity hover:opacity-100"
                  >
                    <ArrowUpRight size={11} />
                    {lnk.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Mobile auth */}
          <div className="flex gap-2 md:hidden">
            <Link
              href="/auth/login"
              className="flex-1 rounded-xl border border-white/15 py-2.5 text-center text-xs font-semibold text-neutral-300"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="flex-1 rounded-xl bg-emerald-400 py-2.5 text-center text-xs font-bold text-black"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
