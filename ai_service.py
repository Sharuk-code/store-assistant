import re
import sqlite3
import datetime
import traceback
# Try optional import, don't crash if missing
try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

from database import get_db_connection

class GoodVibeAI:
    def __init__(self):
        self.system_prompt = """
        You are a SQL Expert for a Store Management App called 'GoodVibe'.
        
        Database Schema:
        - products (id, sku, name, product_type, price, cost, stock_qty, category)
        - sales (id, invoice_no, total, date, customer_name, customer_phone, payment_mode)
        - sale_items (sale_id, product_id, sku, qty, price, total)
        - jobs (id, job_no, customer_name, device_model, issue_description, status, estimated_cost, technician, repair_notes, created_at)
        - suppliers (id, name, phone, email, address)
        - purchases (id, supplier_id, invoice_no, total_amount, date)
        - purchase_items (purchase_id, product_id, qty, cost_price)
        - customers (id, name, phone, email)
        - users (id, username, role)
        - branches (id, name)
        
        Rules:
        1. Output ONLY a valid SQLite SELECT query.
        2. Do not use markdown blocks.
        3. Do not explain.
        4. Use date('now') for current time.
        
        Business Logic Rules:
        1. "Low stock" queries MUST use: `WHERE stock_qty < 50 AND sku != 'SERVICE'`.
        2. "Best customer" queries MUST use: `ORDER BY total_spent DESC LIMIT 1` (Note: Calculate total_spent from sales headers if needed, or count(*) for frequent shoppers).
        3. Never include products with sku='SERVICE' in stock reports.
        4. When filtering by Category, Name, or Supplier, ALWAYS use `LIKE '%term%'` for fuzzy matching.
        5. "Who repaired", "Technician" -> `jobs.technician`.
        6. "What's wrong", "Issue" -> `jobs.issue_description`.
        7. "Expenses", "Purchases", "Spending", "Supply" -> query the `purchases` table (Money Out). Join with `suppliers` for names.
        8. "Profit" -> Sum(sales.total) - Sum(purchases.total_amount) (Approximate).
        9. "Antigravity" refers to the Super Admin / System.
        10. If query mentions "Sales" or "Revenue", query `sales` table (Money In). Do NOT mix with purchases.
        11. If no data matches, return a query that returns nothing, do not SELECT * as fallback.
        """

    def process_query(self, user_query, history=None):
        """Main entry point for AI"""
        if history is None:
            history = []
            
        try:
            return self._unsafe_process_query(user_query, history)
        except Exception as e:
            print(f"CRITICAL AI CRASH: {e}")
            traceback.print_exc()
            return {"error": "Internal AI Error. Check server logs."}

    def _unsafe_process_query(self, user_query, history):
        original_query = user_query
        user_query = user_query.lower().strip()
        
        # 0. Greetings (Regex)
        if user_query in ['hi', 'hello', 'hey', 'start']:
            return {"response": "Hey there! I'm GoodVibe AI. Ask me about Sales, Stock, or Repairs."}

        # 1. Regex Heuristics
        # Only use regex if history is empty (context-free) OR if query is very specific.
        # If user says "what about the other one?", regex will fail, so we skip to Cloud.
        if not history or "sales" in user_query or "stock" in user_query:
            regex_result = self._regex_matcher(user_query)
            if regex_result:
                return regex_result

        # 2. Ollama Logic
        if OLLAMA_AVAILABLE:
            if not self._is_ollama_running():
                 return {"response": "I see you want advanced insights, but the Ollama Brain is offline. Please run 'ollama serve' to enable Deep Mode."}
            
            try:
                return self._query_ollama(original_query, history)
            except Exception as e:
                print(f"Ollama Error: {e}")
                return {"error": "GoodVibe AI Error."}
        
        return {"response": "I'm in 'Lite Mode'. I can answer: 'Sales today', 'Open jobs', 'Stock of X'."}

    def _is_ollama_running(self):
        import urllib.request
        try:
            # Quick check to localhost:11434
            urllib.request.urlopen("http://localhost:11434", timeout=1)
            return True
        except:
            return False

    def _regex_matcher(self, query):
        conn = get_db_connection()
        c = conn.cursor()
        response = None
        
        try:
            # --- Sales Queries ---
            if 'sales' in query or 'revenue' in query:
                if 'today' in query:
                    c.execute("SELECT SUM(total) FROM sales WHERE date(date) = date('now')")
                    val = c.fetchone()[0] or 0.0
                    response = f"Sales today are ₹{val:,.2f}"
                elif 'week' in query:
                    c.execute("SELECT SUM(total) FROM sales WHERE date(date) >= date('now', '-7 days')")
                    val = c.fetchone()[0] or 0.0
                    response = f"Sales this week are ₹{val:,.2f}"
                elif 'all' in query or 'total' in query:
                    c.execute("SELECT SUM(total) FROM sales")
                    val = c.fetchone()[0] or 0.0
                    response = f"Total lifetime sales: ₹{val:,.2f}"

            # --- Job Queries ---
            elif 'job' in query or 'repair' in query:
                if 'open' in query or 'pending' in query:
                    c.execute("SELECT count(*) FROM jobs WHERE status NOT IN ('DELIVERED')")
                    val = c.fetchone()[0]
                    response = f"There are {val} open repair jobs."

        except Exception as e:
            response = f"Error processing request"
        finally:
            conn.close()
        
        if response:
            return {"response": response}
        return None

    def _query_ollama(self, user_query, history=[]):
        # 1. Cloud Mode (Priority if Key exists)
        cloud_key = "d048b9322f674102aa003cfc4d4bab4e.TFXEXYm7ob8NAOqwRJAuKlG6"
        
        if cloud_key:
            try:
                # Use official Ollama Client with custom host/headers
                from ollama import Client
                client = Client(
                    host="https://ollama.com",
                    headers={'Authorization': f'Bearer {cloud_key}'}
                )
                
                # Model
                model_name = "gpt-oss:120b" 
                
                # Construct Messages with History
                messages = [{'role': 'system', 'content': self.system_prompt}]
                
                # Add History (Sanitize roles if needed)
                for msg in history:
                     # Only keep 'user' and 'assistant' roles
                     if msg.get('role') in ['user', 'assistant']:
                         messages.append({'role': msg['role'], 'content': msg['content']})

                # Add Current Query
                messages.append({'role': 'user', 'content': user_query})

                res = client.chat(model=model_name, messages=messages)
                
                return self._handle_llm_response(res['message']['content'], user_query, client, model_name)
            except Exception as e:
                print(f"Cloud Error: {e}")
                return {"error": f"Ollama Cloud Error: {str(e)}"}

        # 2. Local fallback removed per previous step
        return {"error": "Configuration Error"}

    def _handle_llm_response(self, text_response, user_query, client=None, model_name=None):
            sql_query = text_response.strip().replace('```sql','').replace('```','')
            if "SELECT" not in sql_query.upper():
                 # Maybe it answered directly?
                 return {"response": text_response}

            # Safety Check (Read Only)
            if "DROP" in sql_query.upper() or "DELETE" in sql_query.upper() or "UPDATE" in sql_query.upper():
                return {"response": "I cannot perform destructive actions."}

            conn = get_db_connection()
            c = conn.cursor()
            rows = []
            try:
                c.execute(sql_query)
                rows = c.fetchall()
            except Exception as e:
                return {"response": f"Query Error: {e}"}
            finally:
                conn.close()
            
            # Serialize rows
            result_data = [dict(row) for row in rows[:5]]
            result_str = str(result_data)

            with open("C:\\Users\\sha\\.gemini\\antigravity\\scratch\\store_assistant\\debug_sql.txt", "a") as f:
                f.write(f"Query: {user_query}\nSQL: {sql_query}\n---\n")
            print(f"DEBUG SQL: {sql_query}", flush=True)
            
            # 3. Summarize (The "Human Touch")
            if client and model_name and rows:
                try:
                    summary_res = client.chat(model=model_name, messages=[
                        {'role': 'system', 'content': "You are a helpful assistant. specificy the answer based on the data provided. convert the data into a human friendly sentence. Do not mention 'database' or 'records'."},
                        {'role': 'user', 'content': f"User Question: {user_query}\nData Found: {result_str}"}
                    ])
                    return {"response": summary_res['message']['content']}
                except Exception as e:
                    print(f"Summary Error: {e}")
                    pass # Fallback below
            
            # Fallback to raw if summary fails or no client
            if not rows:
                 return {"response": "I found no data matching that."}
            return {"response": f"Found these results: {result_str}"}
