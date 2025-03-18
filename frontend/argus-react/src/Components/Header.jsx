import React from 'react';
import { Command, Sparkles, Database, BrainCircuit, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';

const Header = ({ scrollPosition = 0 }) => {
  const { darkMode, toggleTheme } = useTheme();
  
  const isScrolled = scrollPosition > 10;
  
  return (
    <header 
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'backdrop-blur-lg bg-github-black/80 border-b border-github-border/40' 
          : 'bg-transparent'
      }`}
    >
      <div className="container-apple py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title Section */}
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="p-2.5 rounded-xl bg-github-darkgray/80 hover:bg-github-darkgray transition-all duration-200"
            >
              <Command className="h-5 w-5 text-github-blue" />
            </motion.div>
            
            <div className="flex flex-col">
              <h1 className="text-xl font-medium text-white tracking-tight">
                Argus<span className="text-github-blue ml-1.5">RAG</span>
              </h1>
              <p className="text-xs text-gray-400">Enterprise Evaluation Platform</p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Feature Pills */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-github-darkgray/80 border border-github-border/20 hover:bg-github-darkgray transition-colors duration-200">
                <Database className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-300">Analytics</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-github-darkgray/80 border border-github-border/20 hover:bg-github-darkgray transition-colors duration-200">
                <BrainCircuit className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-300">AI Powered</span>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={toggleTheme}
              className="p-2 rounded-full bg-github-darkgray/80 hover:bg-github-darkgray transition-colors duration-200 border border-github-border/20"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <Sun className="h-4 w-4 text-gray-300" />
              ) : (
                <Moon className="h-4 w-4 text-gray-300" />
              )}
            </motion.button>

            {/* ARGUS Badge */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-apple-blue/20 text-github-blue"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">ARGUS</span>
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;