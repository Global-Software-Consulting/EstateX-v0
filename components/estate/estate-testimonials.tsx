"use client"

import { motion } from "motion/react"
import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns"

const testimonials: Testimonial[] = [
  {
    text: "EstateX made finding our dream home in the 8th Arrondissement incredibly easy. The inquiry system connected us directly with the agent, and we closed the deal within two weeks!",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    name: "Camille Laurent",
    role: "Homebuyer, Paris",
  },
  {
    text: "As an agent, the dashboard is a game-changer. I manage all my listings, track inquiries, and respond to buyers in one place. My sales increased 40% since joining.",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "Lukas Weber",
    role: "Property Agent, Berlin",
  },
  {
    text: "I found a beautiful apartment in Montmartre within my budget. The filtering system is excellent and the property pages give all the information I need.",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Sofia Bernard",
    role: "Renter, Paris",
  },
  {
    text: "Listed my Belgravia townhouse and received 12 genuine inquiries in the first week. EstateX filters out spam and connects you with serious buyers only.",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "James Whitfield",
    role: "Property Seller, London",
  },
  {
    text: "The saved properties feature helped me compare options across the Eixample district before making my decision. The whole experience was smooth and professional.",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Marta García",
    role: "First-time Buyer, Barcelona",
  },
  {
    text: "Moving to Berlin for work was stressful, but EstateX helped me find the perfect rental in Kreuzberg within days. The booking viewing feature is brilliant.",
    image: "https://randomuser.me/api/portraits/men/6.jpg",
    name: "Daniel Schmidt",
    role: "Tenant, Berlin",
  },
  {
    text: "I've been investing in London property for years. EstateX gives me a clear overview of the market with real listings and transparent pricing. Highly recommend.",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    name: "Oliver Bennett",
    role: "Investor, London",
  },
  {
    text: "The platform's dark design looks stunning and the property image galleries are top notch. It feels premium, which matches the quality of listings.",
    image: "https://randomuser.me/api/portraits/women/8.jpg",
    name: "Isabella Conti",
    role: "Interior Designer, Rome",
  },
  {
    text: "EstateX transformed how I sell properties. The image upload, inquiry tracking, and status management save me hours every week. Best platform in Europe.",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    name: "Miguel Santos",
    role: "Senior Agent, Lisbon",
  },
]

const firstColumn = testimonials.slice(0, 3)
const secondColumn = testimonials.slice(3, 6)
const thirdColumn = testimonials.slice(6, 9)

export function EstateTestimonials() {
  return (
    <section className="relative z-10 border-t border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto flex max-w-xl flex-col items-center"
        >
          <span className="rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.3em] text-orange-600">
            Testimonials
          </span>

          <h2 className="mt-5 text-center font-display text-3xl leading-none sm:text-4xl md:text-5xl lg:text-6xl">
            What Our Users <span className="word-gradient">Say</span>
          </h2>
          <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">
            Trusted by thousands of buyers, renters, and agents across Europe
          </p>
        </motion.div>

        <div className="mt-14 flex justify-center gap-6 overflow-hidden max-h-[740px] [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  )
}
