import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Download, Loader2, Info } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, useAnimation, motion } from 'framer-motion';
import * as Progress from '@radix-ui/react-progress';
import * as Separator from '@radix-ui/react-separator';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  }
};

const staggerContainerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const TypeWriter = ({ text, delay = 0.05 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, delay]);

  return <span>{displayText}</span>;
};

function QueryComponent() {
  const [ragEndpoint, setRagEndpoint] = useState('');
  const [reportHtml, setReportHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    controls.start("visible");
  }, [controls]);

  const handleEvaluate = async () => {
    setLoading(true);
    setReportHtml('');
    setProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const response = await axios.post(
        `${API_URL}/api/evaluate`,
        { rag_endpoint: ragEndpoint },
        { responseType: 'text' }
      );

      clearInterval(progressInterval);
      setProgress(100);
      setReportHtml(response.data);
    } catch (error) {
      console.error(error);
      setReportHtml("<p class='text-red-500'>Error generating report.</p>");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleDownloadPDF = async () => {
    if (!ragEndpoint) return;
    
    setDownloadLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/download-pdf?rag_endpoint=${encodeURIComponent(ragEndpoint)}`,
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rag_evaluation_report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="py-4 sm:py-6 md:py-8 px-3 sm:px-6 lg:px-8 bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <motion.h1 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-cybergen-dark font-poppins mb-1 sm:mb-2 md:mb-3 tracking-tight"
            >
              RAG Evaluation System
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm sm:text-base md:text-lg text-gray-600 font-poppins opacity-90 max-w-2xl mx-auto px-2"
            >
              Enter your RAG endpoint URL to evaluate its performance
            </motion.p>
          </div>
        </div>
      </motion.header>

      <main className="py-4 sm:py-6 md:py-8 px-3 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={controls}
            className="bg-white shadow-sm rounded-xl p-4 sm:p-6 md:p-8 border border-gray-100 transition-all duration-300 hover:shadow-md"
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-cybergen-blue">
                <motion.div
                  initial={{ rotate: -90 }}
                  animate={{ rotate: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Info className="h-5 w-5" />
                </motion.div>
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="font-semibold font-poppins"
                >
                  <TypeWriter text="About This Tool" delay={0.1} />
                </motion.span>
                <Separator.Root className="h-[1px] flex-1 bg-gray-200" />
              </div>
              
              <motion.div 
                variants={listItemVariants}
                className="text-sm sm:text-base text-gray-600 leading-relaxed space-y-2"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <TypeWriter 
                    text="This evaluation system assesses your RAG (Retrieval-Augmented Generation) endpoint's performance by:"
                    delay={0.03}
                  />
                </motion.p>
              </motion.div>

              <motion.div 
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
                transition={{ delayChildren: 2.5 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"
              >
                <motion.div
                  variants={containerVariants}
                  whileHover={{ scale: 1.02 }}
                  className="bg-blue-50 p-4 rounded-lg border border-blue-100 transition-all duration-200"
                >
                  <h3 className="font-semibold text-sm sm:text-base text-cybergen-dark mb-2">Evaluation Process</h3>
                  <motion.ul variants={staggerContainerVariants} className="text-sm text-gray-600 space-y-2">
                    {["Tests predefined queries", "Compares with reference answers", "Generates performance metrics"].map((item, index) => (
                      <motion.li
                        key={index}
                        variants={listItemVariants}
                        className="flex items-center"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-2">{index + 1}</span>
                        {item}
                      </motion.li>
                    ))}
                  </motion.ul>
                </motion.div>

                <motion.div
                  variants={containerVariants}
                  whileHover={{ scale: 1.02 }}
                  className="bg-blue-50 p-4 rounded-lg border border-blue-100 transition-all duration-200"
                >
                  <h3 className="font-semibold text-sm sm:text-base text-cybergen-dark mb-2">Output Format</h3>
                  <motion.ul variants={staggerContainerVariants} className="text-sm text-gray-600 space-y-2">
                    {["Interactive HTML report", "Detailed metrics analysis", "Downloadable PDF report"].map((item, index) => (
                      <motion.li
                        key={index}
                        variants={listItemVariants}
                        className="flex items-center"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-2">{index + 1}</span>
                        {item}
                      </motion.li>
                    ))}
                  </motion.ul>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white shadow-sm rounded-xl p-3 sm:p-5 md:p-8 border border-gray-100 transition-all duration-300 hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="text"
                value={ragEndpoint}
                onChange={(e) => setRagEndpoint(e.target.value)}
                placeholder="Enter RAG endpoint URL"
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cybergen-blue/20 focus:border-cybergen-blue transition-all duration-200 font-poppins text-sm sm:text-base text-gray-700 w-full"
              />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleEvaluate}
                  disabled={loading || !ragEndpoint}
                  className="bg-cybergen-blue hover:bg-blue-600 text-white font-poppins text-sm sm:text-base min-w-[100px] sm:min-w-[120px] transition-all duration-200 ease-out transform hover:translate-y-[-1px] hover:shadow-md disabled:transform-none disabled:hover:shadow-none w-full sm:w-auto py-2 sm:py-2.5"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      <span className="text-sm sm:text-base">Evaluating</span>
                    </div>
                  ) : (
                    <span className="text-sm sm:text-base">Evaluate</span>
                  )}
                </Button>
              </motion.div>
            </div>
            
            <AnimatePresence>
              {progress > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 sm:mt-6"
                >
                  <Progress.Root 
                    className="relative overflow-hidden bg-gray-100 rounded-full w-full h-1 sm:h-1.5"
                    value={progress}
                  >
                    <Progress.Indicator
                      className="bg-cybergen-blue h-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </Progress.Root>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 text-center font-poppins"
                  >
                    Evaluating... {progress}%
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {reportHtml && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white shadow-sm rounded-xl p-3 sm:p-5 md:p-8 border border-gray-100"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-lg sm:text-xl md:text-2xl font-bold text-cybergen-dark font-poppins tracking-tight"
                  >
                    Evaluation Results
                  </motion.h2>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleDownloadPDF}
                      variant="outline"
                      disabled={downloadLoading}
                      className="border-cybergen-blue text-cybergen-blue hover:bg-cybergen-blue hover:text-white font-poppins text-sm sm:text-base transition-all duration-200 ease-out transform hover:translate-y-[-1px] hover:shadow-md disabled:transform-none disabled:hover:shadow-none w-full sm:w-auto min-w-[140px] sm:min-w-[160px]"
                    >
                      {downloadLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          <span className="text-sm sm:text-base">Downloading...</span>
                        </div>
                      ) : (
                        <>
                          <Download className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="text-sm sm:text-base">Download PDF</span>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="prose prose-xs sm:prose-sm lg:prose-base max-w-none font-poppins overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: reportHtml }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default QueryComponent;

