// src/App.jsx
import React, { useState, useRef, useEffect } from 'react';
import Header from './Components/Header';
import HeroSection from './Components/HeroSection';
import QueryComponent from './Components/QueryComponent';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ChevronDown } from 'lucide-react';
import ThemeProvider from './Components/ThemeProvider';

function App() {
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const evaluationRef = useRef(null);
  const mainRef = useRef(null);

  // Track scroll position for various effects
  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      setScrollPosition(position);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleStartEvaluation = () => {
    setShowEvaluation(true);
    // Smooth scroll to evaluation section
    setTimeout(() => {
      evaluationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-github-black text-github-text overflow-hidden">
        {/* Noise texture */}
        <div className="fixed inset-0 bg-noise opacity-[0.02] pointer-events-none z-0"></div>
        
        {/* Subtle gradient background elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-apple-blue/5 to-transparent dark:from-apple-blue/10 dark:to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-t from-apple-indigo/5 to-transparent dark:from-apple-indigo/10 dark:to-transparent rounded-full blur-3xl"></div>
        <div 
          className="absolute inset-0 opacity-[0.01]" 
          style={{ 
              backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120,120,120,0.15), transparent)'
          }}
        ></div>
      </div>

        <Header scrollPosition={scrollPosition} />
      
        <main ref={mainRef} className="relative">
          {/* Hero Section */}
        <HeroSection onStartEvaluation={handleStartEvaluation} />
        
          {/* Evaluation Section - conditionally rendered */}
        <AnimatePresence>
          {showEvaluation && (
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
              ref={evaluationRef}
                className="container-apple py-16"
              >
                <div className="card-github p-6 md:p-8 shadow-lg"> 
                  <h2 className="text-2xl md:text-3xl font-medium mb-8 text-white">
                    RAG System Evaluation
                  </h2>
                  <QueryComponent />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

          {/* Scroll to top button - conditionally rendered */}
          <AnimatePresence>
            {scrollPosition > 300 && (
        <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
                className="fixed bottom-8 right-8 p-3 rounded-full bg-apple-blue text-white shadow-lg shadow-apple-blue/20 z-50"
                aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </motion.button>
            )}
          </AnimatePresence>
      </main>
    </div>
    </ThemeProvider>
  );
}

export default App;