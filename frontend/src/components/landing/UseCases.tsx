// 'use client';
// import { motion } from 'framer-motion';
// import Link from 'next/link';

// const useCases = [
//   {
//     label: 'Product Analysis',
//     query: '"List all visible features. What material is this made of?"',
//     mediaType: 'Image',
//   },
//   {
//     label: 'Video Summarization',
//     query: '"Summarize key steps. Generate table of contents with timestamps."',
//     mediaType: 'Video',
//   },
//   {
//     label: 'Invoice Extraction',
//     query: '"Extract all line items as JSON. What is the total amount?"',
//     mediaType: 'Document',
//   },
//   {
//     label: 'Meeting Recording',
//     query: '"What were the action items? Summarize decisions made."',
//     mediaType: 'Audio',
//   },
// ];

// export default function UseCases() {
//   return (
//     <section className="relative px-4 pb-24 pt-8 md:px-6 md:pb-28 md:pt-10">
//       <div className="section-shell max-w-6xl">
//         <div className="glass-panel rounded-[2.5rem] overflow-hidden px-6 py-8 md:px-10 md:py-12 lg:px-14">
//           <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
            
//             {/* Left Column: Example Queries */}
//             <div className="flex flex-col">
//               <motion.div
//                 initial={{ opacity: 0, y: 16 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }}
//                 className="mb-10 flex flex-col items-center text-center lg:items-start lg:text-left"
//               >
//                 <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border-dim)] bg-white/5 px-4 py-1.5 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
//                   <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
//                   Example Queries
//                 </div>
//                 <h2 className="max-w-[15ch] font-display text-4xl font-semibold leading-[0.95] tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
//                   Prompts that feel like actual work.
//                 </h2>
//                 <p className="mt-6 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
//                   Shaped like real asks from product, ops, and research teams, 
//                   making the interface useful before you even upload a file.
//                 </p>
//               </motion.div>

//               <div className="grid gap-4">
//                 {useCases.map((useCase, i) => (
//                   <motion.div
//                     key={useCase.label}
//                     initial={{ opacity: 0, x: -12 }}
//                     whileInView={{ opacity: 1, x: 0 }}
//                     viewport={{ once: true }}
//                     transition={{ delay: i * 0.08 }}
//                     className="group relative overflow-hidden rounded-[24px] border border-[var(--border-dim)] bg-black/20 p-5 transition-all duration-300 hover:border-[var(--border-subtle)] hover:bg-[var(--bg-raised)]"
//                   >
//                     {/* Left Accent Border on Hover */}
//                     <div className="absolute left-0 top-0 h-full w-1 bg-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100" />
                    
//                     <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
//                       <div className="flex shrink-0 items-center gap-3 sm:w-36 sm:flex-col sm:items-start sm:gap-1">
//                         <span className="inline-flex rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
//                           {useCase.mediaType}
//                         </span>
//                         <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-dim)]">
//                           Query {String(i + 1).padStart(2, '0')}
//                         </span>
//                       </div>
                      
//                       <div className="flex-1">
//                         <p className="mb-1 font-display text-xl font-bold text-[var(--text-primary)]">
//                           {useCase.label}
//                         </p>
//                         <p className="text-sm italic leading-relaxed text-[var(--text-secondary)] opacity-80">
//                           {useCase.query}
//                         </p>
//                       </div>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </div>

//             {/* Right Column: Operator Flow Sidebar */}
//             <motion.aside
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ delay: 0.2 }}
//               className="relative flex flex-col rounded-[2rem] border border-[var(--border-dim)] bg-gradient-to-b from-[var(--accent)]/10 via-[var(--bg-surface)]/50 to-[var(--bg-void)] p-8 shadow-2xl"
//             >
//               <div className="mb-8">
//                 <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] font-bold">Operator Flow</p>
//                 <h3 className="mt-4 font-display text-3xl font-semibold leading-[1.1] text-[var(--text-primary)]">
//                   Upload. Ask.<br />Compare. Export.
//                 </h3>
//               </div>

//               <div className="space-y-4">
//                 {[
//                   { num: '01', text: 'Drop in any media file with zero setup screens.' },
//                   { num: '02', text: 'Ask questions in plain language for structured answers.' },
//                   { num: '03', text: 'Turn findings into Markdown or HTML instantly.' }
//                 ].map((step) => (
//                   <div key={step.num} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]">
//                     <p className="text-[10px] font-bold text-[var(--text-muted)]">{step.num}</p>
//                     <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
//                       {step.text}
//                     </p>
//                   </div>
//                 ))}
//               </div>

//               <div className="mt-10 border-t border-[var(--border-dim)] pt-8">
//                 <p className="mb-6 text-xs text-center lg:text-left leading-relaxed text-[var(--text-muted)] uppercase tracking-widest">
//                   Ready to deploy?
//                 </p>
//                 <Link
//                   href="/auth/register"
//                   className="ui-button ui-button-lg glow-accent w-full bg-[var(--accent)] text-black hover:scale-[1.02] active:scale-[0.98]"
//                 >
//                   Open Interface
//                 </Link>
//               </div>
//             </motion.aside>

//           </div>

//           {/* Footer inside the shell */}
//           <div className="mt-20 flex flex-col gap-6 border-t border-[var(--border-dim)] pt-10 md:flex-row md:items-center md:justify-between">
//             <div className="flex items-center justify-center gap-3 md:justify-start">
//               <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10">
//                 <div className="h-2.5 w-2.5 rounded-sm bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
//               </div>
//               <span className="font-display text-lg font-black tracking-[0.25em] text-[var(--text-primary)]">
//                 MODAL<span className="text-[var(--accent)]">AI</span>
//               </span>
//             </div>
//             <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--text-dim)]">
//               Powered by Gemini 1.5 Pro + Groq Whisper
//             </p>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }










'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

const useCases = [
  {
    label: 'Product Analysis',
    query: 'List all visible features. What material is this made of?',
    mediaType: 'Image',
  },
  {
    label: 'Video Summarization',
    query: 'Summarize key steps. Generate table of contents with timestamps.',
    mediaType: 'Video',
  },
  {
    label: 'Invoice Extraction',
    query: 'Extract all line items as JSON. What is the total amount?',
    mediaType: 'Document',
  },
  {
    label: 'Meeting Recording',
    query: 'What were the action items? Summarize decisions made.',
    mediaType: 'Audio',
  },
];

export default function UseCases() {
  return (
    <section className="bg-neutral-950 py-32">
      <div className="section-shell">

        <div className="grid gap-14 lg:grid-cols-[1fr_380px] lg:gap-16">

          {/* ── Left: Example Queries ── */}
          <div className="flex flex-col">

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="mb-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Example Queries
              </div>
              <h2 className="font-display text-5xl font-bold leading-[1.0] tracking-[-0.04em] text-white md:text-6xl">
                Prompts that feel<br />like actual work.
              </h2>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-neutral-400">
                Shaped like real asks from product, ops, and research teams —
                making the interface useful before you even upload a file.
              </p>
            </motion.div>

            {/* Query cards */}
            <div className="flex flex-col gap-4">
              {useCases.map((useCase, i) => (
                <motion.div
                  key={useCase.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] p-6 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/15"
                >
                  {/* Accent left bar on hover */}
                  <div className="absolute left-0 top-0 h-full w-[3px] bg-emerald-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* Type + number */}
                    <div className="flex shrink-0 items-center gap-3 sm:w-32 sm:flex-col sm:items-start sm:gap-1.5">
                      <span className="rounded-full border border-emerald-400/25 bg-emerald-400/8 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        {useCase.mediaType}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                        Query {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <p className="mb-1.5 text-lg font-bold text-white">{useCase.label}</p>
                      <p className="text-sm italic leading-relaxed text-neutral-400">
                        &ldquo;{useCase.query}&rdquo;
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Right: Operator Flow ── */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-emerald-950/20 via-neutral-900/30 to-neutral-950 p-8 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">
                Operator Flow
              </p>
              <h3 className="mt-4 font-display text-3xl font-bold leading-[1.1] text-white">
                Upload. Ask.<br />Compare. Export.
              </h3>
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-3">
              {[
                { num: '01', text: 'Drop in any media file with zero setup screens or configuration.' },
                { num: '02', text: 'Ask questions in plain language and receive structured answers.' },
                { num: '03', text: 'Turn findings into Markdown or HTML export instantly.' },
              ].map((step) => (
                <div
                  key={step.num}
                  className="rounded-2xl border border-white/6 bg-white/[0.03] p-5 transition-colors duration-200 hover:bg-white/[0.05]"
                >
                  <p className="text-[10px] font-bold text-neutral-600">{step.num}</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">{step.text}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-auto border-t border-white/8 pt-8 mt-10">
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
                Ready to deploy?
              </p>
              <Link
                href="/auth/register"
                className="block w-full rounded-2xl bg-emerald-400 py-4 text-center text-sm font-bold text-black shadow-[0_0_28px_rgba(52,211,153,0.25)] transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
              >
                Open Interface
              </Link>
            </div>
          </motion.aside>
        </div>

        {/* Footer strip */}
        <div className="mt-24 flex flex-col items-center gap-4 border-t border-white/8 pt-10 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10">
              <div className="h-2.5 w-2.5 rounded-sm bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
            </div>
            <span className="font-display text-lg font-black tracking-[0.22em] text-white">
              MODAL<span className="text-emerald-400">AI</span>
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600">
            Powered by Gemini 1.5 Pro + Groq Whisper
          </p>
        </div>
      </div>
    </section>
  );
}
