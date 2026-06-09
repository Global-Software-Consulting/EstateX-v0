"use client"

import React from "react"
import { Swiper, SwiperSlide } from "swiper/react"

import "swiper/css"
import "swiper/css/effect-coverflow"
import "swiper/css/pagination"
import "swiper/css/navigation"
import {
  Autoplay,
  EffectCoverflow,
  Navigation,
  Pagination,
} from "swiper/modules"

export interface CarouselSlide {
  src: string
  alt: string
  label?: string
  overlay?: React.ReactNode
}

interface CarouselProps {
  images: CarouselSlide[]
  autoplayDelay?: number
  showPagination?: boolean
  showNavigation?: boolean
  slideWidth?: number
}

export const CardCarousel: React.FC<CarouselProps> = ({
  images,
  autoplayDelay = 2000,
  showPagination = true,
  showNavigation = false,
  slideWidth = 300,
}) => {
  const css = `
  .estate-swiper {
    width: 100%;
    padding-bottom: 44px;
  }
  .estate-swiper .swiper-slide {
    background-position: center;
    background-size: cover;
    width: ${slideWidth}px;
    transition: all 0.5s ease;
  }
  .estate-swiper .swiper-slide img {
    display: block;
    width: 100%;
  }
  .estate-swiper .swiper-3d .swiper-slide-shadow-left,
  .estate-swiper .swiper-3d .swiper-slide-shadow-right {
    background-image: none;
  }
  .estate-swiper .swiper-pagination-bullet {
    background: rgba(255,255,255,0.25);
    opacity: 1;
    width: 8px;
    height: 8px;
    transition: all 0.3s ease;
  }
  .estate-swiper .swiper-pagination-bullet-active {
    background: rgba(255,255,255,0.9);
    width: 24px;
    border-radius: 4px;
  }
  `

  const allSlides = [...images, ...images]

  return (
    <div className="w-full">
      <style>{css}</style>
      <Swiper
        className="estate-swiper"
        spaceBetween={16}
        autoplay={{
          delay: autoplayDelay,
          disableOnInteraction: false,
        }}
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        loop={true}
        slidesPerView="auto"
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
        }}
        pagination={showPagination ? { clickable: true } : false}
        navigation={
          showNavigation
            ? {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
              }
            : undefined
        }
        modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
      >
        {allSlides.map((image, index) => (
          <SwiperSlide key={index}>
            <div className="group relative overflow-hidden rounded-xl">
              <img
                src={image.src}
                alt={image.alt}
                className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Default gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 group-hover:opacity-0" />
              {/* Hover gradient — darker */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {/* Default label */}
              {image.label && (
                <div className="absolute bottom-4 left-4 transition-all duration-300 group-hover:opacity-0">
                  <p className="font-display text-xl text-white drop-shadow-lg">{image.label}</p>
                </div>
              )}
              {/* Hover overlay content */}
              {image.overlay && (
                <div className="absolute inset-x-0 bottom-0 translate-y-4 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {image.overlay}
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
