import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Download, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL;

function QueryComponent() {
  const [ragEndpoint, setRagEndpoint] = useState('');
  const [reportHtml, setReportHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleEvaluate = async () => {
    setLoading(true);
    setReportHtml('');
    setProgress(0);
    setShowResults(false);
    
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
      setTimeout(() => setShowResults(true), 300);
    } catch (error) {
      console.error(error);
      setReportHtml("<p class='text-red-500'>Error generating report.</p>");
      setShowResults(true);
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
      <header className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-cybergen-dark font-poppins mb-4 tracking-tight">
              RAG Evaluation System
            </h1>
            <p className="text-lg text-gray-600 font-poppins opacity-90">
              Enter your RAG endpoint URL to evaluate its performance
            </p>
          </div>
        </div>
      </header>

      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-sm rounded-xl p-8 mb-8 border border-gray-100 transition-all duration-300 hover:shadow-md">
            <div className="flex gap-4">
              <input
                type="text"
                value={ragEndpoint}
                onChange={(e) => setRagEndpoint(e.target.value)}
                placeholder="Enter RAG endpoint URL"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cybergen-blue/20 focus:border-cybergen-blue transition-all duration-200 font-poppins text-gray-700"
              />
              <Button
                onClick={handleEvaluate}
                disabled={loading || !ragEndpoint}
                className="bg-cybergen-blue hover:bg-blue-600 text-white font-poppins min-w-[120px] transition-all duration-200 ease-out transform hover:translate-y-[-1px] hover:shadow-md disabled:transform-none disabled:hover:shadow-none"
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Evaluating
                  </div>
                ) : (
                  'Evaluate'
                )}
              </Button>
            </div>
            
            {progress > 0 && (
              <div className="mt-6 transform transition-all duration-300 ease-out">
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-cybergen-blue h-1.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-3 text-center font-poppins animate-fade-in">
                  Evaluating... {progress}%
                </p>
              </div>
            )}
          </div>

          {reportHtml && (
            <div 
              className={`bg-white shadow-sm rounded-xl p-8 border border-gray-100 transition-all duration-500 ease-out transform ${
                showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-cybergen-dark font-poppins tracking-tight">
                  Evaluation Results
                </h2>
                <Button
                  onClick={handleDownloadPDF}
                  variant="outline"
                  disabled={downloadLoading}
                  className="border-cybergen-blue text-cybergen-blue hover:bg-cybergen-blue hover:text-white font-poppins transition-all duration-200 ease-out transform hover:translate-y-[-1px] hover:shadow-md disabled:transform-none disabled:hover:shadow-none min-w-[160px]"
                >
                  {downloadLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </div>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
              <div
                className="prose max-w-none font-poppins"
                dangerouslySetInnerHTML={{ __html: reportHtml }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default QueryComponent;

