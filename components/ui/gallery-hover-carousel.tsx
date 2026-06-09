"use client"

import { Children, ReactNode, createContext, useContext, useEffect, useRef, useState } from "react"
import { motion, useMotionValue } from "motion/react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

type CarouselContextType = {
  index: number
  setIndex: (i: number) => void
  itemsCount: number
  setItemsCount: (n: number) => void
}

const CarouselContext = createContext<CarouselContextType | undefined>(undefined)
function useCarousel() {
  const ctx = useContext(CarouselContext)
  if (!ctx) throw new Error("useCarousel must be used within Carousel")
  return ctx
}

export function Carousel({ children, className }: { children: ReactNode; className?: string }) {
  const [index, setIndex] = useState(0)
  const [itemsCount, setItemsCount] = useState(0)
  return (
    <CarouselContext.Provider value={{ index, setIndex, itemsCount, setItemsCount }}>
      <div className={cn("group/hover relative", className)}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </CarouselContext.Provider>
  )
}

export function CarouselNavigation({ className, alwaysShow }: { className?: string; alwaysShow?: boolean }) {
  const { index, setIndex, itemsCount } = useCarousel()
  return (
    <div className={cn("pointer-events-none absolute left-[-3%] top-1/2 flex w-[106%] -translate-y-1/2 justify-between px-2", className)}>
      <button
        type="button"
        aria-label="Previous"
        className={cn(
          "pointer-events-auto h-9 w-9 rounded-full border border-border bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          alwaysShow ? "opacity-100 disabled:opacity-30" : "opacity-0 group-hover/hover:opacity-100 group-hover/hover:disabled:opacity-30",
        )}
        disabled={index === 0}
        onClick={() => index > 0 && setIndex(index - 1)}
      >
        <ChevronLeft className="mx-auto h-4 w-4 text-foreground" />
      </button>
      <button
        type="button"
        aria-label="Next"
        className={cn(
          "pointer-events-auto h-9 w-9 rounded-full border border-border bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          alwaysShow ? "opacity-100 disabled:opacity-30" : "opacity-0 group-hover/hover:opacity-100 group-hover/hover:disabled:opacity-30",
        )}
        disabled={index + 1 === itemsCount}
        onClick={() => index < itemsCount - 1 && setIndex(index + 1)}
      >
        <ChevronRight className="mx-auto h-4 w-4 text-foreground" />
      </button>
    </div>
  )
}

export function CarouselContent({ children, className }: { children: ReactNode; className?: string }) {
  const { index, setIndex, setItemsCount } = useCarousel()
  const [visibleCount, setVisibleCount] = useState(1)
  const dragX = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsLength = Children.count(children)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new IntersectionObserver(
      (entries) => setVisibleCount(entries.filter((e) => e.isIntersecting).length),
      { root: containerRef.current, threshold: 0.5 }
    )
    Array.from(containerRef.current.children).forEach((c) => observer.observe(c))
    return () => observer.disconnect()
  }, [children, setItemsCount])

  useEffect(() => { if (itemsLength) setItemsCount(itemsLength) }, [itemsLength, setItemsCount])

  const onDragEnd = () => {
    const x = dragX.get()
    if (x <= -10 && index < itemsLength - 1) setIndex(index + 1)
    else if (x >= 10 && index > 0) setIndex(index - 1)
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragMomentum={false}
      style={{ x: dragX }}
      animate={{ translateX: `-${index * (100 / visibleCount)}%` }}
      onDragEnd={onDragEnd}
      transition={{ damping: 18, stiffness: 90, type: "spring", duration: 0.2 }}
      className={cn("flex cursor-grab items-center active:cursor-grabbing", className)}
      ref={containerRef}
    >
      {children}
    </motion.div>
  )
}

export function CarouselItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={cn("w-full min-w-0 shrink-0 grow-0 overflow-hidden", className)}>
      {children}
    </motion.div>
  )
}
