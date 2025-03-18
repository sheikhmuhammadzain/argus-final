import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Database, BrainCircuit, Sparkles } from 'lucide-react';

const HeroSection = ({ onStartEvaluation }) => {
  const features = [
    {
      icon: BrainCircuit,
      title: "Intelligent Analysis",
      description: "Comprehensive RAG system evaluation with advanced AI analytics"
    },
    {
      icon: Database,
      title: "Real-time Metrics",
      description: "Instant insights and performance metrics for your implementation"
    },
    {
      icon: Sparkles,
      title: "Enterprise Security",
      description: "End-to-end encryption and secure evaluation environments"
    }
  ];

  return (
    <section className="relative py-20 md:py-32">
      <div className="container-apple">
        {/* Main Hero Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="flex flex-col space-y-8">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-3 py-1 rounded-full dark:bg-github-darkgray bg-gray-100 border dark:border-github-border border-gray-200 text-xs font-medium dark:text-github-blue text-apple-blue">
                  Enterprise RAG Analytics
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-balance dark:text-white text-gray-900">
                Advanced <span className="dark:text-github-blue text-apple-blue">RAG</span> Evaluation Platform
              </h1>
              
              <p className="text-lg dark:text-gray-400 text-gray-600 mt-4 max-w-xl text-pretty">
                Comprehensive analytics and performance metrics for Retrieval Augmented Generation systems.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartEvaluation}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-apple-blue rounded-md font-medium text-white"
              >
                Start Evaluation
                <ArrowRight className="h-4 w-4" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center px-5 py-2.5 dark:bg-github-darkgray bg-gray-100 border dark:border-github-border border-gray-200 rounded-md font-medium dark:text-white text-gray-700"
              >
                Learn More
              </motion.button>
            </div>
            
            <div className="hidden lg:flex items-center gap-4 text-sm dark:text-gray-500 text-gray-600">
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-green-500"></div>
                <span>99.9% Accuracy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                <span>Enterprise-grade</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                <span>Secure Environment</span>
              </div>
            </div>
          </div>
          
          {/* Right side - Feature cards */}
          <div className="grid grid-cols-1 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                className="card-github p-6 rounded-lg border dark:border-github-border border-gray-200 dark:hover:border-github-blue/50 hover:border-apple-blue/50 transition-colors duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-md dark:bg-github-darkgray bg-gray-100">
                    <feature.icon className="h-5 w-5 dark:text-github-blue text-apple-blue" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium dark:text-white text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm dark:text-gray-400 text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 