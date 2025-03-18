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
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      exit="exit"
      className="flex flex-col gap-8"
    >
      {/* Evaluation Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="flex items-center gap-2 text-sm dark:text-gray-300 text-gray-700 font-medium mb-2">
              <Globe className="h-4 w-4 dark:text-gray-400 text-gray-500" />
              RAG Endpoint URL
            </label>
            <input
              type="text"
              value={ragEndpoint}
              onChange={(e) => setRagEndpoint(e.target.value)}
              placeholder="https://your-rag-api-endpoint.com/query"
              className="px-3.5 py-2.5 bg-transparent border dark:border-github-border border-gray-300 rounded-md text-sm dark:text-gray-300 text-gray-800 focus:outline-none focus:ring-1 focus:ring-apple-blue"
            />
          </div>
          <div className="flex flex-col">
            <label className="flex items-center gap-2 text-sm dark:text-gray-300 text-gray-700 font-medium mb-2">
              <Key className="h-4 w-4 dark:text-gray-400 text-gray-500" />
              API Key (Optional)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your API Key"
              className="px-3.5 py-2.5 bg-transparent border dark:border-github-border border-gray-300 rounded-md text-sm dark:text-gray-300 text-gray-800 focus:outline-none focus:ring-1 focus:ring-apple-blue"
            />
          </div>
          
          {/* Collapsible Advanced Settings */}
          <div>
            <button
              onClick={toggleAdvanced}
              className="flex items-center gap-2 text-sm dark:text-gray-300 text-gray-700 font-medium mt-2"
            >
              <Settings className="h-4 w-4 dark:text-gray-400 text-gray-500" />
              Advanced Settings
              <ChevronDown className={`h-4 w-4 dark:text-gray-400 text-gray-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-4 mt-4 border-t dark:border-github-border border-gray-200 pt-4">
                    <div className="flex flex-col">
                      <label className="flex items-center gap-2 text-sm dark:text-gray-300 text-gray-700 font-medium mb-2">
                        <Code className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                        Endpoint Type
                      </label>
                      <select
                        value={endpointType}
                        onChange={(e) => setEndpointType(e.target.value)}
                        className="px-3.5 py-2.5 bg-transparent border dark:border-github-border border-gray-300 rounded-md text-sm dark:text-gray-300 text-gray-800 focus:outline-none focus:ring-1 focus:ring-apple-blue"
                      >
                        <option value="openai" className="dark:bg-github-darkgray bg-white">OpenAI-compatible</option>
                        <option value="anthropic" className="dark:bg-github-darkgray bg-white">Anthropic-compatible</option>
                        <option value="custom" className="dark:bg-github-darkgray bg-white">Custom</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col">
                      <label className="flex items-center gap-2 text-sm dark:text-gray-300 text-gray-700 font-medium mb-2">
                        <LayoutList className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                        Request Method
                      </label>
                      <select
                        value={requestMethod}
                        onChange={(e) => setRequestMethod(e.target.value)}
                        className="px-3.5 py-2.5 bg-transparent border dark:border-github-border border-gray-300 rounded-md text-sm dark:text-gray-300 text-gray-800 focus:outline-none focus:ring-1 focus:ring-apple-blue"
                      >
                        <option value="POST" className="dark:bg-github-darkgray bg-white">POST</option>
                        <option value="GET" className="dark:bg-github-darkgray bg-white">GET</option>
                      </select>
                    </div>
                    
                    {/* More advanced fields based on selected endpointType */}
                    {endpointType === 'custom' && (
                      <>
                        <div className="flex flex-col">
                          <label className="flex items-center gap-2 text-sm dark:text-gray-300 text-gray-700 font-medium mb-2">
                            <Shield className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                            Custom Headers (JSON)
                          </label>
                          <textarea
                            value={customHeaders}
                            onChange={(e) => setCustomHeaders(e.target.value)}
                            placeholder='{"Authorization": "Bearer YOUR_TOKEN", "Content-Type": "application/json"}'
                            rows={3}
                            className="px-3.5 py-2.5 bg-transparent border dark:border-github-border border-gray-300 rounded-md text-sm dark:text-gray-300 text-gray-800 focus:outline-none focus:ring-1 focus:ring-apple-blue"
                          ></textarea>
                        </div>
                        
                        <div className="flex flex-col">
                          <label className="flex items-center gap-2 text-sm dark:text-gray-300 text-gray-700 font-medium mb-2">
                            <Cpu className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                            Custom Request Format (JSON)
                          </label>
                          <textarea
                            value={customFormat}
                            onChange={(e) => setCustomFormat(e.target.value)}
                            placeholder='{"query": "{{query}}", "options": {"temperature": 0.7}}'
                            rows={3}
                            className="px-3.5 py-2.5 bg-transparent border dark:border-github-border border-gray-300 rounded-md text-sm dark:text-gray-300 text-gray-800 focus:outline-none focus:ring-1 focus:ring-apple-blue"
                          ></textarea>
                        </div>
                      </>
                    )}
                    
                    <div className="flex flex-col">
                      <label className="flex items-center gap-2 text-sm dark:text-gray-300 text-gray-700 font-medium mb-2">
                        <FileOutput className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                        Response Path
                      </label>
                      <input
                        type="text"
                        value={responsePath}
                        onChange={(e) => setResponsePath(e.target.value)}
                        placeholder="choices.0.message.content"
                        className="px-3.5 py-2.5 bg-transparent border dark:border-github-border border-gray-300 rounded-md text-sm dark:text-gray-300 text-gray-800 focus:outline-none focus:ring-1 focus:ring-apple-blue"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="flex items-center gap-2 text-sm dark:text-gray-300 text-gray-700 font-medium mb-2">
              <Beaker className="h-4 w-4 dark:text-gray-400 text-gray-500" />
              Evaluation Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setEvaluationType('simple')}
                disabled={!isBackendAvailable}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-colors text-sm font-medium ${
                  evaluationType === 'simple'
                    ? 'bg-apple-blue text-white'
                    : 'dark:bg-github-darkgray/80 bg-gray-100 dark:text-gray-300 text-gray-700 dark:hover:bg-github-darkgray hover:bg-gray-200'
                } ${!isBackendAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Simple
              </button>
              <button
                onClick={() => setEvaluationType('comprehensive')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-colors text-sm font-medium ${
                  evaluationType === 'comprehensive'
                    ? 'bg-apple-blue text-white'
                    : 'dark:bg-github-darkgray/80 bg-gray-100 dark:text-gray-300 text-gray-700 dark:hover:bg-github-darkgray hover:bg-gray-200'
                }`}
              >
                Comprehensive
              </button>
            </div>
            
            <div className="mt-2">
              <div className="flex items-start gap-2 p-3 rounded-md dark:bg-github-darkgray/80 bg-gray-100 text-xs">
                <Info className="h-3.5 w-3.5 min-w-[14px] dark:text-gray-400 text-gray-500 mt-0.5" />
                <div className="dark:text-gray-300 text-gray-700">
                  {evaluationType === 'simple' 
                    ? "Simple evaluation runs basic connectivity and response tests against your RAG system."
                    : "Comprehensive evaluation performs in-depth analysis of response quality, latency, and reliability."}
                  {!isBackendAvailable && (
                    <p className="mt-1 text-yellow-500">
                      <AlertCircle className="h-3.5 w-3.5 inline-block mr-1" />
                      Backend API not available. Running client-side evaluation only.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleEvaluate()}
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-apple-blue rounded-md font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Evaluating ({progress}%)
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Evaluate RAG System
                  </>
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading}
                onClick={runDemoMode}
                className="min-w-10 h-10 flex items-center justify-center rounded-md dark:bg-github-darkgray/80 bg-gray-100 border dark:border-github-border border-gray-200 dark:text-gray-300 text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Run Demo"
              >
                <Play className="h-4 w-4" />
              </motion.button>
            </div>
            
            {reportHtml && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadReport}
                disabled={downloadLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 dark:bg-github-darkgray/80 bg-gray-100 border dark:border-github-border border-gray-200 rounded-md font-medium dark:text-white text-gray-700 mt-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {downloadLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download Report
              </motion.button>
            )}
          </div>
        </div>
      </div>
      
      {/* Results Section */}
      <AnimatePresence mode="wait">
        {reportHtml ? (
          <motion.div
            key="results"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium dark:text-white text-gray-900">Evaluation Results</h3>
              <span className="text-sm dark:text-gray-400 text-gray-500">
                <FileText className="h-4 w-4 inline mr-1" />
                {evaluationType === 'simple' ? 'Basic Report' : 'Comprehensive Analysis'}
              </span>
            </div>
            
            <div className="prose prose-sm dark:prose-invert max-w-none p-6 border dark:border-github-border border-gray-200 rounded-md dark:bg-github-darkgray/60 bg-white/80 overflow-auto">
              <div 
                dangerouslySetInnerHTML={{ __html: reportHtml }} 
                className="min-h-[300px] max-h-[600px] overflow-auto"
              />
            </div>
          </motion.div>
        ) : loading ? (
          <motion.div
            key="loading"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center justify-center gap-6 py-12"
          >
            <div className="relative h-32 w-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    className="text-apple-blue"
                    strokeDasharray={`${2 * Math.PI * 40 * progress / 100} ${2 * Math.PI * 40 * (100 - progress) / 100}`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold dark:text-white text-gray-900">{progress}%</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-medium dark:text-white text-gray-900 mb-2">Evaluating RAG System</h3>
              <p className="text-sm dark:text-gray-400 text-gray-600 max-w-md">
                {evaluationType === 'comprehensive' ? 
                  <TypeWriter text="Running comprehensive analysis of your system. This includes response quality, latency tests, and reliability metrics..." /> :
                  <TypeWriter text="Testing connectivity and basic responses from your RAG endpoint..." />
                }
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export default QueryComponent;

