"use client"

import { useRef, useEffect } from "react"
import Image from "next/image"
import { motion, useAnimation, useInView } from "framer-motion"

export default function InteractiveImage() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.5 })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    } else {
      controls.start("hidden")
    }
  }, [isInView, controls])

  return (
    <div ref={ref} className="relative w-full max-w-lg mx-auto h-96 overflow-hidden rounded-lg shadow-lg">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 opacity-75"
        initial={{ opacity: 0 }}
        animate={controls}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 0.75 },
        }}
        transition={{ duration: 0.5 }}
      />
      <motion.div
        className="relative w-full h-full"
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { scale: 1.2, rotate: -5 },
          visible: { scale: 1, rotate: 0 },
        }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Image src="/landing-animate.png" alt="Evento emocionante" layout="fill" objectFit="cover" className="rounded-lg" />
      </motion.div>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-4xl font-bold text-white text-center px-4">Colecciona momentos</h3>
      </motion.div>
    </div>
  )
}




