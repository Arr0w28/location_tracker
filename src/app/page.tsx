'use client'

import { motion, Variants } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 100,
    },
  },
}

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FAF8F5] text-[#2D2C2A] selection:bg-[#C87A53]/10 selection:text-[#C87A53]">
      {/* Background soft light blobs */}
      <div className="absolute top-[10%] left-[5%] -z-10 w-[40vw] h-[40vw] rounded-full bg-[#C87A53]/3 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[5%] -z-10 w-[35vw] h-[35vw] rounded-full bg-[#7A8271]/4 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between border-b border-[#ECE7E0]/60">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-serif text-2xl tracking-wide text-[#2D2C2A] font-semibold">集む — Atsumu</span>
        </Link>
        <nav className="flex items-center space-x-8 text-sm font-medium text-[#76736F]">
          <a href="#philosophy" className="hover:text-[#2D2C2A] transition-colors duration-300">Philosophy</a>
          <a href="#features" className="hover:text-[#2D2C2A] transition-colors duration-300">Experience</a>
          <Link href="/login" className="bg-[#2D2C2A] hover:bg-[#C87A53] text-[#FAF8F5] px-5 py-2 rounded-full transition-all duration-300 text-xs font-semibold shadow-sm hover:shadow-md">
            Enter Sanctuary
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-32 flex flex-col items-center text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl space-y-8"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 bg-[#F3EFE9] px-3 py-1 rounded-full text-xs font-semibold text-[#7A8271] tracking-wider uppercase">
            <span>A Mindful space for travel reflection</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-serif text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.1] tracking-tight text-[#2D2C2A]"
          >
            A quiet sanctuary for your <span className="italic text-[#C87A53]">journeys</span>.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-[#76736F] leading-relaxed max-w-2xl mx-auto font-light"
          >
            Trace your wanderings on a tranquil 3D globe. Upload your Snapchat map history to generate a beautiful, private travel journal of your life&apos;s paths.
          </motion.p>

          <motion.div variants={itemVariants} className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full sm:w-auto bg-[#C87A53] hover:bg-[#b06742] text-[#FAF8F5] px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide shadow-lg hover:shadow-xl transition-all duration-500 ease-out"
            >
              Begin Your Reflection
            </button>
            <a
              href="#philosophy"
              className="w-full sm:w-auto border border-[#ECE7E0] hover:bg-[#F3EFE9] text-[#2D2C2A] px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300"
            >
              Read Philosophy
            </a>
          </motion.div>
        </motion.div>

        {/* Decorative Minimalist Art Element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 w-full max-w-4xl aspect-[2/1] rounded-2xl border border-[#ECE7E0] bg-white p-4 shadow-xl shadow-[#ECE7E0]/30 flex items-center justify-center overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#FAF8F5]/40 pointer-events-none z-10" />

          {/* Simulated Zen Map View */}
          <div className="w-full h-full rounded-xl bg-[#FAF8F5] relative flex items-center justify-center">
            {/* Minimalist Globe Art */}
            <div className="w-64 h-64 rounded-full border border-[#ECE7E0]/80 relative flex items-center justify-center">
              <div className="absolute w-56 h-56 rounded-full border border-[#ECE7E0]/60 border-dashed" />
              <div className="absolute w-44 h-44 rounded-full border border-[#ECE7E0]/30" />

              {/* Pulsing Terracotta Pin */}
              <div className="absolute top-1/4 right-1/3 flex flex-col items-center">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C87A53] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C87A53]"></span>
                </span>
                <span className="text-[10px] font-mono mt-1 text-[#7A8271] bg-white px-2 py-0.5 rounded border border-[#ECE7E0] shadow-sm">Udaipur, IN</span>
              </div>

              {/* Pulsing Sage Pin */}
              <div className="absolute bottom-1/3 left-1/4 flex flex-col items-center">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7A8271] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#7A8271]"></span>
                </span>
                <span className="text-[10px] font-mono mt-1 text-[#C87A53] bg-white px-2 py-0.5 rounded border border-[#ECE7E0] shadow-sm">Manali, IN</span>
              </div>

              {/* Flowing Path */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 256 256">
                <path
                  d="M 170 64 Q 128 128 64 170"
                  fill="none"
                  stroke="#7A8271"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="opacity-75"
                />
              </svg>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-24 bg-[#F3EFE9]/40 border-y border-[#ECE7E0]">
        <div className="mx-auto max-w-4xl px-6 grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-5 space-y-4">
            <h2 className="font-serif text-sm tracking-widest text-[#7A8271] uppercase font-bold">Wabi-Sabi Spirit</h2>
            <h3 className="font-serif text-3xl md:text-4xl text-[#2D2C2A] font-light leading-snug">
              Quiet reflection over endless noise.
            </h3>
            <div className="h-[2px] w-16 bg-[#C87A53]/60 mt-2" />
          </div>
          <div className="md:col-span-7 text-[#76736F] leading-relaxed font-light space-y-6">
            <p>
              In a digital world that demands constant sharing and immediate publication, <em>Atsumu</em> offers a peaceful retreat. We believe your travel memories are meant to be reflected upon, not performed.
            </p>
            <p>
              By fusing the Japanese appreciation for transience (Wabi-Sabi) with the Scandinavian warmth of gathering (Hygge), we created a quiet, private visual log. An organic 3D globe where you can watch your life&apos;s paths weave together like threads in a textile sanctuary.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="font-serif text-sm tracking-widest text-[#7A8271] uppercase font-bold">The Experience</h2>
          <h3 className="font-serif text-4xl text-[#2D2C2A] font-normal">Designed for intentional reflection.</h3>
          <p className="text-[#76736F] font-light">Every element in the sanctuary exists to support your emotional equilibrium.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-2xl border border-[#ECE7E0]/60 hover:shadow-lg hover:border-[#C87A53]/30 transition-all duration-500 ease-out space-y-6">
            <h4 className="font-serif text-xl font-medium text-[#2D2C2A]">Interactive 3D Globe</h4>
            <p className="text-[#76736F] text-sm font-light leading-relaxed">
              Visualize your flight arcs and travel coordinates on an elegant, tactile night-sky globe that rotates with gentle inertia.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-2xl border border-[#ECE7E0]/60 hover:shadow-lg hover:border-[#7A8271]/30 transition-all duration-500 ease-out space-y-6">
            <h4 className="font-serif text-xl font-medium text-[#2D2C2A]">Wabi-Sabi Notes</h4>
            <p className="text-[#76736F] text-sm font-light leading-relaxed">
              Pen down thoughts, feelings, and details of each location. Auto-saves cleanly as you type so you can write without friction.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-2xl border border-[#ECE7E0]/60 hover:shadow-lg hover:border-[#C87A53]/30 transition-all duration-500 ease-out space-y-6">
            <h4 className="font-serif text-xl font-medium text-[#2D2C2A]">Polaroid Previews</h4>
            <p className="text-[#76736F] text-sm font-light leading-relaxed">
              Hover over pins to preview moments as hand-developed Polaroid snapshots containing place details and your custom uploads.
            </p>
          </div>
        </div>
      </section>

      {/* Ingestion Call-to-action */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="bg-white rounded-3xl border border-[#ECE7E0]/80 p-10 md:p-16 text-center space-y-8 relative overflow-hidden shadow-xl shadow-[#ECE7E0]/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C87A53]/5 rounded-full blur-2xl pointer-events-none" />

          <h2 className="font-serif text-sm tracking-widest text-[#7A8271] uppercase font-bold">Natural Invitation</h2>
          <h3 className="font-serif text-3xl md:text-5xl text-[#2D2C2A] font-light leading-tight">
            Step into your <span className="italic text-[#C87A53]">travel sanctuary</span>.
          </h3>
          <p className="text-[#76736F] max-w-xl mx-auto font-light leading-relaxed">
            Begin the reflection. It takes seconds to parse your location history and watch your globe come to life.
          </p>

          <div className="pt-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-[#2D2C2A] hover:bg-[#C87A53] text-[#FAF8F5] px-10 py-4 rounded-full text-sm font-semibold tracking-wide transition-all duration-500 ease-out shadow-md"
            >
              Enter Sanctuary
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F3EFE9]/30 border-t border-[#ECE7E0]/60 py-12">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between text-xs text-[#76736F] space-y-4 md:space-y-0">
          <p className="font-light">© 2026 Atsumu. Made with warm Scandinavian hygge & Japanese Zen.</p>
          <div className="flex space-x-6">
            <a href="#philosophy" className="hover:text-[#2D2C2A] transition-colors duration-300">Philosophy</a>
            <a href="#features" className="hover:text-[#2D2C2A] transition-colors duration-300">Features</a>
            <Link href="/login" className="hover:text-[#2D2C2A] transition-colors duration-300">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
