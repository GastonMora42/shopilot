import { motion, useAnimation } from "framer-motion";
import { memo, useEffect } from "react";
import Image from 'next/image';
// components/events/AnimatedBackground.tsx
export const AnimatedBackground = memo(({ 
    imageUrl,
    quality = 75,
    priority = true 
  }: { 
    imageUrl: string,
    quality?: number,
    priority?: boolean
  }) => {
    const controls = useAnimation();
  
    useEffect(() => {
      let isMounted = true;
  
      const animate = async () => {
        while (isMounted) {
          await controls.start({
            scale: [1.1, 1.15, 1.1],
            x: [10, -10, 10],
            y: [10, -10, 10],
            transition: { 
              duration: 30, 
              ease: "linear",
              repeat: Infinity
            }
          });
        }
      };
  
      animate();
      return () => { isMounted = false; };
    }, [controls]);
  
    return (
      <motion.div
        className="fixed inset-0 w-screen h-screen overflow-hidden -z-10"
        initial={{ scale: 1.1 }}
        animate={controls}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/90 z-10" />
        <Image
          src={imageUrl}
          alt="Background"
          fill
          className="object-cover blur-md brightness-50"
          priority={priority}
          quality={quality}
          loading="eager"
          sizes="100vw"
        />
      </motion.div>
    );
  });