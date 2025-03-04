import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

const API_URL = import.meta.env.MODE === 'production' 
  ? import.meta.env.VITE_PRODUCTION_API_URL 
  : import.meta.env.VITE_API_URL;

function QueryComponent() {
  const [ragEndpoint, setRagEndpoint] = useState('');
  const [reportHtml, setReportHtml] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEvaluate = async () => {
    setLoading(true);
    setReportHtml('');
    try {
      const response = await axios.post(
        `${API_URL}/api/evaluate`,
        { rag_endpoint: ragEndpoint },
        { responseType: 'text' }
      );
      setReportHtml(response.data);
    } catch (error) {
      console.error(error);
      setReportHtml("<p class='text-red-500'>Error generating report.</p>");
    }
    setLoading(false);
  };

  const handleDownloadPDF = async () => {
    if (!ragEndpoint) return;
    
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
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-cybergen-dark font-poppins mb-8">
            RAG Evaluation System
          </h1>
          <p className="text-xl text-gray-600 font-poppins mb-8">
            Enter your RAG endpoint URL to evaluate its performance
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={ragEndpoint}
              onChange={(e) => setRagEndpoint(e.target.value)}
              placeholder="Enter RAG endpoint URL"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cybergen-blue focus:border-transparent font-poppins text-gray-700"
            />
            <Button
              onClick={handleEvaluate}
              disabled={loading || !ragEndpoint}
              className="bg-cybergen-blue hover:bg-blue-600 text-white font-poppins"
            >
              {loading ? 'Evaluating...' : 'Evaluate'}
            </Button>
          </div>
        </div>

        {reportHtml && (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-cybergen-dark font-poppins">
                Evaluation Results
              </h2>
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="border-cybergen-blue text-cybergen-blue hover:bg-cybergen-blue hover:text-white font-poppins transition-colors"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
            <div
              className="prose max-w-none font-poppins"
              dangerouslySetInnerHTML={{ __html: reportHtml }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default QueryComponent;

