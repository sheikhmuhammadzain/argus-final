import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils"

export const Button = ({
  children,
  className = "",
  onClick,
  type = "primary",
  size = "md",
  icon,
  iconPosition = "right",
  disabled = false,
  animateOnClick = true,
  hoverScale = 1.02,
}) => {
  // Styles based on type
  const typeStyles = {
    primary: "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-xl hover:shadow-blue-500/30",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-lg",
    outline: "bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-600/10",
    ghostBlue: "bg-transparent text-blue-600 hover:bg-blue-500/10",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
    dark: "bg-gray-900 text-white hover:bg-gray-800",
    light: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  };
  
  // Sizes
  const sizes = {
    sm: "py-1.5 px-3 text-sm",
    md: "py-2.5 px-5",
    lg: "py-3 px-6 text-lg",
    xl: "py-4 px-8 text-xl",
  };
  
  // Button click animation
  const handleClick = (e) => {
    if (disabled) return;
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      className={`relative rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
        sizes[size]
      } ${typeStyles[type]} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
      onClick={handleClick}
      whileHover={!disabled ? { scale: hoverScale } : {}}
      whileTap={!disabled && animateOnClick ? { scale: 0.98 } : {}}
      disabled={disabled}
    >
      {/* Dynamic positioning of icon */}
      {icon && iconPosition === "left" && <span className="relative">{icon}</span>}
      <span className="relative">{children}</span>
      {icon && iconPosition === "right" && <span className="relative">{icon}</span>}
      
      {/* Hover glow effect for primary button */}
      {type === "primary" && !disabled && (
        <motion.span
          className="absolute inset-0 -z-10 rounded-lg opacity-0 bg-gradient-to-r from-blue-600/80 to-cyan-600/80 blur-lg"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 0.8 }}
        />
      )}
    </motion.button>
  );
};

export const ButtonGroup = ({ children, className = "", vertical = false }) => {
  return (
    <div 
      className={`flex ${
        vertical ? "flex-col" : "flex-row"
      } gap-2 ${className}`}
    >
      {children}
    </div>
  );
};

export default Button; 