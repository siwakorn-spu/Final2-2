"use client"

import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { ChevronDown } from "lucide-react"

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Track scroll progress within the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Start with normal scale, mask image scales up up to 4x to create immersive zoom
  const imageScale = useTransform(scrollYProgress, [0, 0.7], [1, 5])
  const imageOpacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 1, 0.5])
  
  // Text and actions appear AFTER zooming in
  const textOpacity = useTransform(scrollYProgress, [0.7, 1], [0, 1])
  const textY = useTransform(scrollYProgress, [0.7, 1], [50, 0])
  const actionPointerEvents = useTransform(scrollYProgress, v => v > 0.8 ? "auto" : "none")
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  return (
    <div ref={containerRef} className="relative w-full h-[300vh] bg-[#3B2A1A] font-['DM_Sans']">
      
      {/* Sticky view that stays on screen while user scrolls the 300vh container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center">
        
        {/* Navbar */}
        <nav className="absolute top-0 w-full z-50">
          <div className="mx-auto max-w-[1400px] px-8 py-6 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link href="/" className="font-['Playfair_Display'] text-2xl font-bold text-white drop-shadow-md">
                Smart Persona
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex items-center gap-6 md:gap-12"
            >
              <Link href="/community" className="hidden md:block text-[11px] uppercase tracking-[0.08em] text-white/90 hover:text-white transition-colors relative z-50 drop-shadow">
                Community
              </Link>
              <Link href="/auth/login" className="text-[11px] uppercase tracking-[0.08em] text-white/90 hover:text-white transition-colors relative z-50 drop-shadow">
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="border border-[#D4B896] bg-black/20 backdrop-blur-sm px-6 py-2 text-[11px] uppercase tracking-[0.08em] text-[#D4B896] hover:bg-[#D4B896] hover:text-[#3B2A1A] transition-all rounded relative z-50"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </nav>

        {/* Central Zooming Image */}
        <motion.div 
          style={{ scale: imageScale, opacity: imageOpacity }}
          className="absolute inset-0 flex items-center justify-center z-10 origin-center pointer-events-none"
        >
          {/* A rounded image container that looks like a frame at first and fills the screen as it scales */}
          <div className="relative w-[85vw] h-[65vh] max-w-6xl md:h-[75vh] rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80" 
              className="w-full h-full object-cover"
              alt="Professional Environment"
            />
            {/* Dark gradient overlay to make text pop */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            <div className="absolute inset-0 bg-[#3B2A1A]/20 mix-blend-multiply" />
          </div>
        </motion.div>

        {/* Text over the image */}
        <motion.div 
          style={{ opacity: textOpacity, y: textY }}
          className="relative z-20 flex flex-col items-center justify-center text-center px-6 pointer-events-none mt-20"
        >
          <h1 className="font-['Playfair_Display'] text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.1] tracking-tight text-white mb-6 drop-shadow-xl">
            Build Your Professional
            <br />
            <span className="text-[#D4B896] italic">Identity</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 drop-shadow-md">
            Create stunning professional profiles, connect with opportunities, and join a vibrant community of professionals.
          </p>
        </motion.div>

        {/* Actions - tied to text opacity */}
        <motion.div 
          style={{ opacity: textOpacity, pointerEvents: actionPointerEvents as any }}
          className="absolute bottom-[20%] left-0 right-0 w-full flex flex-col sm:flex-row justify-center gap-4 z-50 px-6"
        >
          <Link
            href="/auth/sign-up"
            className="bg-[#A07850] text-white px-8 py-4 text-[11px] uppercase tracking-[0.1em] font-semibold hover:bg-[#7A5C38] transition-colors rounded shadow-lg hover:shadow-xl hover:-translate-y-1 transform duration-300 text-center"
          >
            Get Started Free
          </Link>
          <Link
            href="/auth/login"
            className="border border-white/50 text-white bg-white/10 backdrop-blur-md px-8 py-4 text-[11px] uppercase tracking-[0.1em] font-semibold hover:bg-white hover:text-[#3B2A1A] transition-all rounded shadow-md hover:shadow-lg hover:-translate-y-1 transform duration-300 text-center"
          >
            Sign In
          </Link>
        </motion.div>

        {/* Scroll Instruction */}
        <motion.div 
          style={{ opacity: scrollOpacity }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 text-white/70 pointer-events-none"
        >
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
            <span>Scroll to Zoom</span>
            <ChevronDown className="w-3 h-3 animate-bounce" />
          </div>
        </motion.div>

      </div>
    </div>
  )
}
