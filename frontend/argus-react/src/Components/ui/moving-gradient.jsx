import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export const MovingGradient = ({
  children,
  className = "",
  containerClassName = "",
  gradientClassName = "",
  duration = 15,
  blur = 120,
  gradientSize = "100%",
  hueRotateDuration = 10,
  colors = ["#0ea5e9", "#2563eb", "#6366f1", "#8b5cf6"]
}) => {
  const containerRef = useRef(null);
  
  return (
    <div className={`relative overflow-hidden ${containerClassName}`} ref={containerRef}>
      {/* Animated gradient background */}
      <motion.div 
        className={`absolute inset-0 ${gradientClassName}`}
        style={{
          filter: `blur(${blur}px)`,
        }}
        animate={{
          filter: [
            `blur(${blur}px) hue-rotate(0deg)`,
            `blur(${blur}px) hue-rotate(360deg)`
          ],
        }}
        transition={{
          duration: hueRotateDuration,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        <div className="absolute inset-0 opacity-50">
          {colors.map((color, index) => (
            <motion.div
              key={index}
              className="absolute rounded-full opacity-70"
              style={{
                backgroundColor: color,
                width: gradientSize,
                height: gradientSize,
                borderRadius: "100%",
                top: `calc(50% - ${parseInt(gradientSize) / 2}px)`,
                left: `calc(50% - ${parseInt(gradientSize) / 2}px)`,
              }}
              animate={{
                x: [
                  Math.random() * 50 - 25,
                  Math.random() * 50 - 25,
                  Math.random() * 50 - 25,
                  Math.random() * 50 - 25,
                ],
                y: [
                  Math.random() * 50 - 25,
                  Math.random() * 50 - 25,
                  Math.random() * 50 - 25,
                  Math.random() * 50 - 25,
                ],
                scale: [1, 1.1, 0.9, 1.2, 1],
              }}
              transition={{
                duration: duration,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse",
                delay: index * 0.7,
              }}
            />
          ))}
        </div>
      </motion.div>
      
      {/* Content */}
      <div className={`relative z-10 ${className}`}>{children}</div>
    </div>
  );
};

export default MovingGradient; 