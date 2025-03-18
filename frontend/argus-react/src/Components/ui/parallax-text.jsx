import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export const ParallaxText = ({
  children,
  className = "",
  baseVelocity = 3,
  direction = 1
}) => {
  const baseX = useRef(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useTransform(scrollY, [0, 100], [0, direction * 5]);
  
  const directionFactor = direction === 1 ? 1 : -1;
  
  const x = useTransform(scrollVelocity, [0, 1], [0, baseVelocity * directionFactor * 10]);

  return (
    <div className="flex flex-nowrap overflow-hidden m-0 whitespace-nowrap">
      <motion.div
        className={`flex whitespace-nowrap flex-nowrap text-2xl md:text-4xl xl:text-5xl font-bold ${className}`}
        style={{ x }}
      >
        <span className="block mr-4">{children}</span>
        <span className="block mr-4">{children}</span>
        <span className="block mr-4">{children}</span>
        <span className="block mr-4">{children}</span>
      </motion.div>
    </div>
  );
};

export const ParallaxHeading = ({
  children,
  className = "",
  baseVelocity = 3
}) => {
  return (
    <div className="relative py-8 overflow-hidden">
      <ParallaxText baseVelocity={baseVelocity} direction={1} className={`${className} opacity-30`}>
        {children}
      </ParallaxText>
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className={`text-4xl md:text-5xl xl:text-6xl font-bold ${className}`}>
          {children}
        </h1>
      </div>
      <ParallaxText baseVelocity={baseVelocity} direction={-1} className={`${className} opacity-30`}>
        {children}
      </ParallaxText>
    </div>
  );
};

export default ParallaxText; 