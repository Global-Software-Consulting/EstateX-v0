"use client"

import { useCountUp } from "@/hooks/use-count-up"

type Stat = {
  value: number
  suffix: string
  label: string
}

const stats: Stat[] = [
  { value: 2400, suffix: "+", label: "Properties" },
  { value: 180, suffix: "+", label: "Agents" },
  { value: 12, suffix: "", label: "Cities" },
]

function StatItem({ stat }: { stat: Stat }) {
  const { count, ref } = useCountUp(stat.value)
  return (
    <div className="flex flex-col items-center text-center">
      <span ref={ref} className="font-mono text-5xl tracking-tight md:text-7xl">
        {count.toLocaleString()}
        {stat.suffix}
      </span>
      <span className="mt-2 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">{stat.label}</span>
    </div>
  )
}

export function EstateStats() {
  return (
    <section className="relative z-10 border-b border-border bg-background">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-5 py-16 sm:grid-cols-3 md:px-8 md:py-20">
        {stats.map((stat) => (
          <StatItem key={stat.label} stat={stat} />
        ))}
      </div>
    </section>
  )
}
