// BackgroundImageSection.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { Play, Palette, QrCode, BarChart } from "lucide-react"

export default function BackgroundImageSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section 
      ref={ref}
      className="relative h-[80vh] min-h-[800px] overflow-hidden bg-black"
    >
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y, opacity }}
      >
        <Image
          src="/universo.png"
          alt="Evento emocionante en ShowSpot"
          layout="fill"
          objectFit="cover"
          quality={100}
          className="object-cover"
          priority
        />
      </motion.div>

      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/60 to-transparent" />

      <div className="absolute inset-0 z-20 flex items-end pb-20 md:items-center md:justify-start">
        <div className="container px-6 lg:px-20">
          <motion.div 
            className="max-w-2xl space-y-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-400 to-[#FF5F1F] bg-clip-text text-transparent">
              Crea Experiencias
              <span className="block mt-2 text-white">Que Perduran</span>
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
            {[
  { 
    icon: <Palette />, 
    title: "Diseño Personalizado", 
    color: "text-purple-400",
    description: "Crea eventos únicos con una identidad visual que refleje tu marca y tipo de entradas"
  },
  { 
    icon: <QrCode />, 
    title: "Entradas Digitales", 
    color: "text-blue-400",
    description: "Sistema de tickets digitales seguro y fácil de gestionar para tus colaboradores"
  },
  { 
    icon: <BarChart />, 
    title: "Analíticas en Tiempo Real", 
    color: "text-green-400",
    description: "Monitorea el éxito de tu evento con datos y métricas en tiempo real"
  }
].map((feature, i) => (
                <motion.div
                  key={i}
                  className="p-6 backdrop-blur-sm bg-black/30 rounded-xl border border-white/10 hover:border-orange-400/30 transition-all"
                  whileHover={{ y: -5 }}
                >
                  <div className={`${feature.color} mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-gray-300">
                  {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Efecto de partículas */}
      <div className="absolute inset-0 z-0 opacity-30">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
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
    </section>
  )
}