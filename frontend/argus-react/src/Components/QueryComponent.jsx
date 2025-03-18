import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Download, 
  Loader2, 
  Info, 
  ChevronDown, 
  Settings, 
  Send, 
  FileText, 
  AlertCircle,
  Globe,
  Key,
  Code,
  LayoutList,
  Shield,
  Cpu,
  Beaker,
  FileOutput,
  Play
} from 'lucide-react';
import { AnimatePresence, useAnimation, motion } from 'framer-motion';
import { evaluateRagSystem } from '../lib/api';

// Get the backend URL from environment variables or use empty string if not defined
const API_URL = import.meta.env.VITE_BACKEND_URL || '';

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
  const [apiKey, setApiKey] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [endpointType, setEndpointType] = useState('openai');
  const [requestMethod, setRequestMethod] = useState('POST');
  const [responsePath, setResponsePath] = useState('choices.0.message.content');
  const [customHeaders, setCustomHeaders] = useState('');
  const [customFormat, setCustomFormat] = useState('');
  const [reportHtml, setReportHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [evaluationType, setEvaluationType] = useState('simple'); // 'simple' or 'comprehensive'
  const controls = useAnimation();

  // Add a state to track if the backend API is available
  const [isBackendAvailable, setIsBackendAvailable] = useState(!!API_URL);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check backend availability on component mount
  useEffect(() => {
    // Make demo mode available globally for the API
    window.DEMO_MODE = false;
    
    const checkBackendAvailability = async () => {
      if (!API_URL) {
        console.log("No backend URL configured, using frontend-only evaluation");
        setIsBackendAvailable(false);
        // If no backend URL is configured, force comprehensive evaluation mode
        setEvaluationType('comprehensive');
        return;
      }
      
      try {
        // Try to ping the backend to check availability
        await axios.get(`${API_URL}/api/health`, { timeout: 3000 });
        setIsBackendAvailable(true);
      } catch (error) {
        console.warn("Backend API not available, using frontend-only evaluation");
        setIsBackendAvailable(false);
        // If backend is not available, force comprehensive evaluation mode
        setEvaluationType('comprehensive');
      }
    };
    
    checkBackendAvailability();
  }, []);

  useEffect(() => {
    controls.start("visible");
  }, [controls]);

  const runDemoMode = () => {
    setRagEndpoint('demo-mode');
    setIsDemoMode(true);
    window.DEMO_MODE = true;
    handleEvaluate(true);
  };

  const handleEvaluate = async (isDemo = false) => {
    if (!ragEndpoint && !isDemo) {
      setReportHtml("<p class='text-red-500'>Please enter an endpoint URL.</p>");
      return;
    }
    
    setLoading(true);
    setReportHtml('');
    setProgress(0);
    
    try {
      // Start progress animation
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev < 95) {
            return prev + (evaluationType === 'comprehensive' ? 1 : 3);
          }
          return prev;
        });
      }, 200);
      
      let reportData;
      
      // If in demo mode, or backend isn't available, or we're using comprehensive evaluation, use frontend approach
      if (isDemo || !isBackendAvailable || evaluationType === 'comprehensive') {
        try {
          // Parse custom headers if provided
          let parsedHeaders = {};
          if (customHeaders) {
            try {
              parsedHeaders = JSON.parse(customHeaders);
            } catch (e) {
              setReportHtml("<p class='text-red-500'>Invalid JSON format in custom headers.</p>");
              clearInterval(progressTimer);
              setLoading(false);
              setProgress(0);
              return;
            }
          }
          
          // Parse custom request format if provided
          let parsedRequestFormat = undefined;
          if (customFormat && endpointType === 'custom') {
            try {
              parsedRequestFormat = JSON.parse(customFormat);
            } catch (e) {
              setReportHtml("<p class='text-red-500'>Invalid JSON format in custom request body.</p>");
              clearInterval(progressTimer);
              setLoading(false);
              setProgress(0);
              return;
            }
          }
          
          // Prepare config for the evaluation
          const config = {
            ragEndpoint: isDemo ? 'demo' : ragEndpoint,
            apiKey: apiKey || undefined,
            endpointType,
            requestMethod,
            responsePath,
            headers: parsedHeaders,
            requestFormat: parsedRequestFormat
          };
          
          console.log(`Running ${isDemo ? 'demo' : 'comprehensive frontend'} evaluation with config:`, {...config, apiKey: apiKey ? "****" : undefined});
          
          // Run the comprehensive evaluation
          reportData = await evaluateRagSystem(config);
          
        } catch (error) {
          console.error("Comprehensive evaluation error:", error);
          reportData = `<p class='text-red-500'>Error during comprehensive evaluation: ${error.message}</p>`;
        }
      } else {
        // Use the original simple evaluation API via backend
        // Prepare request data
        const requestData = {
          rag_endpoint: ragEndpoint,
          endpoint_type: endpointType,
          request_method: requestMethod,
          response_path: responsePath,
        };
        
        // Add API key if provided
        if (apiKey) {
          requestData.api_key = apiKey;
        }
        
        // Add custom headers if provided
        if (customHeaders) {
          try {
            requestData.headers = JSON.parse(customHeaders);
          } catch (e) {
            console.error("Invalid JSON in custom headers:", e);
            setReportHtml("<p class='text-red-500'>Invalid JSON format in custom headers.</p>");
            clearInterval(progressTimer);
            setLoading(false);
            setProgress(0);
            return;
          }
        }
        
        // Add custom request format if provided
        if (customFormat && endpointType === 'custom') {
          try {
            requestData.request_format = JSON.parse(customFormat);
          } catch (e) {
            console.error("Invalid JSON in custom format:", e);
            setReportHtml("<p class='text-red-500'>Invalid JSON format in custom request body.</p>");
            clearInterval(progressTimer);
            setLoading(false);
            setProgress(0);
            return;
          }
        }

        console.log("Sending evaluation request with data:", {...requestData, api_key: requestData.api_key ? "****" : undefined});
        
        // Make sure we have a valid API URL
        if (!API_URL) {
          throw new Error("Backend API URL is not configured. Please set the VITE_BACKEND_URL environment variable.");
        }
        
        const response = await axios.post(
          `${API_URL}/api/evaluate`,
          requestData,
          { 
            responseType: 'text',
            timeout: 60000 // 60 seconds timeout
          }
        );
        
        reportData = response.data;
      }
      
      // Set the report HTML and finish
      setReportHtml(reportData);
      setProgress(100);
      clearInterval(progressTimer);
      
    } catch (error) {
      console.error("Evaluation error:", error);
      
      // Provide detailed error information
      let errorMessage = "<p class='text-red-500 font-bold'>Error during evaluation:</p>";
      
      if (error.response) {
        // Server responded with error status code
        console.log("Error response data:", error.response.data);
        errorMessage += `<p class='text-red-500'>Server error: ${error.response.status} ${error.response.statusText}</p>`;
        if (typeof error.response.data === 'string') {
          errorMessage += `<p class='text-red-500'>${error.response.data}</p>`;
        } else {
          errorMessage += `<p class='text-red-500'>${JSON.stringify(error.response.data)}</p>`;
        }
      } else if (error.request) {
        // Request was made but no response received (timeout, cors, etc)
        errorMessage += "<p class='text-red-500'>No response received from the server. The server might be down or the endpoint URL may be incorrect.</p>";
        
        if (!isBackendAvailable && evaluationType === 'simple') {
          errorMessage += "<p class='text-red-500'><strong>Note:</strong> Backend API is not available. Try using the Comprehensive Test Suite option instead, which runs directly in the browser.</p>";
        }
        
        errorMessage += "<p class='text-red-500'>Please check:</p>";
        errorMessage += "<ul class='list-disc pl-8 text-red-500'>";
        errorMessage += "<li>The endpoint URL is correct</li>";
        errorMessage += "<li>The server is running and accessible</li>";
        errorMessage += "<li>Network connectivity is available</li>";
        errorMessage += "<li>CORS is properly configured on the server</li>";
        errorMessage += "</ul>";
        
        // Suggest demo mode
        errorMessage += "<p class='text-blue-500 mt-4'>You can also try the demo mode to see how the evaluation works without a real endpoint.</p>";
        
      } else {
        // Error in setting up the request
        errorMessage += `<p class='text-red-500'>${error.message || "Unknown error"}</p>`;
        
        if (error.message?.includes('Backend API URL is not configured')) {
          errorMessage += "<p class='text-red-500'>Please switch to the Comprehensive Test Suite option to evaluate your RAG system directly in the browser without requiring a backend.</p>";
        }
      }
      
      // Add debugging information
      errorMessage += `<div class='mt-4 p-3 bg-github-darkgray rounded text-xs text-gray-300'>
        <p class='font-semibold'>Debugging Information:</p>
        <p>Endpoint: ${ragEndpoint}</p>
        <p>Type: ${endpointType}</p>
        <p>Method: ${requestMethod}</p>
        <p>Backend Available: ${isBackendAvailable ? 'Yes' : 'No'}</p>
      </div>`;
      
      setReportHtml(errorMessage);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleDownloadReport = () => {
    if (!reportHtml) {
      alert('No evaluation results to download. Please run an evaluation first.');
      return;
    }
    
    setDownloadLoading(true);
    try {
      // Create a complete HTML document with necessary styles
      const fullHtml = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RAG Evaluation Report - ${new Date().toLocaleDateString()}</title>
  <style>
    :root {
      color-scheme: dark;
    }
    
    html, body {
      background-color: #0d1117;
      color: #e6edf3;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    
    .container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    
    .evaluation-report {
      color: #e6edf3;
    }
    
    .card-github {
      background-color: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
    }
    
    .text-white { color: #e6edf3; }
    .text-gray-300 { color: #9ca3af; }
    .text-gray-400 { color: #6e7681; }
    .text-gray-500 { color: #484f58; }
    .text-red-400, .text-red-500 { color: #ff5555; }
    .text-green-400, .text-green-500 { color: #7ee787; }
    .text-blue-500 { color: #58a6ff; }
    .text-yellow-500 { color: #f0883e; }
    .text-orange-500 { color: #db6d28; }
    
    .text-2xl { font-size: 1.5rem; }
    .text-xl { font-size: 1.25rem; }
    .text-lg { font-size: 1.125rem; }
    .text-sm { font-size: 0.875rem; }
    .text-xs { font-size: 0.75rem; }
    
    .font-bold { font-weight: 700; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    
    .bg-github-darkgray { background-color: #0d1117; }
    .bg-github-darkgray\/50 { background-color: rgba(13, 17, 23, 0.5); }
    
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-8 { margin-top: 2rem; }
    
    .ml-1 { margin-left: 0.25rem; }
    .ml-2 { margin-left: 0.5rem; }
    
    .p-2 { padding: 0.5rem; }
    .p-3 { padding: 0.75rem; }
    .p-4 { padding: 1rem; }
    .p-6 { padding: 1.5rem; }
    
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
    
    .rounded { border-radius: 0.25rem; }
    .rounded-md { border-radius: 0.375rem; }
    .rounded-lg { border-radius: 0.5rem; }
    
    .flex { display: flex; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .items-end { align-items: flex-end; }
    .justify-between { justify-content: space-between; }
    .flex-col { flex-direction: column; }
    .gap-1 { gap: 0.25rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .gap-6 { gap: 1.5rem; }
    
    .grid { display: grid; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .overflow-hidden { overflow: hidden; }
    .overflow-x-auto { overflow-x: auto; }
    
    .border { border-width: 1px; }
    .border-t { border-top-width: 1px; }
    .border-b { border-bottom-width: 1px; }
    .border-gray-700 { border-color: #2f3542; }
    .border-gray-800 { border-color: #24292f; }
    .border-github-border { border-color: #30363d; }
    
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    
    .space-y-2 > * + * { margin-top: 0.5rem; }
    .space-y-4 > * + * { margin-top: 1rem; }
    
    table { 
      width: 100%;
      border-collapse: collapse;
    }
    
    th, td {
      padding: 0.5rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid #30363d;
    }
    
    th {
      font-weight: 600;
    }
    
    .list-disc { list-style-type: disc; }
    .list-inside { list-style-position: inside; }
    
    /* Responsive grid */
    @media (min-width: 1024px) {
      .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <div class="container">
    ${reportHtml}
  </div>
</body>
</html>
      `;
      
      // Create a blob from the HTML
      const blob = new Blob([fullHtml], { type: 'text/html' });
      
      // Create download link and trigger it
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with date
      const now = new Date();
      const filename = `rag-evaluation-${now.toISOString().split('T')[0]}.html`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Report download error:", error);
      alert(`Error downloading report: ${error.message}`);
    } finally {
      setDownloadLoading(false);
    }
  };
  
  const toggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };

  return (
      <motion.div 
      className="flex flex-col gap-6"
      variants={containerVariants}
        initial="hidden"
        animate="visible"
      exit="exit"
    >
      {/* Input Section */}
      <div className="flex flex-col space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            RAG Endpoint URL
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={ragEndpoint}
                onChange={(e) => setRagEndpoint(e.target.value)}
                placeholder={endpointType === 'openai' ? "https://api.openai.com/v1/chat/completions" : "https://your-rag-endpoint.com/api"}
                className="w-full bg-github-darkgray border border-github-border py-2 px-10 rounded-md text-white text-sm focus:border-github-blue focus:outline-none focus:ring-1 focus:ring-github-blue"
                disabled={isDemoMode}
              />
              {isDemoMode && <div className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-0.5 rounded-sm bg-blue-500/20 text-xs text-blue-400">Demo Mode</div>}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleEvaluate(false)}
              disabled={loading}
              className={`px-4 py-2 bg-apple-blue text-white font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-apple-blue/90'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Evaluate
                </>
              )}
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={runDemoMode}
              disabled={loading || isDemoMode}
              className={`px-3 py-1 border border-blue-500 text-blue-400 font-medium rounded-md flex items-center justify-center gap-1 transition-colors ${
                loading || isDemoMode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500/10'
              }`}
              title="Run a demo evaluation with simulated responses"
            >
              <Play className="h-3.5 w-3.5" />
              Demo
            </motion.button>
          </div>
          {isDemoMode && (
            <p className="text-xs text-blue-400 mt-1.5">
              Running in demo mode with simulated responses. {' '}
              <button 
                onClick={() => {
                  setRagEndpoint('');
                  setIsDemoMode(false);
                  window.DEMO_MODE = false;
                }} 
                className="text-blue-500 hover:underline"
              >
                Exit Demo Mode
              </button>
            </p>
          )}
        </div>
            
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              API Key {endpointType === 'openai' && <span className="text-xs text-red-400">(Required for OpenAI)</span>}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={endpointType === 'openai' ? "Your OpenAI API key" : "Your API key if required"}
                className="w-full bg-github-darkgray border border-github-border py-2 px-10 rounded-md text-white text-sm focus:border-github-blue focus:outline-none focus:ring-1 focus:ring-github-blue"
              />
              <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {endpointType === 'openai' && (
              <p className="text-xs text-gray-400 mt-1">
                For OpenAI endpoints, a valid API key must be provided.
              </p>
            )}
          </div>
        </div>

        {/* Evaluation Type */}
        <div className="flex items-center gap-4 p-3 bg-github-darkgray/50 border border-github-border rounded-md">
          <div className="text-sm font-medium text-gray-300">Evaluation Type:</div>
          <div className="flex gap-4">
            <label className={`flex items-center gap-2 ${!isBackendAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="radio"
                name="evaluationType"
                value="simple"
                checked={evaluationType === 'simple'}
                onChange={() => setEvaluationType('simple')}
                disabled={!isBackendAvailable}
                className="h-4 w-4 text-github-blue focus:ring-github-blue"
              />
              <span className="text-sm">Simple Evaluation</span>
              {!isBackendAvailable && (
                <span className="text-xs text-yellow-400 ml-1">(Requires backend)</span>
              )}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="evaluationType"
                value="comprehensive"
                checked={evaluationType === 'comprehensive'}
                onChange={() => setEvaluationType('comprehensive')}
                className="h-4 w-4 text-github-blue focus:ring-github-blue"
              />
              <div className="flex items-center gap-1">
                <span className="text-sm">Comprehensive Test Suite</span>
                <Beaker className="h-4 w-4 text-github-blue" />
              </div>
            </label>
          </div>
        </div>
            
        {/* Advanced Settings Button */}
        <div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={toggleAdvanced}
            className="group flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            <Settings size={14} className="text-gray-500 group-hover:text-gray-400" />
            Advanced Configuration
            <ChevronDown 
              size={14} 
              className={`text-gray-500 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : 'rotate-0'}`} 
            />
          </motion.button>
        </div>
            
        {/* Advanced Settings */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 border-t border-github-border pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Endpoint Type
                  </label>
                  <div className="relative">
                    <Cpu className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={endpointType}
                      onChange={(e) => setEndpointType(e.target.value)}
                      className="w-full bg-github-darkgray border border-github-border py-2 pl-10 pr-4 rounded-md text-white text-sm focus:border-github-blue focus:outline-none focus:ring-1 focus:ring-github-blue appearance-none"
                    >
                      <option value="generic">Generic RAG</option>
                      <option value="openai">OpenAI compatible</option>
                      <option value="anthropic">Anthropic compatible</option>
                      <option value="custom">Custom (specify format)</option>
                    </select>
                  </div>
                </div>
                        
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Request Method
                  </label>
                  <div className="relative">
                    <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={requestMethod}
                      onChange={(e) => setRequestMethod(e.target.value)}
                      className="w-full bg-github-darkgray border border-github-border py-2 pl-10 pr-4 rounded-md text-white text-sm focus:border-github-blue focus:outline-none focus:ring-1 focus:ring-github-blue appearance-none"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Response Path
                  </label>
                  <div className="relative">
                    <LayoutList className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={responsePath}
                      onChange={(e) => setResponsePath(e.target.value)}
                      placeholder="Field path to extract answer"
                      className="w-full bg-github-darkgray border border-github-border py-2 px-10 rounded-md text-white text-sm focus:border-github-blue focus:outline-none focus:ring-1 focus:ring-github-blue"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Path to extract answer from response (e.g. "answer" or "response.result")
                  </p>
                </div>
                      
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Custom Headers (JSON)
                  </label>
                  <textarea
                    value={customHeaders}
                    onChange={(e) => setCustomHeaders(e.target.value)}
                    placeholder='{"Authorization": "Bearer YOUR_TOKEN"}'
                    className="w-full bg-github-darkgray border border-github-border py-2 px-3 rounded-md text-white text-sm focus:border-github-blue focus:outline-none focus:ring-1 focus:ring-github-blue h-24 font-mono"
                  />
                </div>

                {endpointType === 'custom' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Custom Request Format (JSON)
                    </label>
                    <textarea
                      value={customFormat}
                      onChange={(e) => setCustomFormat(e.target.value)}
                      placeholder='{"query": "{{query}}", "options": {"temperature": 0.7}}'
                      className="w-full bg-github-darkgray border border-github-border py-2 px-3 rounded-md text-white text-sm focus:border-github-blue focus:outline-none focus:ring-1 focus:ring-github-blue h-24 font-mono"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Use {{query}} to specify where the test question should be inserted
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar during evaluation */}
      {loading && (
        <div className="w-full">
          <div className="h-1 w-full bg-github-darkgray rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-github-blue"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{evaluationType === 'comprehensive' ? 'Running comprehensive test suite...' : 'Evaluating RAG System'}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      {/* Results Section */}
      {reportHtml && (
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Evaluation Results</h3>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleDownloadReport}
              disabled={downloadLoading}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-github-darkgray border border-github-border hover:bg-github-darkgray/80 text-white transition-colors ${
                downloadLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {downloadLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileOutput className="h-4 w-4" />
              )}
              {downloadLoading ? 'Creating Report...' : 'Download HTML Report'}
            </motion.button>
          </div>
          
          <div className="bg-github-darkgray border border-github-border rounded-md p-4">
            <div className="prose prose-sm max-w-none prose-invert" dangerouslySetInnerHTML={{ __html: reportHtml }} />
          </div>
        </div>
      )}
          
      {/* Info card at the bottom */}
      <div className="flex items-start gap-3 p-4 bg-github-darkgray/60 border border-github-border rounded-md mt-2">
        <div className="mt-0.5">
          <Info className="h-5 w-5 text-github-blue" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-white mb-1">About RAG Evaluation</h4>
          <p className="text-sm text-gray-400">
            {evaluationType === 'comprehensive' 
              ? "The comprehensive test suite evaluates your RAG system across multiple categories including factual knowledge, reasoning, hallucination detection, and more. Results include detailed metrics for each test case."
              : "The ARGUS evaluation platform assesses your RAG system's performance by submitting test questions, comparing responses to ground truth answers, and evaluating key metrics like accuracy, relevance, and hallucination detection."
            }
          </p>
          {!isBackendAvailable && !isDemoMode && (
            <p className="text-xs text-yellow-400 mt-2">
              Backend server not detected. Running in browser-only mode using the Comprehensive Test Suite.
            </p>
          )}
          {isDemoMode && (
            <p className="text-xs text-blue-400 mt-2">
              You're in demo mode with simulated responses. To evaluate a real endpoint, exit demo mode and enter your RAG endpoint URL.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default QueryComponent;

