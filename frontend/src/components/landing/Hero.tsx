// 'use client';
// import { motion } from 'framer-motion';
// import Link from 'next/link';
// import dynamic from 'next/dynamic';

// const Orb = dynamic(() => import('@/components/effects/Orb'), { ssr: false });
// const capabilities = ['Image Analysis', 'Video Intelligence', 'Audio Transcription', 'Document Extraction'];

// export default function Hero() {
//   return (
//     <section className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-[var(--bg-void)]">
      
//       {/* Background Layer: Orb & Gradients */}
//       <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
//         <div className="h-[75vh] w-[75vh] min-h-[500px] min-w-[500px] opacity-30 md:opacity-45">
//           <Orb hue={160} hoverIntensity={0.5} backgroundColor="#050507" />
//         </div>
//         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,var(--bg-void)_85%)]" />
//       </div>

//       {/* Content Layer */}
//       <div className="section-shell relative z-10 py-20">
//         <div className="mx-auto flex flex-col items-center text-center">
          
//           {/* Live Status Badge */}
//           <motion.div
//             initial={{ opacity: 0, y: -12 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="mb-10 flex items-center gap-2.5 rounded-full border border-[var(--border-subtle)] bg-black/60 px-4 py-2 backdrop-blur-md"
//           >
//             <span className="relative flex h-2 w-2">
//               <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75"></span>
//               <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]"></span>
//             </span>
//             <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--text-muted)]">
//               System operational - all models online
//             </span>
//           </motion.div>

//           {/* Main Headline */}
//           <motion.h1
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
//             className="max-w-[12ch] font-display text-[clamp(3.8rem,13vw,8.5rem)] font-extrabold leading-[0.85] tracking-[-0.06em] text-[var(--text-primary)]"
//           >
//             Multimodal <br />
//             <span className="text-[var(--accent)] text-glow inline-block">Intelligence</span>
//           </motion.h1>

//           {/* Value Proposition */}
//           <motion.p
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 0.35 }}
//             className="mx-auto mt-10 max-w-2xl text-sm leading-[1.8] text-[var(--text-secondary)] sm:text-base md:text-lg"
//           >
//             One interface for every media type. Upload images, video, audio, or documents 
//             and interrogate them with precision using state-of-the-art vision models.
//           </motion.p>

//           {/* Capabilities Tags */}
//           <motion.div 
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 0.5 }}
//             className="mt-12 flex flex-wrap justify-center gap-2.5"
//           >
//             {capabilities.map((cap) => (
//               <span 
//                 key={cap} 
//                 className="rounded-full border border-[var(--border-dim)] bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] transition-all hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
//               >
//                 {cap}
//               </span>
//             ))}
//           </motion.div>

//           {/* Interaction Section */}
//           <motion.div 
//             initial={{ opacity: 0, y: 15 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.65 }}
//             className="mt-14 flex w-full flex-col items-center justify-center gap-5 sm:flex-row"
//           >
//             <Link 
//               href="/auth/register" 
//               className="ui-button ui-button-lg glow-accent min-w-[200px] bg-[var(--accent)] text-black hover:scale-105 active:scale-95"
//             >
//               Start Analyzing
//             </Link>
//             <Link 
//               href="/auth/login" 
//               className="ui-button ui-button-lg border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-white/[0.08] min-w-[200px]"
//             >
//               Sign In
//             </Link>
//           </motion.div>

//           {/* UX Hint */}
//           <p className="cursor-blink mt-16 text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-dim)]">
//             ctrl+v to paste screenshots
//           </p>
//         </div>
//       </div>

//       {/* Section Transition Gradient */}
//       <div className="absolute bottom-0 h-32 w-full bg-gradient-to-t from-[var(--bg-void)] to-transparent" />
//     </section>
//   );
// }






'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Orb = dynamic(() => import('@/components/effects/Orb'), { ssr: false });

const capabilities = ['Image Analysis', 'Video Intelligence', 'Audio Transcription', 'Document Extraction'];

export default function Hero() {
  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-neutral-950">

      {/* Background Orb */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <div className="h-[70vh] w-[70vh] min-h-[480px] min-w-[480px] opacity-30 md:opacity-40">
          <Orb hue={160} hoverIntensity={0.5} backgroundColor="#050507" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#030305_82%)]" />
      </div>

      {/* Content */}
      <div className="section-shell-tight relative z-10 flex flex-col items-center py-28 text-center">

        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex items-center gap-2.5 rounded-full border border-white/10 bg-black/60 px-5 py-2 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
            System operational — all models online
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.65, ease: 'easeOut' }}
          className="font-display text-[clamp(3.6rem,12vw,8rem)] font-extrabold leading-[0.88] tracking-[-0.05em] text-white"
        >
          Multimodal
          <br />
          <span className="text-emerald-400 drop-shadow-[0_0_32px_rgba(52,211,153,0.45)]">
            Intelligence
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mx-auto mt-10 max-w-xl text-base leading-relaxed text-neutral-400 md:text-lg"
        >
          One interface for every media type. Upload images, video, audio, or documents
          and interrogate them with precision using state-of-the-art vision models.
        </motion.p>

        {/* Capability Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex flex-wrap justify-center gap-2.5"
        >
          {capabilities.map((cap) => (
            <span
              key={cap}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold text-neutral-400 transition-all duration-200 hover:border-white/25 hover:text-white cursor-default"
            >
              {cap}
            </span>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mt-14 flex w-full flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/auth/register"
            className="min-w-[200px] rounded-2xl bg-emerald-400 px-8 py-4 text-sm font-bold text-black transition-transform duration-150 hover:scale-105 active:scale-95 shadow-[0_0_32px_rgba(52,211,153,0.3)]"
          >
            Start Analyzing
          </Link>
          <Link
            href="/auth/login"
            className="min-w-[200px] rounded-2xl border border-white/15 px-8 py-4 text-sm font-bold text-white transition-all duration-150 hover:bg-white/[0.07] hover:border-white/25"
          >
            Sign In
          </Link>
        </motion.div>

        {/* UX hint */}
        <p className="mt-16 text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-600">
          ctrl+v to paste screenshots
        </p>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 h-32 w-full bg-gradient-to-t from-neutral-950 to-transparent" />
    </section>
  );
}
