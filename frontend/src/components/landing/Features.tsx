// 'use client';
// import { motion } from 'framer-motion';

// const features = [
//   { id: '01', label: 'Image', title: 'Visual Q&A', desc: 'Interrogate images with natural language. Identify objects and charts.', detail: 'JPEG / PNG / WebP / GIF' },
//   { id: '02', label: 'Video', title: 'Video Intelligence', desc: 'Scene detection and temporal Q&A across extraction strategies.', detail: 'MP4 / WebM / MOV - 100MB' },
//   { id: '03', label: 'Audio', title: 'Transcription', desc: 'Whisper-powered diarization and action item extraction.', detail: 'MP3 / WAV / M4A - 50MB' },
//   { id: '04', label: 'Docs', title: 'Document OCR', desc: 'Extract structured data from invoices and forms with multi-page context.', detail: 'PDF / Scanned Images' },
//   { id: '05', label: 'Compare', title: 'Comparison', desc: 'Side-by-side analysis of up to 10 media files simultaneously.', detail: 'Multi-file context' },
//   { id: '06', label: 'Stream', title: 'Streaming', desc: 'Real-time token responses via SSE with full history management.', detail: 'Markdown / HTML' },
// ];

// export default function Features() {
//   return (
//     <section className="py-24">
//       <div className="section-shell">
//         <div className="glass-panel rounded-[2.5rem] p-8 md:p-12">
//           <div className="grid gap-16 lg:grid-cols-[320px_1fr]">
//             <div className="space-y-6">
//               <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--accent)]">
//                 <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
//                 Capabilities
//               </div>
//               <h2 className="font-display text-5xl font-bold leading-none tracking-tight">
//                 Built for every media surface.
//               </h2>
//               <p className="text-[var(--text-secondary)]">
//                 One workspace for inspection, reasoning, and extraction.
//               </p>
//               <div className="flex gap-4">
//                 <div className="flex-1 rounded-2xl border border-[var(--border-dim)] p-4">
//                   <div className="text-[10px] text-[var(--text-muted)] uppercase">Workflows</div>
//                   <div className="text-3xl font-bold">6</div>
//                 </div>
//                 <div className="flex-1 rounded-2xl border border-[var(--border-dim)] p-4">
//                   <div className="text-[10px] text-[var(--text-muted)] uppercase">Types</div>
//                   <div className="text-3xl font-bold">4</div>
//                 </div>
//               </div>
//             </div>

//             <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
//               {features.map((f) => (
//                 <div key={f.id} className="group relative rounded-3xl border border-[var(--border-dim)] bg-black/20 p-6 transition-all hover:bg-[var(--bg-surface)] hover:border-[var(--border-subtle)]">
//                   <div className="mb-6 flex justify-between">
//                     <span className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-1 text-[10px] uppercase text-[var(--accent)]">{f.label}</span>
//                     <span className="text-[10px] text-[var(--text-dim)]">{f.id}</span>
//                   </div>
//                   <h3 className="mb-2 text-xl font-bold">{f.title}</h3>
//                   <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{f.desc}</p>
//                   <div className="mt-6 border-t border-[var(--border-dim)] pt-4 text-[9px] uppercase tracking-tighter text-[var(--text-muted)]">
//                     {f.detail}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }







'use client';
import { motion } from 'framer-motion';

const features = [
  { id: '01', label: 'Image',   title: 'Visual Q&A',        desc: 'Interrogate images with natural language. Identify objects, charts, and patterns.',    detail: 'JPEG / PNG / WebP / GIF' },
  { id: '02', label: 'Video',   title: 'Video Intelligence', desc: 'Scene detection and temporal Q&A across multiple extraction strategies.',              detail: 'MP4 / WebM / MOV — 100 MB' },
  { id: '03', label: 'Audio',   title: 'Transcription',      desc: 'Whisper-powered diarization and action item extraction from any recording.',           detail: 'MP3 / WAV / M4A — 50 MB' },
  { id: '04', label: 'Docs',    title: 'Document OCR',       desc: 'Extract structured data from invoices and forms with full multi-page context.',         detail: 'PDF / Scanned Images' },
  { id: '05', label: 'Compare', title: 'Comparison',         desc: 'Side-by-side analysis of up to 10 media files simultaneously in one workspace.',       detail: 'Multi-file context' },
  { id: '06', label: 'Stream',  title: 'Streaming',          desc: 'Real-time token responses via SSE with full conversation history management.',          detail: 'Markdown / HTML' },
];

export default function Features() {
  return (
    <section className="bg-neutral-950 py-32">
      <div className="section-shell">

        {/* Section header */}
        <div className="mb-16 grid gap-12 lg:grid-cols-[340px_1fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Capabilities
            </div>
            <h2 className="font-display text-5xl font-bold leading-[1.0] tracking-[-0.04em] text-white md:text-6xl">
              Built for every<br />media surface.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-neutral-400">
              One workspace for inspection, reasoning, and extraction across all media types.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-4 lg:justify-end">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-6 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Workflows</p>
              <p className="mt-2 text-5xl font-extrabold text-white">6</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-6 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Types</p>
              <p className="mt-2 text-5xl font-extrabold text-white">4</p>
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="group relative flex flex-col rounded-3xl border border-white/8 bg-white/[0.025] p-7 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/15"
            >
              {/* Top row */}
              <div className="mb-7 flex items-center justify-between">
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/8 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {f.label}
                </span>
                <span className="text-[10px] font-medium text-neutral-600">{f.id}</span>
              </div>

              <h3 className="mb-3 text-xl font-bold text-white">{f.title}</h3>
              <p className="flex-1 text-sm leading-relaxed text-neutral-400">{f.desc}</p>

              <div className="mt-8 border-t border-white/8 pt-5 text-[9px] font-bold uppercase tracking-widest text-neutral-600">
                {f.detail}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
