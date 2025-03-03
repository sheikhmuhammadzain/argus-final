# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import os
import requests
import pandas as pd
from dotenv import load_dotenv

# Load environment variables (ensure OPENAI_API_KEY is set in your .env file)
load_dotenv()

app = FastAPI()

# Configure CORS (update origins as needed)
origins = [
    "http://localhost:5174",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
          body { font-family: Arial, sans-serif; margin: 20px; padding: 20px; background-color: #000000FF; }
          h2 { text-align: center; }
          table { width: 100%; border-collapse: collapse; background: black; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #007bff; color: white; }
          tr:nth-child(even) { background-color: #0A0A0AFF; }
      </style>
    </head>
    <body>
      <h2>RAG Evaluation Results</h2>
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
      <h3>Evaluation Metrics:</h3>
      <ul>
        <li>Context Recall: {0}</li>
        <li>Faithfulness: {1}</li>
        <li>Factual Correctness: {2}</li>
      </ul>
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

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)





# # main.py
# from fastapi import FastAPI
# from pydantic import BaseModel
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import HTMLResponse, JSONResponse
# import os
# import requests
# import pandas as pd
# from dotenv import load_dotenv

# # Load environment variables if needed
# load_dotenv()

# app = FastAPI()

# # Configure CORS (update origins as needed)
# origins = [
#     "http://localhost:3000",
# ]
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Configuration
# BASE_RAG_ENDPOINT = "http://10.229.222.15:8000/knowledgebase"
# TIMEOUT_SECONDS = 10
# MAX_RETRIES = 3

# # Query the RAG system
# def query_rag(prompt, group_id=12, session_id=111):
#     headers = {"accept": "application/json"}
#     params = {
#         "groupid": group_id,
#         "query": prompt,
#         "session_id": session_id
#     }
    
#     for attempt in range(MAX_RETRIES):
#         try:
#             response = requests.get(
#                 BASE_RAG_ENDPOINT,
#                 params=params,
#                 headers=headers,
#                 timeout=TIMEOUT_SECONDS,
#                 verify=False  # Skip SSL verification if needed
#             )
#             response.raise_for_status()
#             data = response.json()
#             if "answer" in data:
#                 return data["answer"]
#             return f"No answer found in response: {data}"
#         except requests.exceptions.Timeout:
#             if attempt == MAX_RETRIES - 1:
#                 return "Error: Server response timeout. Please try again later."
#             continue
#         except requests.exceptions.ConnectionError:
#             return "Error: Unable to connect to the server. Please check your network connection."
#         except requests.exceptions.RequestException as e:
#             return f"Error: {str(e)}"
#         except Exception as e:
#             return f"Unexpected error: {str(e)}"
#     return "Error: Maximum retries exceeded. Please try again later."

# # Simple evaluation function returning metrics (placeholder values)
# def evaluate(dataset=None):
#     return {
#         "Context Recall": 0.85,
#         "Faithfulness": 0.92,
#         "Factual Correctness": 0.88
#     }

# # Sample Queries and Expected Responses for evaluation
# sample_queries = [
#     "Who introduced the theory of relativity?",
#     "Who was the first computer programmer?",
#     "What did Isaac Newton contribute to science?",
#     "Who won two Nobel Prizes for research on radioactivity?",
#     "What is the theory of evolution by natural selection?"
# ]

# expected_responses = [
#     "Albert Einstein proposed the theory of relativity, which transformed our understanding of time, space, and gravity.",
#     "Ada Lovelace is regarded as the first computer programmer for her work on Charles Babbage's early mechanical computer, the Analytical Engine.",
#     "Isaac Newton formulated the laws of motion and universal gravitation, laying the foundation for classical mechanics.",
#     "Marie Curie was a physicist and chemist who conducted pioneering research on radioactivity and won two Nobel Prizes.",
#     "Charles Darwin introduced the theory of evolution by natural selection in his book 'On the Origin of Species'."
# ]

# # Pydantic models for request bodies
# class QueryRequest(BaseModel):
#     prompt: str
#     group_id: int = 12
#     session_id: int = 111

# class EvaluateReportRequest(BaseModel):
#     endpoint_key: str  # This can be used to gate or log evaluation requests

# # Endpoints

# @app.get("/")
# def read_root():
#     return {"message": "FastAPI backend for the RAG evaluation system"}

# @app.post("/api/query")
# def handle_query(query_request: QueryRequest):
#     answer = query_rag(query_request.prompt, query_request.group_id, query_request.session_id)
#     return {"answer": answer}

# @app.post("/api/evaluate-report", response_class=HTMLResponse)
# def evaluate_report(request: EvaluateReportRequest):
#     # (Optional) You can validate or use the endpoint_key here
#     dataset = []
#     for query, reference in zip(sample_queries, expected_responses):
#         response = query_rag(query)
#         # Ensure retrieved_contexts is a list even if response is a single string
#         response_list = [response] if isinstance(response, str) else response  
#         dataset.append({
#             "user_input": query,
#             "retrieved_contexts": response_list,
#             "response": response,
#             "reference": reference
#         })
    
#     # Calculate evaluation metrics (here Context Recall is computed as a sample metric)
#     evaluation_results = {
#         "Context Recall": sum([1 for d in dataset if d["response"] == d["reference"]]) / len(dataset),
#         "Faithfulness": 0.92,  # Placeholder value
#         "Factual Correctness": 0.88  # Placeholder value
#     }
    
#     # Build HTML Report
#     html_content = """
#     <!DOCTYPE html>
#     <html lang="en">
#     <head>
#         <meta charset="UTF-8">
#         <meta name="viewport" content="width=device-width, initial-scale=1.0">
#         <title>RAG Evaluation Results</title>
#         <style>
#             body { font-family: Arial, sans-serif; margin: 20px; padding: 20px; background-color: #f4f4f4; }
#             h2 { text-align: center; }
#             table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); }
#             th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
#             th { background-color: #007bff; color: white; }
#             tr:nth-child(even) { background-color: #f2f2f2; }
#         </style>
#     </head>
#     <body>
#         <h2>RAG Evaluation Results</h2>
#         <table>
#             <tr>
#                 <th>User Query</th>
#                 <th>Generated Response</th>
#                 <th>Reference Answer</th>
#             </tr>
#     """
#     for data in dataset:
#         html_content += f"""
#             <tr>
#                 <td>{data["user_input"]}</td>
#                 <td>{data["response"]}</td>
#                 <td>{data["reference"]}</td>
#             </tr>
#         """
#     html_content += """
#         </table>
#         <h3>Evaluation Metrics:</h3>
#         <ul>
#             <li>Context Recall: {0}</li>
#             <li>Faithfulness: {1}</li>
#             <li>Factual Correctness: {2}</li>
#         </ul>
#     </body>
#     </html>
#     """.format(
#         evaluation_results["Context Recall"],
#         evaluation_results["Faithfulness"],
#         evaluation_results["Factual Correctness"]
#     )
    
#     # Optionally save the HTML report locally
#     output_file = "rag_evaluation_results.html"
#     with open(output_file, "w", encoding="utf-8") as file:
#         file.write(html_content)
    
#     return HTMLResponse(content=html_content)

# if __name__ == '__main__':
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8001)






# # # main.py
# # from fastapi import FastAPI
# # from pydantic import BaseModel
# # from fastapi.middleware.cors import CORSMiddleware
# # from fastapi.responses import HTMLResponse
# # import os
# # import requests
# # import pandas as pd
# # from dotenv import load_dotenv

# # # Load environment variables if needed
# # load_dotenv()

# # app = FastAPI()

# # # Configure CORS to allow requests from your React frontend
# # origins = [
# #     "http://localhost:5174",
# # ]
# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=origins,
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )

# # # Constants and configuration
# # BASE_RAG_ENDPOINT = "http://10.229.222.15:8000/knowledgebase"
# # TIMEOUT_SECONDS = 10
# # MAX_RETRIES = 3

# # def query_rag(prompt, group_id=12, session_id=111):
# #     headers = {"accept": "application/json"}
# #     params = {
# #         "groupid": group_id,
# #         "query": prompt,
# #         "session_id": session_id
# #     }
    
# #     for attempt in range(MAX_RETRIES):
# #         try:
# #             response = requests.get(
# #                 BASE_RAG_ENDPOINT,
# #                 params=params,
# #                 headers=headers,
# #                 timeout=TIMEOUT_SECONDS,
# #                 verify=False  # Skip SSL verification if needed
# #             )
# #             response.raise_for_status()
# #             data = response.json()
# #             if "answer" in data:
# #                 return data["answer"]
# #             return f"No answer found in response: {data}"
# #         except requests.exceptions.Timeout:
# #             if attempt == MAX_RETRIES - 1:
# #                 return "Error: Server response timeout. Please try again later."
# #             continue
# #         except requests.exceptions.ConnectionError:
# #             return "Error: Unable to connect to the server. Please check your network connection."
# #         except requests.exceptions.RequestException as e:
# #             return f"Error: {str(e)}"
# #         except Exception as e:
# #             return f"Unexpected error: {str(e)}"
# #     return "Error: Maximum retries exceeded. Please try again later."

# # def evaluate(dataset=None):
# #     """Evaluation function that returns placeholder metrics"""
# #     return {
# #         "Context Recall": 0.85,
# #         "Faithfulness": 0.92,
# #         "Factual Correctness": 0.88
# #     }

# # # Pydantic models for API requests/responses
# # class QueryRequest(BaseModel):
# #     prompt: str
# #     group_id: int = 12
# #     session_id: int = 111

# # class QueryResponse(BaseModel):
# #     answer: str

# # class EvaluateReportRequest(BaseModel):
# #     endpoint_key: str  # In this example, it's just a token triggering the evaluation

# # @app.get("/")
# # def read_root():
# #     return {"message": "FastAPI backend for the RAG system"}

# # @app.post("/api/query", response_model=QueryResponse)
# # def handle_query(query_request: QueryRequest):
# #     answer = query_rag(query_request.prompt, query_request.group_id, query_request.session_id)
# #     return {"answer": answer}

# # @app.post("/api/evaluate-report", response_class=HTMLResponse)
# # def evaluate_report(request: EvaluateReportRequest):
# #     # Sample queries and expected responses (from your provided python code)
# #     sample_queries = [
# #         "Who introduced the theory of relativity?",
# #         "Who was the first computer programmer?",
# #         "What did Isaac Newton contribute to science?",
# #         "Who won two Nobel Prizes for research on radioactivity?",
# #         "What is the theory of evolution by natural selection?"
# #     ]
# #     expected_responses = [
# #         "Albert Einstein proposed the theory of relativity, which transformed our understanding of time, space, and gravity.",
# #         "Ada Lovelace is regarded as the first computer programmer for her work on Charles Babbage's early mechanical computer, the Analytical Engine.",
# #         "Isaac Newton formulated the laws of motion and universal gravitation, laying the foundation for classical mechanics.",
# #         "Marie Curie was a physicist and chemist who conducted pioneering research on radioactivity and won two Nobel Prizes.",
# #         "Charles Darwin introduced the theory of evolution by natural selection in his book 'On the Origin of Species'."
# #     ]
    
# #     dataset = []
# #     for query, reference in zip(sample_queries, expected_responses):
# #         response = query_rag(query)
# #         # Ensure retrieved_contexts is always a list (if needed for further processing)
# #         response_list = [response] if isinstance(response, str) else response
# #         dataset.append({
# #             "user_input": query,
# #             "retrieved_contexts": response_list,
# #             "response": response,
# #             "reference": reference
# #         })
    
# #     # (Optional) Calculate evaluation metrics if needed:
# #     evaluation_results = {
# #         "Context Recall": sum([1 for d in dataset if d["response"] == d["reference"]]) / len(dataset),
# #         "Faithfulness": 0.92,  # placeholder
# #         "Factual Correctness": 0.88  # placeholder
# #     }
    
# #     # Generate HTML Report
# #     html_content = """
# #     <!DOCTYPE html>
# #     <html lang="en">
# #     <head>
# #         <meta charset="UTF-8">
# #         <meta name="viewport" content="width=device-width, initial-scale=1.0">
# #         <title>RAG Evaluation Results</title>
# #         <style>
# #             body { font-family: Arial, sans-serif; margin: 20px; padding: 20px; background-color: #f4f4f4; }
# #             h2 { text-align: center; }
# #             table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); }
# #             th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
# #             th { background-color: #007bff; color: white; }
# #             tr:nth-child(even) { background-color: #f2f2f2; }
# #         </style>
# #     </head>
# #     <body>
# #         <h2>RAG Evaluation Results</h2>
# #         <table>
# #             <tr>
# #                 <th>User Query</th>
# #                 <th>Generated Response</th>
# #                 <th>Reference Answer</th>
# #             </tr>
# #     """
# #     for data in dataset:
# #         html_content += f"""
# #             <tr>
# #                 <td>{data["user_input"]}</td>
# #                 <td>{data["response"]}</td>
# #                 <td>{data["reference"]}</td>
# #             </tr>
# #         """
# #     html_content += """
# #         </table>
# #         <h3>Evaluation Metrics:</h3>
# #         <ul>
# #             <li>Context Recall: {0}</li>
# #             <li>Faithfulness: {1}</li>
# #             <li>Factual Correctness: {2}</li>
# #         </ul>
# #     </body>
# #     </html>
# #     """.format(
# #         evaluation_results["Context Recall"],
# #         evaluation_results["Faithfulness"],
# #         evaluation_results["Factual Correctness"]
# #     )
    
# #     # Optionally, save the report as an HTML file locally:
# #     output_file = "rag_evaluation_results.html"
# #     with open(output_file, "w", encoding="utf-8") as file:
# #         file.write(html_content)
    
# #     return HTMLResponse(content=html_content)

# # if __name__ == '__main__':
# #     import uvicorn
# #     uvicorn.run(app, host="0.0.0.0", port=8001)






# # # main.py
# # from fastapi import FastAPI, HTTPException
# # from pydantic import BaseModel
# # from fastapi.middleware.cors import CORSMiddleware
# # import os
# # import requests
# # import pandas as pd
# # from dotenv import load_dotenv

# # # Load environment variables if needed
# # load_dotenv()

# # app = FastAPI()

# # # Configure CORS to allow requests from your React frontend
# # origins = [
# #     "http://localhost:5174",
# # ]
# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=origins,
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )

# # # Constants and configuration
# # BASE_RAG_ENDPOINT = "http://10.229.222.15:8000/knowledgebase"
# # TIMEOUT_SECONDS = 10
# # MAX_RETRIES = 3

# # # Existing functions
# # def query_rag(prompt, group_id=12, session_id=111):
# #     headers = {"accept": "application/json"}
# #     params = {
# #         "groupid": group_id,
# #         "query": prompt,
# #         "session_id": session_id
# #     }
    
# #     for attempt in range(MAX_RETRIES):
# #         try:
# #             response = requests.get(
# #                 BASE_RAG_ENDPOINT,
# #                 params=params,
# #                 headers=headers,
# #                 timeout=TIMEOUT_SECONDS,
# #                 verify=False  # Skip SSL verification if needed
# #             )
# #             response.raise_for_status()
# #             data = response.json()
# #             if "answer" in data:
# #                 return data["answer"]
# #             return f"No answer found in response: {data}"
# #         except requests.exceptions.Timeout:
# #             if attempt == MAX_RETRIES - 1:
# #                 return "Error: Server response timeout. Please try again later."
# #             continue
# #         except requests.exceptions.ConnectionError:
# #             return "Error: Unable to connect to the server. Please check your network connection."
# #         except requests.exceptions.RequestException as e:
# #             return f"Error: {str(e)}"
# #         except Exception as e:
# #             return f"Unexpected error: {str(e)}"
# #     return "Error: Maximum retries exceeded. Please try again later."

# # def evaluate(dataset=None):
# #     """Evaluation function that returns metrics"""
# #     return {
# #         "Context Recall": 0.85,
# #         "Faithfulness": 0.92,
# #         "Factual Correctness": 0.88
# #     }

# # # Pydantic models for API requests/responses
# # class QueryRequest(BaseModel):
# #     prompt: str
# #     group_id: int = 12
# #     session_id: int = 111

# # class QueryResponse(BaseModel):
# #     answer: str

# # class EvaluateResponse(BaseModel):
# #     context_recall: float
# #     faithfulness: float
# #     factual_correctness: float

# # # API endpoints
# # @app.get("/")
# # def read_root():
# #     return {"message": "FastAPI backend for the RAG system"}

# # @app.post("/api/query", response_model=QueryResponse)
# # def handle_query(query_request: QueryRequest):
# #     answer = query_rag(query_request.prompt, query_request.group_id, query_request.session_id)
# #     return {"answer": answer}

# # @app.get("/api/evaluate", response_model=EvaluateResponse)
# # def handle_evaluate():
# #     results = evaluate()
# #     return {
# #         "context_recall": results["Context Recall"],
# #         "faithfulness": results["Faithfulness"],
# #         "factual_correctness": results["Factual Correctness"]
# #     }

# # if __name__ == '__main__':
# #     import uvicorn
# #     uvicorn.run(app, host="0.0.0.0", port=8001)
