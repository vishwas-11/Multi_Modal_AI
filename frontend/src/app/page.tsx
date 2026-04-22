// import Navbar from '@/components/layout/Navbar';
// import Hero from '@/components/landing/Hero';
// import Features from '@/components/landing/Features';
// import UseCases from '@/components/landing/UseCases';

// const navItems = [
//   {
//     label: 'Capabilities',
//     bgColor: '#0d1117',
//     textColor: '#8b96a8',
//     links: [
//       { label: 'Image Analysis', href: '/auth/register', ariaLabel: 'Image analysis' },
//       { label: 'Video Intelligence', href: '/auth/register', ariaLabel: 'Video intelligence' },
//       { label: 'Audio Transcription', href: '/auth/register', ariaLabel: 'Audio transcription' },
//     ],
//   },
//   {
//     label: 'Use Cases',
//     bgColor: '#0d1117',
//     textColor: '#8b96a8',
//     links: [
//       { label: 'Document Extraction', href: '/auth/register', ariaLabel: 'Document extraction' },
//       { label: 'Meeting Analysis', href: '/auth/register', ariaLabel: 'Meeting analysis' },
//       { label: 'Multi-File Compare', href: '/auth/register', ariaLabel: 'Multi-file compare' },
//     ],
//   },
//   {
//     label: 'Get Started',
//     bgColor: '#0a1a12',
//     textColor: '#00e5a0',
//     links: [
//       { label: 'Register', href: '/auth/register', ariaLabel: 'Create account' },
//       { label: 'Login', href: '/auth/login', ariaLabel: 'Sign in' },
//     ],
//   },
// ];

// export default function LandingPage() {
//   return (
//     <main className="relative isolate min-h-screen overflow-hidden bg-(--bg-void)">
//       <div className="pointer-events-none absolute inset-0 grid-overlay opacity-30" />
//       <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_32%),radial-gradient(circle_at_20%_20%,rgba(0,229,160,0.08),transparent_22%)]" />
//       <Navbar items={navItems} />
//       <Hero />
//       <Features />
//       <UseCases />
//     </main>
//   );
// }










import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import UseCases from '@/components/landing/UseCases';

const navItems = [
  {
    label: 'Capabilities',
    bgColor: '#0d1117',
    textColor: '#8b96a8',
    links: [
      { label: 'Image Analysis',     href: '/auth/register', ariaLabel: 'Image analysis' },
      { label: 'Video Intelligence', href: '/auth/register', ariaLabel: 'Video intelligence' },
      { label: 'Audio Transcription',href: '/auth/register', ariaLabel: 'Audio transcription' },
    ],
  },
  {
    label: 'Use Cases',
    bgColor: '#0d1117',
    textColor: '#8b96a8',
    links: [
      { label: 'Document Extraction', href: '/auth/register', ariaLabel: 'Document extraction' },
      { label: 'Meeting Analysis',    href: '/auth/register', ariaLabel: 'Meeting analysis' },
      { label: 'Multi-File Compare',  href: '/auth/register', ariaLabel: 'Multi-file compare' },
    ],
  },
  {
    label: 'Get Started',
    bgColor: '#0a1a12',
    textColor: '#34d399',
    links: [
      { label: 'Register', href: '/auth/register', ariaLabel: 'Create account' },
      { label: 'Login',    href: '/auth/login',     ariaLabel: 'Sign in' },
    ],
  },
];

export default function LandingPage() {
  return (
    <main className="relative isolate min-h-screen w-full overflow-hidden bg-neutral-950">
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.06),transparent_40%)]" />

      <Navbar items={navItems} />
      <Hero />
      <Features />
      <UseCases />
    </main>
  );
}
