"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion, useMotionValue, useSpring } from "framer-motion"

const brands = [
  { name: "Marca 1", logo: "/mb-logo.png" },
  { name: "JettLabs", logo: "/jett-logo.png" },
  { name: "Winter", logo: "/winter-logo.png" },
  { name: "Marca 4", logo: "/mb-logo.png" },
  { name: "Marca 5", logo: "/jett-logo.png" },
]

export default function BrandCarousel() {
  const [isHovered, setIsHovered] = useState(false)
  const x = useMotionValue(0)
  const springX = useSpring(x, {
    damping: 30,
    stiffness: 100,
    mass: 0.5
  })

  useEffect(() => {
    let animation: number
    const animate = () => {
      x.set(x.get() - 1)
      animation = requestAnimationFrame(animate)
    }
    
    if (!isHovered) animate()
    return () => cancelAnimationFrame(animation)
  }, [isHovered, x])

  return (
    <section className="relative py-20 overflow-hidden bg-black">
      {/* Efecto de partículas */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#FF5F1F] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 xl:px-0 relative">
        <motion.h2 
          className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-orange-400 to-[#FF5F1F] bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Marcas que confian en nosotros
        </motion.h2>

        <motion.div 
          className="flex cursor-grab active:cursor-grabbing"
          style={{ x: springX }}
          drag="x"
          dragConstraints={{ right: 0, left: -2000 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          {[...brands, ...brands, ...brands].map((brand, i) => (
            <motion.div
              key={i}
              className="relative min-w-[200px] h-24 mx-6 group"
              whileHover={{ 
                scale: 1.05,
                transition: { type: "spring", stiffness: 300 }
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative h-full flex items-center justify-center p-8 bg-black/50 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-orange-400/30 transition-all">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={150}
                  height={60}
                  className="object-contain brightness-90 hover:brightness-100 transition-all duration-300"
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Efecto de velocidad */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: isHovered ? 0 : 1 }}
      >
        <div className="absolute left-0 top-1/2 w-64 h-32 bg-gradient-to-r from-black via-transparent to-transparent" />
        <div className="absolute right-0 top-1/2 w-64 h-32 bg-gradient-to-l from-black via-transparent to-transparent" />
      </motion.div>
    </section>
  )
}