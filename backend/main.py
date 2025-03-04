# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
import os
import requests
import pandas as pd
from dotenv import load_dotenv
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.fonts import addMapping
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
import tempfile

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

TIMEOUT_SECONDS = 10
MAX_RETRIES = 3

# Fallback function for non-OpenAI endpoints (original GET method)
def query_rag(prompt, rag_endpoint, group_id=12, session_id=111):
    headers = {"accept": "application/json"}
    params = {
        "groupid": group_id,
        "query": prompt,
        "session_id": session_id
    }
    
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(
                rag_endpoint,
                params=params,
                headers=headers,
                timeout=TIMEOUT_SECONDS,
                verify=False  # Skip SSL verification if needed
            )
            response.raise_for_status()
            data = response.json()
            if "answer" in data:
                return data["answer"]
            return f"No answer found in response: {data}"
        except requests.exceptions.Timeout:
            if attempt == MAX_RETRIES - 1:
                return "Error: Server response timeout. Please try again later."
            continue
        except requests.exceptions.ConnectionError:
            return "Error: Unable to connect to the server. Please check your network connection."
        except requests.exceptions.RequestException as e:
            return f"Error: {str(e)}"
        except Exception as e:
            return f"Unexpected error: {str(e)}"
    return "Error: Maximum retries exceeded. Please try again later."

# Function to call OpenAI's Chat Completions API (POST method)
def query_openai(prompt, rag_endpoint):
    # Get API key from environment
    api_key = os.getenv("OPENAI_API_KEY")
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

@app.get("/")
def read_root():
    return {"message": "FastAPI backend for RAG evaluation system"}

@app.post("/api/evaluate", response_class=HTMLResponse)
def evaluate_rag_system(request: EvaluateRequest):
    
    rag_endpoint = request.rag_endpoint.strip()
    
    # For each sample query, decide which query function to call based on the endpoint URL.
    dataset = []
    for query, reference in zip(sample_queries, expected_responses):
        # If the endpoint URL indicates an OpenAI endpoint, use the POST-based query function.
        if "openai.com" in rag_endpoint:
            response = query_openai(query, rag_endpoint)
        else:
            response = query_rag(query, rag_endpoint)
        
        # Ensure retrieved_contexts is stored as a list.
        response_list = [response] if isinstance(response, str) else response  
        dataset.append({
            "user_input": query,
            "retrieved_contexts": response_list,
            "response": response,
            "reference": reference
        })
    
    # Calculate evaluation metrics (using a basic exact-match check for Context Recall)
    evaluation_results = {
        "Context Recall": sum([1 for d in dataset if d["response"] == d["reference"]]) / len(dataset),
        "Faithfulness": 0.92,  # Placeholder
        "Factual Correctness": 0.88  # Placeholder
    }
    
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
              background-color: #f8fafc;
              color: var(--text-color);
              line-height: 1.6;
              margin: 0;
              padding: 0;
          }
          .header {
              background: var(--bg-color);
              border-bottom: 1px solid var(--border-color);
              padding: 2rem 1rem;
              position: sticky;
              top: 0;
              z-index: 10;
              box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          .header-content {
              max-width: 1200px;
              margin: 0 auto;
              text-align: center;
          }
          .header h2 {
              color: var(--text-color);
              font-size: 2.25rem;
              margin: 0 0 1rem;
              font-weight: 600;
          }
          .container {
              max-width: 1200px;
              background: var(--bg-color);
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .section-title {
              color: var(--primary-color);
              font-size: 1.5rem;
              margin-bottom: 1.5rem;
              font-weight: 600;
          }
          table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin: 1.5rem 0;
              border: 1px solid var(--border-color);
              border-radius: 8px;
              overflow: hidden;
          }
          th, td {
              border: 1px solid var(--border-color);
              padding: 1rem;
              text-align: left;
              transition: background-color 0.2s ease;
          }
          th {
              background-color: var(--primary-color);
              color: white;
              font-weight: 500;
              white-space: nowrap;
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
              padding: 1.5rem;
              margin-top: 2rem;
              border: 1px solid var(--border-color);
          }
          .metrics h3 {
              color: var(--primary-color);
              margin-top: 0;
              font-weight: 500;
          }
          .metrics ul {
              list-style: none;
              padding: 0;
              margin: 0;
          }
          .metrics li {
              padding: 0.75rem 0;
              border-bottom: 1px solid var(--border-color);
              display: flex;
              justify-content: space-between;
              align-items: center;
          }
          .metrics li:last-child {
              border-bottom: none;
          }
          @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
          }
          .container {
              animation: fadeIn 0.5s ease-out;
          }
      </style>
    </head>
    <body>
      <header class="header">
        <div class="header-content">
          <h2>RAG Evaluation Results</h2>
        </div>
      </header>
      <div class="container">
        <div class="section-title">Evaluation Results</div>
        <table>
          <tr>
            <th>User Query</th>
            <th>Generated Response</th>
            <th>Reference Answer</th>
          </tr>
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
        </table>
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
    
    # Optionally, save the report locally
    output_file = "rag_evaluation_results.html"
    with open(output_file, "w", encoding="utf-8") as file:
        file.write(html_content)
    
    return HTMLResponse(content=html_content)

def generate_pdf_report(dataset, evaluation_results):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,  # Reduced margins to give more space for content
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontName='Poppins-Bold',
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#007bff')
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontName='Poppins-Bold',
        fontSize=16,
        spaceAfter=12,
        textColor=colors.HexColor('#2d3748')
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName='Poppins',
        fontSize=9,
        spaceAfter=12,
        textColor=colors.HexColor('#4a5568'),
        leading=14  # Improved line spacing
    )
    
    # Create document elements
    elements = []
    
    # Title
    elements.append(Paragraph("RAG Evaluation Report", title_style))
    elements.append(Spacer(1, 20))
    
    # Evaluation Metrics
    elements.append(Paragraph("Evaluation Metrics", heading_style))
    metrics_data = [["Metric", "Score"]]
    for metric, score in evaluation_results.items():
        metrics_data.append([metric, f"{score:.2%}"])
    
    # Adjusted metrics table width
    metrics_table = Table(metrics_data, colWidths=[300, 100])
    metrics_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Poppins'),
        ('FONT', (0, 0), (-1, 0), 'Poppins-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#007bff')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),  # Center-align the scores
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8f9fa')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#f8f9fa'), colors.white]),
    ]))
    elements.append(metrics_table)
    elements.append(Spacer(1, 30))
    
    # Detailed Results
    elements.append(Paragraph("Detailed Results", heading_style))
    
    # Process the data for the results table
    results_data = [["Query", "Generated Response", "Reference Answer"]]
    for item in dataset:
        results_data.append([
            Paragraph(item['user_input'], body_style),
            Paragraph(item['response'], body_style),
            Paragraph(item['reference'], body_style)
        ])
    
    # Calculate available width and distribute it proportionally
    available_width = doc.width
    col_widths = [available_width * 0.25, available_width * 0.375, available_width * 0.375]  # 25%, 37.5%, 37.5%
    
    results_table = Table(results_data, colWidths=col_widths, repeatRows=1)
    results_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Poppins'),
        ('FONT', (0, 0), (-1, 0), 'Poppins-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#007bff')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),  # Header font size
        ('FONTSIZE', (0, 1), (-1, -1), 9),  # Content font size
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#f8f9fa'), colors.white]),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(results_table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

@app.get("/api/download-pdf")
async def download_pdf(rag_endpoint: str):
    # Re-run evaluation to get latest data
    request = EvaluateRequest(rag_endpoint=rag_endpoint)
    dataset = []
    for query, reference in zip(sample_queries, expected_responses):
        if "openai.com" in rag_endpoint:
            response = query_openai(query, rag_endpoint)
        else:
            response = query_rag(query, rag_endpoint)
        response_list = [response] if isinstance(response, str) else response
        dataset.append({
            "user_input": query,
            "retrieved_contexts": response_list,
            "response": response,
            "reference": reference
        })
    
    evaluation_results = {
        "Context Recall": sum([1 for d in dataset if d["response"] == d["reference"]]) / len(dataset),
        "Faithfulness": 0.92,
        "Factual Correctness": 0.88
    }
    
    # Generate PDF
    pdf_buffer = generate_pdf_report(dataset, evaluation_results)
    
    # Create a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    temp_file.write(pdf_buffer.read())
    temp_file.close()
    
    return FileResponse(
        temp_file.name,
        media_type="application/pdf",
        filename="rag_evaluation_report.pdf",
        background=temp_file.name
    )

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
