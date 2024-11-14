import { motion } from "framer-motion";
import { memo } from "react";

export const AdaptiveHeader = memo(function AdaptiveHeader({ title }: { title: string }) {
    return (
    <header className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
      <div className="container mx-auto px-4 py-6 relative z-10">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-white drop-shadow-lg tracking-tight"
        >
          {title}
        </motion.h1>
      </div>
    </header>
  );
});
  
  