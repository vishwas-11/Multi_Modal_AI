// import type { Metadata } from 'next';
// import { IBM_Plex_Mono, Syne } from 'next/font/google';
// import './globals.css';

// const syne = Syne({
//   variable: '--font-heading',
//   subsets: ['latin'],
// });

// const ibmPlexMono = IBM_Plex_Mono({
//   variable: '--font-terminal',
//   subsets: ['latin'],
//   weight: ['400', '500', '600', '700'],
// });

// export const metadata: Metadata = {
//   title: 'ModalAI',
//   description: 'Multimodal intelligence for images, video, audio, and documents.',
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html
//       lang="en"
//       className={`${syne.variable} ${ibmPlexMono.variable} h-full antialiased`}
//     >
//       <body className="min-h-full flex flex-col bg-[var(--bg-void)] text-[var(--text-primary)]">
//         {children}
//       </body>
//     </html>
//   );
// }









import type { Metadata } from 'next';
import { IBM_Plex_Mono, Syne } from 'next/font/google';
import './globals.css';

const syne = Syne({
  variable: '--font-heading',
  subsets: ['latin'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-terminal',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'ModalAI',
  description: 'Multimodal intelligence for images, video, audio, and documents.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${ibmPlexMono.variable} h-full w-full antialiased`}
    >
      <body className="flex min-h-full w-full flex-col overflow-x-hidden bg-neutral-950 text-white">
        {children}
      </body>
    </html>
  );
}
