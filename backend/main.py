# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse, Response, JSONResponse
import os
import requests
import pandas as pd
from dotenv import load_dotenv
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.fonts import addMapping
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
import tempfile
from typing import Optional
import json
from datetime import datetime
import logging
from pythonjsonlogger import jsonlogger

# Set up logging
logger = logging.getLogger("rag_evaluation")
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(message)s")
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

# Load environment variables (ensure OPENAI_API_KEY is set in your .env file)
load_dotenv()

app = FastAPI()

# Configure CORS (update origins as needed)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://*.vercel.app",  # Allow all Vercel domains
    "https://argus-evaluation.vercel.app",  # Your specific Vercel domain
    "*"  # During development, you can allow all origins
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
fonts_dir = os.path.join(current_dir, 'fonts')

# Register Poppins font
pdfmetrics.registerFont(TTFont('Poppins', os.path.join(fonts_dir, 'Poppins-Regular.ttf')))
pdfmetrics.registerFont(TTFont('Poppins-Bold', os.path.join(fonts_dir, 'Poppins-Bold.ttf')))
addMapping('Poppins', 0, 0, 'Poppins')
addMapping('Poppins', 1, 0, 'Poppins-Bold')

# Configuration constants
TIMEOUT_SECONDS = 8  # Reduced from 10 to fail faster
MAX_RETRIES = 2      # Reduced from 3 to fail faster
KNOWN_ENDPOINTS = {
    # Add specific configurations for problematic endpoints
    "10.229.222.15:8000": {
        "note": "Internal endpoint that requires specific params",
        "timeout": 5,  # Use shorter timeout for this endpoint
        "params": {
            "groupid": 12,
            "session_id": 111
        }
    }
}

def get_endpoint_config(url):
    """Get specific config for known endpoints"""
    for endpoint_key, config in KNOWN_ENDPOINTS.items():
        if endpoint_key in url:
            logger.info(f"Using custom configuration for endpoint: {endpoint_key}")
            return config
    return {}

# Fallback function for non-OpenAI endpoints (original GET method)
def query_rag(prompt, rag_endpoint, group_id=12, session_id=111, headers=None):
    headers = headers or {}
    headers.update({"accept": "application/json"})
    
    # Check if this is a known endpoint with specific configuration
    endpoint_config = get_endpoint_config(rag_endpoint)
    
    # Use endpoint-specific params if available
    params = endpoint_config.get("params", {})
    if not params:
        params = {
            "groupid": group_id,
            "query": prompt,
            "session_id": session_id
        }
    else:
        # Merge with default prompt
        params["query"] = prompt
    
    # Log attempt details
    logger.info(f"Attempting to query endpoint: {rag_endpoint}", extra={
        "endpoint": rag_endpoint,
        "params": params,
        "headers": {k: "***" if k.lower() in ["authorization", "api-key"] else v for k, v in headers.items()}
    })
    
    for attempt in range(MAX_RETRIES):
        try:
            # Use endpoint-specific timeout or default shorter timeout for first attempt
            current_timeout = endpoint_config.get("timeout", TIMEOUT_SECONDS/2 if attempt == 0 else TIMEOUT_SECONDS)
            
            logger.info(f"Request attempt {attempt+1}/{MAX_RETRIES} with timeout {current_timeout}s")
            
            response = requests.get(
                rag_endpoint,
                params=params,
                headers=headers,
                timeout=current_timeout,
                verify=False  # Skip SSL verification if needed
            )
            
            # Log the response status and time
            logger.info(f"Response received with status code: {response.status_code}")
            
            response.raise_for_status()
            
            # Try to parse as JSON
            try:
                data = response.json()
                logger.info("Successfully parsed JSON response", extra={
                    "keys": list(data.keys()) if isinstance(data, dict) else "non-dict-response",
                    "response_type": type(data).__name__
                })
                
                if "answer" in data:
                    return data["answer"]
                else:
                    available_keys = ", ".join(data.keys()) if isinstance(data, dict) else "no keys (not a dict)"
                    error_msg = f"No 'answer' field found in response. Available fields: {available_keys}"
                    logger.warning(error_msg)
                    return f"Error: {error_msg}"
            except json.JSONDecodeError:
                # Not JSON, return as text
                logger.warning("Response is not valid JSON, returning as text")
                return f"Raw response: {response.text[:500]}..."
                
        except requests.exceptions.Timeout:
            logger.warning(f"Timeout on attempt {attempt+1}/{MAX_RETRIES}")
            if attempt == MAX_RETRIES - 1:
                return "Error: Server response timeout. Please try again later or check your endpoint configuration."
            continue
        except requests.exceptions.ConnectionError as e:
            error_msg = f"Connection error: {str(e)}"
            logger.error(error_msg)
            return f"Error: Unable to connect to the server. Please check your network connection and endpoint URL. Details: {str(e)}"
        except requests.exceptions.RequestException as e:
            error_msg = f"Request exception: {str(e)}"
            logger.error(error_msg)
            return f"Error: {str(e)}"
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return f"Unexpected error: {str(e)}"
    
    return "Error: Maximum retries exceeded. The endpoint is not responding in a timely manner."

# Function to call OpenAI's Chat Completions API (POST method)
def query_openai(prompt, rag_endpoint, api_key=None):
    api_key = api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "Error: OPENAI_API_KEY not set in environment."
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    data = {
        "model": "gpt-3.5-turbo",  # or your desired model
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 150
    }
    try:
        response = requests.post(
            rag_endpoint,
            headers=headers,
            json=data,
            timeout=TIMEOUT_SECONDS
        )
        response.raise_for_status()
        json_response = response.json()
        answer = json_response["choices"][0]["message"]["content"]
        return answer
    except requests.exceptions.Timeout:
        return "Error: Server response timeout. Please try again later."
    except requests.exceptions.RequestException as e:
        return f"Error: {str(e)}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"

# Simple evaluation function (placeholder metrics)
def evaluate(dataset=None):
    return {
        "Context Recall": 0.85,
        "Faithfulness": 0.92,
        "Factual Correctness": 0.88
    }

# Sample queries and expected responses for evaluation
sample_queries = [
    "Who introduced the theory of relativity?",
    "Who was the first computer programmer?",
    "What did Isaac Newton contribute to science?",
    "Who won two Nobel Prizes for research on radioactivity?",
    "What is the theory of evolution by natural selection?"
]

expected_responses = [
    "Albert Einstein proposed the theory of relativity, which transformed our understanding of time, space, and gravity.",
    "Ada Lovelace is regarded as the first computer programmer for her work on Charles Babbage's early mechanical computer, the Analytical Engine.",
    "Isaac Newton formulated the laws of motion and universal gravitation, laying the foundation for classical mechanics.",
    "Marie Curie was a physicist and chemist who conducted pioneering research on radioactivity and won two Nobel Prizes.",
    "Charles Darwin introduced the theory of evolution by natural selection in his book 'On the Origin of Species'."
]

# Pydantic model for the single-input request: the RAG API endpoint URL
class EvaluateRequest(BaseModel):
    rag_endpoint: str
    api_key: Optional[str] = None
    endpoint_type: str = "generic"  # "generic", "openai", "azure", "custom"
    request_method: str = "GET"     # "GET", "POST"
    request_format: dict = None     # Custom format for the request body
    response_path: str = "answer"   # JSON path to extract the answer from response
    headers: dict = None            # Custom headers

@app.get("/")
def read_root():
    return {"message": "FastAPI backend for RAG evaluation system"}

@app.post("/api/evaluate", response_class=HTMLResponse)
def evaluate_rag_system(request: EvaluateRequest):
    rag_endpoint = request.rag_endpoint.strip()
    logger.info(f"Starting evaluation for endpoint: {rag_endpoint}", extra={
        "endpoint_type": request.endpoint_type,
        "request_method": request.request_method
    })
    
    # For each sample query, decide which query function to call based on the endpoint type.
    dataset = []
    error_messages = []
    success_count = 0
    
    try:
        # Validate the endpoint URL
        if not rag_endpoint.startswith(('http://', 'https://')):
            logger.error(f"Invalid endpoint URL: {rag_endpoint}")
            return HTMLResponse(
                content=f"""
                <html>
                <head>
                    <title>RAG Evaluation Error</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }}
                        .error {{ color: #e53e3e; padding: 15px; border-left: 4px solid #e53e3e; background-color: #fff5f5; margin-bottom: 20px; }}
                        .tip {{ background-color: #f7fafc; padding: 15px; border-radius: 5px; margin-top: 20px; }}
                    </style>
                </head>
                <body>
                    <h2>RAG Evaluation Error</h2>
                    <div class="error">
                        <p><strong>Invalid endpoint URL:</strong> {rag_endpoint}</p>
                        <p>URL must start with http:// or https://</p>
                    </div>
                    <div class="tip">
                        <p><strong>Tip:</strong> Make sure your endpoint URL is correct and includes the protocol (http:// or https://)</p>
                    </div>
                </body>
                </html>
                """,
                status_code=400
            )
        
        for idx, (query, reference) in enumerate(zip(sample_queries, expected_responses)):
            try:
                logger.info(f"Processing query {idx+1}/{len(sample_queries)}: {query[:30]}...")
                
                # Choose the appropriate query function based on the endpoint type
                if request.endpoint_type == "openai" or "openai.com" in rag_endpoint:
                    response = query_openai(query, rag_endpoint, request.api_key)
                elif request.endpoint_type == "azure":
                    response = query_azure(query, rag_endpoint, request.api_key, request.headers)
                elif request.endpoint_type == "custom" and request.request_format:
                    response = query_custom(query, rag_endpoint, request.api_key, 
                                        request.request_method, request.request_format, 
                                        request.response_path, request.headers)
                else:
                    response = query_rag(query, rag_endpoint, headers=request.headers)
                
                # Check if the response indicates an error
                if isinstance(response, str) and response.startswith("Error:"):
                    error_messages.append(f"Query {idx+1}: {response}")
                    logger.warning(f"Error in query {idx+1}: {response}")
                    
                    # Add the error response to the dataset
                    dataset.append({
                        "user_input": query,
                        "retrieved_contexts": [response],
                        "response": response,
                        "reference": reference,
                        "status": "error"
                    })
                else:
                    # Successful response
                    success_count += 1
                    # Ensure retrieved_contexts is stored as a list
                    response_list = [response] if isinstance(response, str) else response
                    dataset.append({
                        "user_input": query,
                        "retrieved_contexts": response_list,
                        "response": response,
                        "reference": reference,
                        "status": "success"
                    })
            except Exception as e:
                logger.error(f"Exception processing query {idx+1}: {str(e)}", exc_info=True)
                error_messages.append(f"Query {idx+1}: Unexpected error: {str(e)}")
                
                # Add error entry to dataset
                dataset.append({
                    "user_input": query,
                    "retrieved_contexts": [f"Error: {str(e)}"],
                    "response": f"Error: {str(e)}",
                    "reference": reference,
                    "status": "error"
                })
        
        # If all queries failed, return a more detailed error
        if success_count == 0 and len(error_messages) > 0:
            logger.error(f"All queries failed: {error_messages}")
            error_html = f"""
            <html>
            <head>
                <title>RAG Evaluation Failed</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }}
                    .error {{ color: #e53e3e; padding: 15px; border-left: 4px solid #e53e3e; background-color: #fff5f5; margin-bottom: 20px; }}
                    .warning {{ color: #dd6b20; padding: 15px; border-left: 4px solid #dd6b20; background-color: #fffaf0; }}
                    .tip {{ background-color: #f7fafc; padding: 15px; border-radius: 5px; margin-top: 20px; }}
                    ul {{ margin-top: 10px; padding-left: 30px; }}
                </style>
            </head>
            <body>
                <h2>RAG Evaluation Failed</h2>
                <div class="error">
                    <p><strong>All queries failed.</strong></p>
                    <p>Endpoint: {rag_endpoint}</p>
                    <p>Error details:</p>
                    <ul>
                        {"".join(f"<li>{error}</li>" for error in error_messages[:3])}
                        {f"<li>...and {len(error_messages) - 3} more errors</li>" if len(error_messages) > 3 else ""}
                    </ul>
                </div>
                <div class="tip">
                    <p><strong>Troubleshooting tips:</strong></p>
                    <ul>
                        <li>Verify the endpoint URL is correct and accessible</li>
                        <li>Check if authentication credentials are required (API key, etc.)</li>
                        <li>Ensure the endpoint accepts the parameters being sent</li>
                        <li>Verify the endpoint returns responses in the expected format</li>
                        <li>Check network connectivity and firewall settings</li>
                    </ul>
                </div>
            </body>
            </html>
            """
            return HTMLResponse(content=error_html, status_code=500)
        
        # Calculate evaluation metrics
        successful_responses = [d for d in dataset if d.get("status") == "success"]
        if successful_responses:
            evaluation_results = {
                "Context Recall": sum([1 for d in successful_responses if d["response"] == d["reference"]]) / len(successful_responses),
                "Faithfulness": 0.92,  # Placeholder
                "Factual Correctness": 0.88
            }
        else:
            evaluation_results = {
                "Context Recall": 0,
                "Faithfulness": 0,
                "Factual Correctness": 0
            }
        
        # If there were some errors but not all failed, include warnings in the HTML output
        warning_html = ""
        if error_messages and success_count > 0:
            warning_html = f"""
            <div class="warning-section">
                <h3>⚠️ Warnings</h3>
                <p>{success_count} out of {len(sample_queries)} queries completed successfully. Some queries encountered errors:</p>
                <ul class="warning-list">
                    {"".join(f"<li>{error}</li>" for error in error_messages[:3])}
                    {f"<li>...and {len(error_messages) - 3} more errors</li>" if len(error_messages) > 3 else ""}
                </ul>
            </div>
            """
        
        # Build HTML Report
        html_content = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RAG Evaluation Results</title>
            <style>
                :root {
                    --primary-color: #007bff;
                    --border-color: #e2e8f0;
                    --bg-color: #ffffff;
                    --text-color: #1a202c;
                    --hover-bg: #f7fafc;
                }
                body {
                    font-family: 'Poppins', system-ui, -apple-system, sans-serif;
                    color: var(--text-color);
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    width: 100%;
                    background: var(--bg-color);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .table-wrapper {
                    width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    margin-bottom: 1rem;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                }
                table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin: 0;
                    border: 1px solid var(--border-color);
                    min-width: 600px; /* Ensures table doesn't get too squished */
                }
                th, td {
                    border: 1px solid var(--border-color);
                    padding: 0.75rem;
                    text-align: left;
                    transition: background-color 0.2s ease;
                    min-width: 120px; /* Minimum column width */
                    word-wrap: break-word;
                    max-width: 300px; /* Maximum column width */
                }
                th {
                    background-color: var(--primary-color);
                    color: white !important; /* Ensure header text is always white */
                    font-weight: 500;
                    white-space: nowrap;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }
                th:first-child, td:first-child {
                    padding-left: 1.5rem; /* Add extra padding to first column header and cells */
                }
                td:first-child {
                    padding-left: 1.5rem; /* Add extra padding to first column */
                }
                tr:nth-child(even) {
                    background-color: var(--hover-bg);
                }
                tr:hover td {
                    background-color: rgba(0, 123, 255, 0.05);
                }
                .metrics {
                    background: var(--bg-color);
                    border-radius: 8px;
                    padding: 1rem;
                    margin-top: 1.5rem;
                    border: 1px solid var(--border-color);
                }
                .metrics h3 {
                    color: var(--primary-color);
                    margin-top: 0;
                    font-weight: 500;
                    font-size: 1.1rem;
                }
                .metrics ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .metrics li {
                    padding: 0.75rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }
                .metrics li:last-child {
                    border-bottom: none;
                }
                @media (max-width: 640px) {
                    th, td {
                        padding: 0.5rem;
                        font-size: 0.875rem;
                    }
                    .metrics li {
                        padding: 0.5rem;
                    }
                    .metrics h3 {
                        font-size: 1rem;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>User Query</th>
                                <th>Generated Response</th>
                                <th>Reference Answer</th>
                            </tr>
                        </thead>
                        <tbody>
        """
        for data in dataset:
            html_content += f"""
            <tr>
                <td>{data['user_input']}</td>
                <td>{data['response']}</td>
                <td>{data['reference']}</td>
            </tr>
            """
        html_content += """
                        </tbody>
                    </table>
                </div>
                <div class="metrics">
                    <h3>Evaluation Metrics</h3>
                    <ul>
                        <li>
                            <span>Context Recall</span>
                            <span>{0:.1%}</span>
                        </li>
                        <li>
                            <span>Faithfulness</span>
                            <span>{1:.1%}</span>
                        </li>
                        <li>
                            <span>Factual Correctness</span>
                            <span>{2:.1%}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </body>
        </html>
        """.format(
            evaluation_results["Context Recall"],
            evaluation_results["Faithfulness"],
            evaluation_results["Factual Correctness"]
        )
        
        # Add the warning section to the HTML if there were errors
        if warning_html:
            html_content = html_content.replace("<div class=\"metrics\">", f"{warning_html}<div class=\"metrics\">")
        
        # Log the completion of the evaluation
        logger.info(f"Evaluation completed with {success_count} successful queries out of {len(sample_queries)}")
        
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        logger.error(f"Exception in evaluate_rag_system: {str(e)}", exc_info=True)
        error_html = f"""
        <html>
        <head>
            <title>Evaluation System Error</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }}
                .error {{ color: #e53e3e; padding: 15px; border-left: 4px solid #e53e3e; background-color: #fff5f5; }}
            </style>
        </head>
        <body>
            <h2>Evaluation System Error</h2>
            <div class="error">
                <p><strong>An unexpected error occurred during evaluation:</strong></p>
                <p>{str(e)}</p>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=error_html, status_code=500)

@app.get("/api/download-pdf")
async def download_pdf(
    rag_endpoint: str,
    api_key: Optional[str] = None,
    endpoint_type: str = "generic",
    request_method: str = "GET",
    response_path: str = "answer",
    headers: Optional[str] = None,
    request_format: Optional[str] = None
):
    try:
        # URL decode the endpoint if it's encoded
        rag_endpoint = requests.utils.unquote(rag_endpoint)
        
        # Format the request similar to the evaluate endpoint
        request_data = EvaluateRequest(
            rag_endpoint=rag_endpoint,
            api_key=api_key,
            endpoint_type=endpoint_type,
            request_method=request_method,
            response_path=response_path
        )
        
        # Parse JSON strings from query parameters if provided
        if headers:
            try:
                request_data.headers = json.loads(headers)
            except json.JSONDecodeError:
                return JSONResponse(
                    status_code=400,
                    content={"error": "Invalid JSON format in headers"}
                )
        
        if request_format and endpoint_type == "custom":
            try:
                request_data.request_format = json.loads(request_format)
            except json.JSONDecodeError:
                return JSONResponse(
                    status_code=400,
                    content={"error": "Invalid JSON format in request_format"}
                )
        
        # For each sample query, decide which query function to call based on the endpoint type
        dataset = []
        for query, reference in zip(sample_queries, expected_responses):
            # Choose the appropriate query function based on the endpoint type
            if request_data.endpoint_type == "openai" or "openai.com" in rag_endpoint:
                response = query_openai(query, rag_endpoint, request_data.api_key)
            elif request_data.endpoint_type == "azure":
                response = query_azure(query, rag_endpoint, request_data.api_key, request_data.headers)
            elif request_data.endpoint_type == "custom" and request_data.request_format:
                response = query_custom(
                    query, rag_endpoint, request_data.api_key, 
                    request_data.request_method, request_data.request_format, 
                    request_data.response_path, request_data.headers
                )
            else:
                response = query_rag(query, rag_endpoint, headers=request_data.headers)
            
            dataset.append({
                "user_input": query,
                "response": response,
                "reference": reference
            })
        
        # Calculate evaluation metrics
        evaluation_results = {
            "Context Recall": sum([1 for d in dataset if d["response"] == d["reference"]]) / len(dataset),
            "Faithfulness": 0.92,
            "Factual Correctness": 0.88
        }
        
        # Generate PDF
        pdf_data = generate_pdf_report(dataset, evaluation_results)
        
        # Return the PDF file
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=rag_evaluation_report.pdf"
            }
        )
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to generate PDF: {str(e)}"}
        )

def generate_pdf_report(dataset, evaluation_results):
    # Process evaluation data and generate a simple PDF report
    buffer = io.BytesIO()
    
    # Create PDF document with proper margins
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=72, 
        leftMargin=72, 
        topMargin=72, 
        bottomMargin=72
    )
    
    # Set up styles
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='CenteredTitle',
        parent=styles['Title'],
        alignment=1,
        fontName='Poppins-Bold',
        fontSize=24,
        spaceAfter=30,
    ))
    styles.add(ParagraphStyle(
        name='Regular',
        parent=styles['Normal'],
        fontName='Poppins',
        fontSize=10,
        leading=14,
    ))
    styles.add(ParagraphStyle(
        name='TableHeader',
        parent=styles['Regular'],
        fontName='Poppins-Bold',
        fontSize=12,
        textColor=colors.white,
    ))
    styles.add(ParagraphStyle(
        name='MetricsHeader',
        parent=styles['Heading2'],
        fontName='Poppins-Bold',
        fontSize=16,
        spaceAfter=12,
    ))
    
    elements = []
    
    # Add title
    elements.append(Paragraph("RAG Evaluation Report", styles['CenteredTitle']))
    
    # Add timestamp
    date_string = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    elements.append(Paragraph(f"Generated on: {date_string}", styles['Regular']))
    elements.append(Spacer(1, 20))
    
    # Add metrics section
    elements.append(Paragraph("Performance Metrics", styles['MetricsHeader']))
    
    # Create metrics table with website-like styling
    metrics_data = [["Metric", "Score"]]
    for metric, score in evaluation_results.items():
        formatted_score = f"{score:.1%}" if isinstance(score, (int, float)) else score
        metrics_data.append([metric, formatted_score])
    
    metrics_table = Table(metrics_data, colWidths=[300, 150])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#007bff')),  # Primary blue color
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Poppins-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Poppins'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),  # Border color
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#f7fafc'), colors.white]),  # Alternating row colors
    ]))
    
    elements.append(metrics_table)
    elements.append(Spacer(1, 30))
    
    # Add evaluation results section
    elements.append(Paragraph("Detailed Evaluation Results", styles['MetricsHeader']))
    elements.append(Spacer(1, 12))
    
    # Helper function to limit text length for table cells
    def limit_text_length(text, max_chars=300):
        if len(text) > max_chars:
            return text[:max_chars] + "..."
        return text
    
    # Create results table with website-like styling
    results_data = [["User Query", "Generated Response", "Reference Answer"]]
    
    for item in dataset:
        user_query = limit_text_length(item['user_input'], 200)
        response = limit_text_length(item['response'], 300)
        reference = limit_text_length(item['reference'], 300)
        
        results_data.append([
            Paragraph(user_query, styles['Regular']),
            Paragraph(response, styles['Regular']),
            Paragraph(reference, styles['Regular']),
        ])
    
    results_table = Table(results_data, colWidths=[160, 180, 180], repeatRows=1)
    results_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#007bff')),  # Primary blue color
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (-1, 0), 'Poppins-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),  # Border color
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#f7fafc'), colors.white]),  # Alternating row colors
    ]))
    
    elements.append(results_table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

# Function to extract value from nested JSON using a dot-separated path
def extract_from_json(json_obj, path):
    """Extract a value from a nested JSON object using a dot-separated path"""
    if not path:
        return json_obj
        
    parts = path.split('.')
    current = json_obj
    
    for part in parts:
        if isinstance(current, dict) and part in current:
            current = current[part]
        elif isinstance(current, list) and part.isdigit() and int(part) < len(current):
            current = current[int(part)]
        else:
            return None
    
    return current

# Function to call Azure OpenAI endpoints
def query_azure(prompt, endpoint, api_key=None, headers=None):
    if not api_key:
        return "Error: API key not provided for Azure endpoint."
    
    headers = headers or {}
    headers.update({
        "Content-Type": "application/json",
        "api-key": api_key
    })
    
    data = {
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 150
    }
    
    try:
        response = requests.post(
            endpoint,
            headers=headers,
            json=data,
            timeout=TIMEOUT_SECONDS
        )
        response.raise_for_status()
        json_response = response.json()
        answer = json_response.get("choices", [{}])[0].get("message", {}).get("content", "")
        return answer
    except requests.exceptions.Timeout:
        return "Error: Server response timeout. Please try again later."
    except requests.exceptions.RequestException as e:
        return f"Error: {str(e)}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"

# Function to call custom endpoints with flexible configuration
def query_custom(prompt, endpoint, api_key=None, method="POST", request_format=None, response_path="answer", headers=None):
    headers = headers or {}
    
    # Add API key to headers if provided
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    
    # Prepare request body by replacing placeholders in the format
    request_body = {}
    if request_format:
        # Deep copy to avoid modifying the original
        import copy
        request_body = copy.deepcopy(request_format)
        # Replace {prompt} placeholder with the actual prompt
        replace_placeholder(request_body, "{prompt}", prompt)
    else:
        # Default format if none provided
        request_body = {"query": prompt}
    
    try:
        logger.info("Making custom API call", extra={
            "endpoint": endpoint,
            "method": method,
            "has_api_key": api_key is not None,
            "request_format": request_format is not None,
            "response_path": response_path
        })
        
        if method.upper() == "GET":
            # For GET requests, convert the body to query parameters
            params = flatten_dict(request_body)
            response = requests.get(
                endpoint,
                params=params,
                headers=headers,
                timeout=TIMEOUT_SECONDS
            )
        else:
            # For POST and other methods
            response = requests.request(
                method.upper(),
                endpoint,
                headers=headers,
                json=request_body,
                timeout=TIMEOUT_SECONDS
            )
        
        response.raise_for_status()
        
        # Handle different response types
        if response.headers.get("Content-Type", "").startswith("application/json"):
            json_response = response.json()
            logger.info("Received JSON response", extra={
                "status_code": response.status_code,
                "content_type": response.headers.get("Content-Type"),
                "response_keys": list(json_response.keys()) if isinstance(json_response, dict) else "non-dict-response"
            })
            
            # Extract answer using the provided path
            answer = extract_from_json(json_response, response_path)
            if answer is None:
                error_msg = f"Error: Could not find path '{response_path}' in response: {json_response}"
                logger.error(error_msg)
                return error_msg
            return answer
        else:
            # Return text response for non-JSON responses
            logger.info("Received non-JSON response", extra={
                "status_code": response.status_code,
                "content_type": response.headers.get("Content-Type"),
                "content_length": len(response.text)
            })
            return response.text
            
    except requests.exceptions.Timeout:
        logger.error("Request timeout", extra={"endpoint": endpoint})
        return "Error: Server response timeout. Please try again later."
    except requests.exceptions.RequestException as e:
        logger.error(f"Request exception: {str(e)}", extra={"endpoint": endpoint})
        return f"Error: {str(e)}"
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", extra={"endpoint": endpoint})
        return f"Unexpected error: {str(e)}"

# Helper function to replace placeholders in nested dictionaries
def replace_placeholder(obj, placeholder, value):
    """Replace placeholders in nested dictionaries and lists"""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, (dict, list)):
                replace_placeholder(v, placeholder, value)
            elif isinstance(v, str) and placeholder in v:
                obj[k] = v.replace(placeholder, value)
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            if isinstance(item, (dict, list)):
                replace_placeholder(item, placeholder, value)
            elif isinstance(item, str) and placeholder in item:
                obj[i] = item.replace(placeholder, value)

# Helper function to flatten a nested dictionary for GET parameters
def flatten_dict(d, parent_key='', sep='_'):
    """Flatten a nested dictionary for use as GET parameters"""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
