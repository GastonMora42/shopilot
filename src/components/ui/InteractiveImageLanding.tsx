"use client"

import { useRef, useEffect } from "react"
import Image from "next/image"
import { motion, useAnimation, useInView, useMotionTemplate, useMotionValue } from "framer-motion"

export default function InteractiveImage() {
  const ref = useRef(null)
  const isInView = useInView(ref, { margin: "0px 0px -100px 0px" })
  const controls = useAnimation()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`

  // Corrección del warning de useEffect
  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  const handleMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set(e.clientX - rect.left)
    y.set(e.clientY - rect.top)
    rotateX.set(-((e.clientY - rect.top - rect.height/2) / 20))
    rotateY.set((e.clientX - rect.left - rect.width/2) / 20)
  }

  // Creamos las partículas fuera del render
  const particles = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    initialX: Math.random() * 100,
    initialY: Math.random() * 100,
    duration: 4 + Math.random() * 5
  }))

  return (
    <div 
      ref={ref}
      className="relative w-full max-w-md mx-auto aspect-[9/16] overflow-visible group"
      onPointerMove={handleMove}
      onPointerLeave={() => {
        rotateX.set(0)
        rotateY.set(0)
      }}
    >
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ transform }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/relleno.png"
            alt="Contenido de ShowSpot"
            layout="fill"
            objectFit="cover"
            className="object-cover scale-105"
            priority
          />
        </div>

        <Image
          src="/marco.png"
          alt="Marco del celular"
          layout="fill"
          objectFit="contain"
          className="pointer-events-none z-10 opacity-90"
          priority
        />
      </motion.div>

      <div className="absolute inset-0 pointer-events-none z-20">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-white/10 rounded-full mix-blend-overlay"
            initial={{ 
              x: `${particle.initialX}%`,
              y: `${particle.initialY}%` 
            }}
            animate={{
              scale: [0, 0.5, 0],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  )
}