"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search, MapPin, ChevronDown, ChevronRight, BedDouble, Bath, Maximize
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion"

const propertyTypes = ["House", "Apartment", "Villa", "Townhouse", "Loft", "Cabin"] as const

const tourSlides = [
  {
    image: "/house-3.jpg",
    title: "Modern Minimalist Villa",
    location: "Islamabad, F-7",
    price: "PKR 4.5 Cr",
    beds: 5, baths: 4, sqft: "4,200",
    tag: "Featured",
  },
  {
    image: "/house-3.jpg",
    title: "Luxury Lake View Estate",
    location: "Lahore, DHA Phase 6",
    price: "PKR 7.2 Cr",
    beds: 7, baths: 6, sqft: "8,500",
    tag: "Premium",
  },
  {
    image: "/house-3.jpg",
    title: "Contemporary Urban Loft",
    location: "Karachi, Clifton",
    price: "PKR 2.8 Cr",
    beds: 3, baths: 2, sqft: "2,400",
    tag: "New",
  },
]

/* ─── Seeded random to avoid hydration mismatch ─── */
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

/* ─── Cinematic Particle Layer ─── */
function CinematicParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => {
        const r1 = seededRandom(i * 7 + 1)
        const r2 = seededRandom(i * 7 + 2)
        const r3 = seededRandom(i * 7 + 3)
        const r4 = seededRandom(i * 7 + 4)
        const r5 = seededRandom(i * 7 + 5)
        const r6 = seededRandom(i * 7 + 6)
        const r7 = seededRandom(i * 7 + 7)
        const r8 = seededRandom(i * 7 + 8)

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: r1 * 3 + 1,
              height: r2 * 3 + 1,
              left: `${r3 * 100}%`,
              top: `${r4 * 100}%`,
              background: `rgba(255, 255, 255, ${r5 * 0.3 + 0.1})`,
            }}
            animate={{
              y: [0, -(r6 * 100 + 50)],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: r7 * 6 + 4,
              repeat: Infinity,
              delay: r8 * 5,
              ease: "easeOut",
            }}
          />
        )
      })}
    </div>
  )
}

/* ─── Mouse-reactive Parallax ─── */
function useParallax(strength: number = 20) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const x = useSpring(useTransform(mouseX, [-0.5, 0.5], [-strength, strength]), { stiffness: 80, damping: 20 })
  const y = useSpring(useTransform(mouseY, [-0.5, 0.5], [-strength, strength]), { stiffness: 80, damping: 20 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseX.set(e.clientX / window.innerWidth - 0.5)
    mouseY.set(e.clientY / window.innerHeight - 0.5)
  }, [mouseX, mouseY])

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [handleMouseMove])

  return { x, y }
}

/* ─── Cinematic Background with Ken Burns ─── */
function HeroBackground({ activeSlide }: { activeSlide: number }) {
  const { x, y } = useParallax(30)

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={activeSlide}
          initial={{ opacity: 0, scale: 1.15 }}
          animate={{ opacity: 1, scale: 1.08 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.2 },
            scale: { duration: 8, ease: "linear" },
          }}
          className="absolute inset-0"
        >
          <motion.img
            src={tourSlides[activeSlide].image}
            alt={tourSlides[activeSlide].title}
            className="h-full w-full object-cover"
            style={{ x, y }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Multi-layer cinematic overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/50 to-black/20" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-transparent to-transparent" />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </div>
  )
}

/* ─── Slide Info Overlay ─── */
function SlideInfo({ slide, index }: { slide: typeof tourSlides[0]; index: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
        className="hidden w-[380px] lg:block"
      >
        <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {slide.tag}
              </span>
              <h3 className="mt-2 text-lg font-bold text-white">{slide.title}</h3>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-white/60">
                <MapPin className="h-3 w-3" /> {slide.location}
              </p>
            </div>
            <p className="text-right text-lg font-bold text-orange-400">{slide.price}</p>
          </div>
          <div className="mt-4 flex items-center gap-5 border-t border-white/10 pt-3">
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <BedDouble className="h-3.5 w-3.5" /> {slide.beds} Beds
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <Bath className="h-3.5 w-3.5" /> {slide.baths} Baths
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <Maximize className="h-3.5 w-3.5" /> {slide.sqft} sqft
            </span>
            <button className="ml-auto flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20">
              View Tour <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Main Hero ─── */
export function EstateHero() {
  const router = useRouter()
  const [mode, setMode] = useState<"buy" | "rent">("buy")
  const [city, setCity] = useState("")
  const [type, setType] = useState("")
  const [activeSlide, setActiveSlide] = useState(0)

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % tourSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  function handleSearch() {
    const params = new URLSearchParams()
    params.set("category", mode)
    if (city.trim()) params.set("city", city.trim())
    if (type) params.set("type", type)
    router.push(`/listings?${params.toString()}`)
  }

  return (
    <section className="relative h-screen overflow-hidden bg-black">
      {/* Cinematic background with Ken Burns effect */}
      <HeroBackground activeSlide={activeSlide} />

      {/* Floating particles */}
      <CinematicParticles />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-16 md:px-8 lg:pb-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          {/* Left: Headline + Search */}
          <div className="max-w-2xl">
            {/* Kicker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[11px] font-medium tracking-wide text-white/70">
                #1 Real Estate Platform in Pakistan
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Discover Properties
              <br />
              That Fit{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 bg-clip-text text-transparent italic">
                  Your Life.
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.4, duration: 0.6, ease: "easeOut" }}
                  className="absolute -bottom-1 left-0 h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                />
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-5 max-w-md text-sm leading-relaxed text-white/50 sm:text-base"
            >
              Explore verified listings, neighborhood insights, and smart tools designed to guide every step of your real estate journey.
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="mt-7"
            >
              <form
                onSubmit={(e) => { e.preventDefault(); handleSearch() }}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-2 backdrop-blur-xl sm:flex-row sm:items-center"
              >
                {/* Type */}
                <div className="relative flex items-center gap-2 rounded-xl bg-white/5 px-3 py-3 sm:min-w-[130px]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Type</span>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full appearance-none bg-transparent text-sm font-medium text-white outline-none"
                  >
                    <option value="" className="bg-gray-900">Any</option>
                    {propertyTypes.map((t) => (
                      <option key={t} value={t} className="bg-gray-900">{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none h-3.5 w-3.5 shrink-0 text-white/30" />
                </div>

                {/* Mode toggle */}
                <div className="flex items-center rounded-xl bg-white/5 p-1">
                  {(["buy", "rent"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={cn(
                        "rounded-lg px-4 py-2 text-xs font-semibold capitalize transition-all duration-300",
                        mode === m
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                          : "text-white/40 hover:text-white/70",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Area / City */}
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 py-3">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-400/60" />
                  <input
                    type="text"
                    placeholder="City, neighborhood..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                  />
                </div>

                {/* Search button */}
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:bg-orange-600 hover:shadow-orange-500/40 active:scale-[0.97]"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </form>
            </motion.div>

            {/* Popular cities */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.4 }}
              className="mt-4 flex flex-wrap items-center gap-2"
            >
              <span className="text-[11px] text-white/25">Trending:</span>
              {["Islamabad", "Lahore", "Karachi", "Rawalpindi"].map((c) => (
                <button
                  key={c}
                  onClick={() => { setCity(c); router.push(`/listings?city=${c}`) }}
                  className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/40 transition-all hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-300"
                >
                  {c}
                </button>
              ))}
            </motion.div>
          </div>

          {/* Right: Stats + Slide Info */}
          <div className="flex flex-col items-end gap-4">
            {/* Stats card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="rounded-2xl bg-white p-5 shadow-2xl shadow-black/20"
            >
              <p className="text-3xl font-black text-gray-900">200k+</p>
              <p className="mt-1 max-w-[180px] text-xs leading-relaxed text-gray-500">
                Clients have left positive reviews about our work.
              </p>
              <div className="mt-3 flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-orange-300 to-orange-500"
                    style={{ zIndex: 5 - i }}
                  />
                ))}
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-orange-100 text-[10px] font-bold text-orange-600">
                  +99
                </div>
              </div>
            </motion.div>

            {/* Slide info card */}
            <SlideInfo slide={tourSlides[activeSlide]} index={activeSlide} />
          </div>
        </div>

        {/* Slide selector dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.4 }}
          className="mt-8 flex items-center gap-3"
        >
          {tourSlides.map((slide, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className="group flex items-center gap-2"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  activeSlide === i
                    ? "w-10 bg-orange-500"
                    : "w-3 bg-white/25 group-hover:bg-white/50",
                )}
              />
              {activeSlide === i && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[11px] font-medium text-white/50"
                >
                  {slide.title}
                </motion.span>
              )}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Side vertical text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 lg:block"
      >
        <p
          className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/20"
          style={{ writingMode: "vertical-rl" }}
        >
          Scroll to explore more
        </p>
      </motion.div>
    </section>
  )
}
