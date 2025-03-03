import React, { useState } from 'react';
import axios from 'axios';

function QueryComponent() {
  const [ragEndpoint, setRagEndpoint] = useState('');
  const [reportHtml, setReportHtml] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEvaluate = async () => {
    setLoading(true);
    setReportHtml('');
    try {
      const response = await axios.post(
        'http://localhost:8001/api/evaluate',
        { rag_endpoint: ragEndpoint },
        { responseType: 'text' }
      );
      setReportHtml(response.data);
    } catch (error) {
      console.error(error);
      setReportHtml("<p>Error generating report.</p>");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>RAG System Evaluation</h1>
      <div>
        <input
          type="text"
          value={ragEndpoint}
          onChange={(e) => setRagEndpoint(e.target.value)}
          placeholder="Enter RAG API endpoint"
          style={{ width: "400px", padding: "10px" }}
        />
        <button
          onClick={handleEvaluate}
          disabled={loading}
          style={{ marginLeft: "10px", padding: "10px" }}
        >
          {loading ? "Evaluating..." : "Evaluate"}
        </button>
      </div>
      {reportHtml && (
        <div style={{ marginTop: "20px" }}>
          <h3>Evaluation Report:</h3>
          <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
        </div>
      )}
    </div>
  );
}

export default QueryComponent;






// // src/Components/QueryComponent.jsx
// import React, { useState } from 'react';
// import axios from 'axios';

// function QueryComponent() {
//   // For single query functionality
//   const [query, setQuery] = useState('');
//   const [answer, setAnswer] = useState('');
//   const [loading, setLoading] = useState(false);

//   // For evaluation report functionality
//   const [evalKey, setEvalKey] = useState('');
//   const [reportHtml, setReportHtml] = useState('');
//   const [reportLoading, setReportLoading] = useState(false);

//   // Function to submit a query
//   const handleQuery = async () => {
//     setLoading(true);
//     setAnswer('');
//     try {
//       const response = await axios.post('http://localhost:8001/api/query', { prompt: query });
//       setAnswer(response.data.answer);
//     } catch (error) {
//       console.error(error);
//       setAnswer("Error: Unable to fetch answer.");
//     }
//     setLoading(false);
//   };

//   // Function to generate the evaluation report
//   const handleEvaluateReport = async () => {
//     setReportLoading(true);
//     setReportHtml('');
//     try {
//       const response = await axios.post(
//         'http://localhost:8001/api/evaluate-report',
//         { endpoint_key: evalKey },
//         { responseType: 'text' }
//       );
//       setReportHtml(response.data);
//     } catch (error) {
//       console.error(error);
//       setReportHtml("<p>Error generating report.</p>");
//     }
//     setReportLoading(false);
//   };

//   return (
//     <div style={{ padding: "20px" }}>
//       <h1>RAG System Interface</h1>
      
//       {/* Query Section */}
//       <div style={{ marginBottom: "40px" }}>
//         <h2>Query the RAG API</h2>
//         <input
//           type="text"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           placeholder="Enter your query"
//           style={{ width: "300px", padding: "10px" }}
//         />
//         <button
//           onClick={handleQuery}
//           disabled={loading}
//           style={{ marginLeft: "10px", padding: "10px" }}
//         >
//           {loading ? "Loading..." : "Submit Query"}
//         </button>
//         {answer && (
//           <div style={{ marginTop: "20px" }}>
//             <h3>Generated Response:</h3>
//             <p>{answer}</p>
//           </div>
//         )}
//       </div>

//       {/* Evaluation Report Section */}
//       <div>
//         <h2>Evaluate &amp; Generate Report</h2>
//         <input
//           type="text"
//           value={evalKey}
//           onChange={(e) => setEvalKey(e.target.value)}
//           placeholder="Enter API endpoint key"
//           style={{ width: "300px", padding: "10px" }}
//         />
//         <button
//           onClick={handleEvaluateReport}
//           disabled={reportLoading}
//           style={{ marginLeft: "10px", padding: "10px" }}
//         >
//           {reportLoading ? "Evaluating..." : "Evaluate Report"}
//         </button>
//         {reportHtml && (
//           <div style={{ marginTop: "20px" }}>
//             <h3>Evaluation Report:</h3>
//             <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default QueryComponent;



// // // src/Components/QueryComponent.jsx
// // import React, { useState } from 'react';
// // import axios from 'axios';

// // function QueryComponent() {
// //   // For single query
// //   const [query, setQuery] = useState('');
// //   const [answer, setAnswer] = useState('');
// //   const [loading, setLoading] = useState(false);

// //   // For evaluation report
// //   const [evalKey, setEvalKey] = useState('');
// //   const [reportHtml, setReportHtml] = useState('');
// //   const [reportLoading, setReportLoading] = useState(false);

// //   const handleQuery = async () => {
// //     setLoading(true);
// //     setAnswer('');
// //     try {
// //       const response = await axios.post('http://localhost:8001/api/query', { prompt: query });
// //       setAnswer(response.data.answer);
// //     } catch (error) {
// //       console.error(error);
// //       setAnswer("Error: Unable to fetch answer.");
// //     }
// //     setLoading(false);
// //   };

// //   const handleEvaluateReport = async () => {
// //     setReportLoading(true);
// //     setReportHtml('');
// //     try {
// //       // The responseType 'text' is important to retrieve HTML content as a string
// //       const response = await axios.post(
// //         'http://localhost:8001/api/evaluate-report',
// //         { endpoint_key: evalKey },
// //         { responseType: 'text' }
// //       );
// //       setReportHtml(response.data);
// //     } catch (error) {
// //       console.error(error);
// //       setReportHtml("<p>Error generating report.</p>");
// //     }
// //     setReportLoading(false);
// //   };

// //   return (
// //     <div style={{ padding: "20px" }}>
// //       <h1>RAG System Interface</h1>
// //       {/* Query Section */}
// //       <div style={{ marginBottom: "40px" }}>
// //         <h2>Query the RAG API</h2>
// //         <input
// //           type="text"
// //           value={query}
// //           onChange={(e) => setQuery(e.target.value)}
// //           placeholder="Enter your query or endpoint key"
// //           style={{ width: "300px", padding: "10px" }}
// //         />
// //         <button
// //           onClick={handleQuery}
// //           disabled={loading}
// //           style={{ marginLeft: "10px", padding: "10px" }}
// //         >
// //           {loading ? "Loading..." : "Submit Query"}
// //         </button>
// //         {answer && (
// //           <div style={{ marginTop: "20px" }}>
// //             <h3>Generated Response:</h3>
// //             <p>{answer}</p>
// //           </div>
// //         )}
// //       </div>

// //       {/* Evaluation Report Section */}
// //       <div>
// //         <h2>Evaluate &amp; Generate Report</h2>
// //         <input
// //           type="text"
// //           value={evalKey}
// //           onChange={(e) => setEvalKey(e.target.value)}
// //           placeholder="Enter API endpoint key"
// //           style={{ width: "300px", padding: "10px" }}
// //         />
// //         <button
// //           onClick={handleEvaluateReport}
// //           disabled={reportLoading}
// //           style={{ marginLeft: "10px", padding: "10px" }}
// //         >
// //           {reportLoading ? "Evaluating..." : "Evaluate Report"}
// //         </button>
// //         {reportHtml && (
// //           <div style={{ marginTop: "20px" }}>
// //             <h3>Evaluation Report:</h3>
// //             <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // export default QueryComponent;



// // // src/Components/QueryComponent.jsx
// // import React, { useState } from 'react';
// // import axios from 'axios';

// // function QueryComponent() {
// //   const [query, setQuery] = useState('');
// //   const [answer, setAnswer] = useState('');
// //   const [evaluation, setEvaluation] = useState(null);
// //   const [loading, setLoading] = useState(false);
// //   const [evalLoading, setEvalLoading] = useState(false);

// //   const handleQuery = async () => {
// //     setLoading(true);
// //     setAnswer('');
// //     try {
// //       const response = await axios.post('http://localhost:8001/api/query', { prompt: query });
// //       setAnswer(response.data.answer);
// //     } catch (error) {
// //       console.error(error);
// //       setAnswer("Error: Unable to fetch answer.");
// //     }
// //     setLoading(false);
// //   };

// //   const handleEvaluation = async () => {
// //     setEvalLoading(true);
// //     setEvaluation(null);
// //     try {
// //       const response = await axios.get('http://localhost:8001/api/evaluate');
// //       setEvaluation(response.data);
// //     } catch (error) {
// //       console.error(error);
// //       setEvaluation({ error: "Error: Unable to evaluate." });
// //     }
// //     setEvalLoading(false);
// //   };

// //   return (
// //     <div style={{ padding: "20px" }}>
// //       <h1>RAG System Interface</h1>
// //       <div style={{ marginBottom: "20px" }}>
// //         <h2>Query Endpoint</h2>
// //         <input
// //           type="text"
// //           value={query}
// //           onChange={(e) => setQuery(e.target.value)}
// //           placeholder="Enter endpoint key (query)"
// //           style={{ width: "300px", padding: "10px" }}
// //         />
// //         <button onClick={handleQuery} disabled={loading} style={{ marginLeft: "10px", padding: "10px" }}>
// //           {loading ? "Loading..." : "Submit Query"}
// //         </button>
// //         {answer && (
// //           <div style={{ marginTop: "20px" }}>
// //             <h3>Generated Response:</h3>
// //             <p>{answer}</p>
// //           </div>
// //         )}
// //       </div>

// //       <div style={{ marginTop: "40px" }}>
// //         <h2>Evaluate and Generate Report</h2>
// //         <button onClick={handleEvaluation} disabled={evalLoading} style={{ padding: "10px" }}>
// //           {evalLoading ? "Evaluating..." : "Evaluate"}
// //         </button>
// //         {evaluation && (
// //           <div style={{ marginTop: "20px" }}>
// //             {evaluation.error ? (
// //               <p>{evaluation.error}</p>
// //             ) : (
// //               <>
// //                 <h3>Evaluation Metrics:</h3>
// //                 <ul>
// //                   <li>Context Recall: {evaluation.context_recall}</li>
// //                   <li>Faithfulness: {evaluation.faithfulness}</li>
// //                   <li>Factual Correctness: {evaluation.factual_correctness}</li>
// //                 </ul>
// //                 {/* If you later expose the HTML report via an endpoint, you could add a link here */}
// //                 {/* <a href="http://localhost:8001/report" target="_blank" rel="noopener noreferrer">
// //                   View Evaluation Report
// //                 </a> */}
// //               </>
// //             )}
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // export default QueryComponent;



// // // QueryComponent.jsx
// // import React, { useState } from 'react';
// // import axios from 'axios';

// // function QueryComponent() {
// //   const [prompt, setPrompt] = useState('');
// //   const [answer, setAnswer] = useState('');
// //   const [loading, setLoading] = useState(false);

// //   const handleQuery = async () => {
// //     setLoading(true);
// //     try {
// //       const response = await axios.post('http://localhost:8001/api/query', { prompt });
// //       setAnswer(response.data.answer);
// //     } catch (error) {
// //       console.error(error);
// //       setAnswer("Error: Unable to fetch answer.");
// //     }
// //     setLoading(false);
// //   };

// //   return (
// //     <div style={{ padding: "20px" }}>
// //       <h1>Query the RAG System</h1>
// //       <input
// //         type="text"
// //         value={prompt}
// //         onChange={(e) => setPrompt(e.target.value)}
// //         placeholder="Enter your query"
// //         style={{ width: "300px", padding: "10px" }}
// //       />
// //       <button onClick={handleQuery} disabled={loading} style={{ marginLeft: "10px", padding: "10px" }}>
// //         {loading ? "Loading..." : "Submit"}
// //       </button>
// //       <div style={{ marginTop: "20px" }}>
// //         <h2>Answer:</h2>
// //         <p>{answer}</p>
// //       </div>
// //     </div>
// //   );
// // }

// // export default QueryComponent;
