import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export const Card3D = ({ 
  children, 
  className = "", 
  backgroundClassName = "",
  cardClassName = "", 
  containerClassName = "",
  glowClassName = "",
  rotationIntensity = 10, // Adjust rotation intensity
  glowIntensity = 1.2, // Adjust glow intensity 
  borderWidth = 1, // Border width in pixels
  perspective = 800, // Perspective value
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const divRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const posX = e.clientX - centerX;
    const posY = e.clientY - centerY;
    
    // Calculate rotation based on mouse position
    const maxRotation = rotationIntensity; // Max degree of rotation
    const rotateY = (posX / rect.width) * maxRotation * 2;
    const rotateX = -((posY / rect.height) * maxRotation * 2);
    
    setMousePosition({ x: rotateY, y: rotateX });
  };

  // Reset animation when mouse leaves
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  // Wrapper for mouse events
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // Animation configuration
  const transition = {
    type: "spring",
    stiffness: 800,
    damping: 30,
    mass: 1,
  };

  return (
    <div 
      className={`perspective-${perspective} ${containerClassName}`}
      ref={divRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: `${perspective}px`,
        transformStyle: "preserve-3d",
      }}
    >
      <motion.div
        animate={{
          rotateX: mousePosition.y,
          rotateY: mousePosition.x,
          transformStyle: "preserve-3d",
        }}
        transition={transition}
        className={`relative group ${className}`}
      >
        {/* Glow effect */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: isHovered ? glowIntensity : 0,
              translateZ: "0px"
            }}
            transition={transition}
            className={`absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur-md group-hover:opacity-80 ${glowClassName}`}
            style={{
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
          />
        )}
        
        {/* Card background */}
        <motion.div 
          className={`absolute inset-0 bg-white dark:bg-gray-950 rounded-xl p-px z-10 ${backgroundClassName}`}
          style={{
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            border: `${borderWidth}px solid rgba(255, 255, 255, 0.08)`,
          }}
        />
        
        {/* Card content */}
        <motion.div 
          className={`relative z-20 p-5 ${cardClassName}`}
          animate={{
            transformStyle: "preserve-3d",
          }}
          transition={transition}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Card3D; 