import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export const TextSphere = ({ 
  words = [], 
  className = "",
  radius = 150,
  fontSize = 16,
  speed = 1.5,
  color = "text-gray-900 dark:text-white",
  highlightColor = "text-blue-600 dark:text-blue-400",
  fontWeight = "font-normal",
  highlightIndex = null 
}) => {
  const containerRef = useRef(null);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const requestRef = useRef(null);
  const sphereRef = useRef(null);
  const itemsRef = useRef([]);

  // Initialize the sphere
  useEffect(() => {
    if (!containerRef.current) return;

    // Transform each word to coordinates on a sphere
    const transformItems = () => {
      const items = itemsRef.current;
      if (!items.length) return;

      // Calculate position on sphere for each word
      const sin = Math.sin;
      const cos = Math.cos;
      
      const count = words.length;
      const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
      
      items.forEach((item, index) => {
        if (!item) return;
        
        // Calculate position on sphere
        const y = 1 - (index / (count - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        
        const theta = phi * index;
        
        const x = cos(theta) * radiusAtY;
        const z = sin(theta) * radiusAtY;
        
        // Apply transformation
        item.style.transform = `translate3d(${x * radius}px, ${y * radius}px, ${z * radius}px)`;
        
        // Adjust opacity based on z position (items in front are more visible)
        const opacity = (z + 1) / 2;
        item.style.opacity = opacity.toFixed(2);
        
        // Adjust font size based on z position
        const scale = (z + 2) / 3;
        item.style.fontSize = `${fontSize * scale}px`;
      });
    };

    // Animation function for rotation
    let theta = 0;
    const animate = () => {
      if (!sphereRef.current || !animationEnabled) return;
      
      // Rotate the sphere based on time and mouse position
      const newRotationX = (mousePosition.y * 0.1) + (theta * 0.05 * speed);
      const newRotationY = (mousePosition.x * 0.1) + (theta * 0.05 * speed);
      
      sphereRef.current.style.transform = `rotateX(${newRotationX}deg) rotateY(${newRotationY}deg)`;
      
      theta += 0.7;
      requestRef.current = requestAnimationFrame(animate);
    };
    
    transformItems();
    animate();
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [words, radius, fontSize, speed, mousePosition, animationEnabled]);
  
  // Mouse interaction
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    // Calculate mouse position relative to center of container
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    
    setMousePosition({ x, y });
  };
  
  return (
    <div 
      className={`relative ${className}`}
      style={{ 
        width: radius * 2, 
        height: radius * 2, 
        perspective: "1000px" 
      }}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setAnimationEnabled(false)}
      onMouseLeave={() => setAnimationEnabled(true)}
    >
      <div 
        ref={sphereRef}
        className="absolute w-full h-full transform-style-3d transition-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {words.map((word, index) => (
          <span
            key={index}
            ref={(el) => (itemsRef.current[index] = el)}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap transform-style-3d cursor-pointer transition-colors duration-150 ${fontWeight} ${
              highlightIndex === index ? highlightColor : color
            }`}
            style={{ 
              transformStyle: "preserve-3d",
              transition: "transform 0.5s ease-out, opacity 0.5s ease-out, font-size 0.5s ease-out", 
            }}
            onClick={() => typeof highlightIndex === 'function' && highlightIndex(index)}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TextSphere; 