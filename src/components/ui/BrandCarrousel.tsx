"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"

const brands = [
  { name: "Brand 1", logo: "/mb-logo.png" },
  { name: "Brand 2", logo: "/jett-logo.png" },
  { name: "Brand 3", logo: "/winter-logo.png" },
]

export default function BrandCarousel() {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      const carousel = document.querySelector(".carousel") as HTMLElement
      if (carousel) {
        setWidth(carousel.scrollWidth - carousel.offsetWidth)
      }
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <section className="py-12 bg-gray-900 relative">
      {/* Gradiente de fondo sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#ff3131]/5 to-transparent"></div>
      
      {/* Bordes brillantes */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff3131]/20 to-transparent"></div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#ff3131]/20 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">
          Marcas que Confían en Nosotros
        </h2>
        <motion.div className="carousel overflow-hidden">
          <motion.div
            className="flex"
            drag="x"
            dragConstraints={{ right: 0, left: -width }}
            animate={{ x: [-width, 0] }}
            transition={{
              x: {
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                duration: 20,
                ease: "linear",
              },
            }}
          >
            {brands.concat(brands).map((brand, index) => (
              <motion.div
                key={index}
                className="min-w-[200px] h-24 flex items-center justify-center mx-4"
                whileHover={{ 
                  scale: 1.1,
                  filter: "brightness(1.2)",
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.9 }}
              >
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ff3131]/30 to-transparent rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative">
                    <Image
                      src={brand.logo || "/placeholder.svg"}
                      alt={brand.name}
                      width={150}
                      height={60}
                      objectFit="contain"
                      className="filter brightness-100 hover:brightness-110 transition-all duration-300"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}