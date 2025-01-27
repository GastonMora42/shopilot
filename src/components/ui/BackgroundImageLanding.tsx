"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export default function BackgroundImageSection() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <section className="relative h-[600px] md:h-[800px] overflow-hidden">
      <Image
        src="/universo.png"
        alt="Evento emocionante"
        layout="fill"
        objectFit="cover"
        quality={100}
        className="z-0"
      />
      <div
        className={`absolute inset-0 z-10 ${
          isMobile ? "bg-gradient-to-t from-black to-transparent" : "bg-gradient-to-r from-black to-transparent"
        }`}
      ></div>
<div className="absolute inset-0 z-20 flex items-center justify-center md:justify-start">
  <div className="text-white p-8 md:ml-16 max-w-md">
    <h2 className="text-4xl md:text-5xl font-bold mb-4">Crea Experiencias Únicas</h2>
    <p className="text-lg md:text-xl leading-relaxed">
      En nuestra plataforma, diseñar y gestionar eventos es fácil y emocionante. 🎉 
       <br />
       y Sin sorpreas!
      <br /><br />
      🌟 Con nuestras herramientas intuitivas, llevamos tu evento al siguiente nivel:  
      <ul className="list-disc list-inside mt-2 space-y-1">
        <li>🎨 <strong>Diseño personalizado</strong> para reflejar tu visión.</li>
        <li>📲 Gestión de entradas digitales con códigos QR.</li>
        <li>📊 Análisis en tiempo real para medir el éxito.</li>
      </ul>
    </p>
  </div>
</div>
    </section>
  )
}

