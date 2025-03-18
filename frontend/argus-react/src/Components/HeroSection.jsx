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
                <div className="px-3 py-1 rounded-full bg-github-darkgray border border-github-border text-xs font-medium text-github-blue">
                  Enterprise RAG Analytics
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-balance text-white">
                Advanced <span className="text-github-blue">RAG</span> Evaluation Platform
              </h1>
              
              <p className="text-lg text-gray-400 mt-4 max-w-xl text-pretty">
                Comprehensive analytics and performance metrics for Retrieval Augmented Generation systems.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartEvaluation}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-github-blue rounded-md font-medium text-white"
              >
                Start Evaluation
                <ArrowRight className="h-4 w-4" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center px-5 py-2.5 bg-github-darkgray border border-github-border rounded-md font-medium text-white"
              >
                Learn More
              </motion.button>
            </div>
            
            <div className="hidden lg:flex items-center gap-4 text-sm text-gray-500">
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
                className="card-github p-6 rounded-lg border border-github-border hover:border-github-blue/50 transition-colors duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-md bg-github-darkgray">
                    <feature.icon className="h-5 w-5 text-github-blue" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
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