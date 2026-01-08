from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.responses import HTMLResponse
from typing import List, Optional
from pydantic import BaseModel
import time

app = FastAPI(title="GoodVibe")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- AI Assistant API ---
from ai_service import GoodVibeAI
# Initialize AI Service
ai_engine = GoodVibeAI()
print("DEBUG: AI Service Initialized")

class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

@app.post("/api/ai/chat")
async def chat_with_ai(chat: AIChatRequest):
    print(f"DEBUG: AI Request Received: {chat.message}")
    result = ai_engine.process_query(chat.message, chat.history)
    print(f"DEBUG: AI Response: {result}")
    return result
# ------------------------

# Templates
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}

# --- Dependency ---
from database import get_db_connection, init_db
from models import Product, ProductCreate
import sqlite3

@app.on_event("startup")
def on_startup():
    init_db()
    
# --- API Routes ---

@app.get("/api/inventory", response_model=List[Product])
async def get_inventory(search: Optional[str] = None):
    conn = get_db_connection()
    c = conn.cursor()
    query = "SELECT * FROM products"
    params = []
    if search:
        search = search.strip()
        query += " WHERE LOWER(name) LIKE LOWER(?) OR LOWER(sku) LIKE LOWER(?)"
        params = [f"%{search}%", f"%{search}%"]
    
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    # Convert Row objects to dicts for Pydantic
    return [dict(row) for row in rows]

@app.post("/api/inventory", response_model=Product)
async def create_product(product: ProductCreate):
    conn = get_db_connection()
    c = conn.cursor()
    try:
        c.execute("""
            INSERT INTO products (sku, name, category, price, cost, stock_qty, is_serialized, branch_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            product.sku, product.name, product.category, product.price, 
            product.cost, product.stock_qty, product.is_serialized, product.branch_id
        ))
        product_id = c.lastrowid
        conn.commit()
        return {**product.dict(), "id": product_id}
    except sqlite3.IntegrityError:
        conn.close()
        # In a real app, raise 400
        return {**product.dict(), "id": -1, "name": "Error: SKU Exists"}
    finally:
        conn.close()

@app.delete("/api/inventory/{product_id}")
async def delete_product(product_id: int):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "id": product_id}

# --- Sales API ---

from models import SaleCreate, Sale
import datetime
import uuid

@app.post("/api/sales")
async def create_sale(sale: SaleCreate):
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        # 1. Calculate Totals & Verify Stock
        subtotal = 0.0
        for item in sale.items:
            # Check stock
            c.execute("SELECT stock_qty, name, sku, product_type FROM products WHERE id = ?", (item.product_id,))
            product = c.fetchone()
            if not product:
                raise Exception(f"Product ID {item.product_id} not found")
            
            # Only validate stock for PHYSICAL goods
            if product['product_type'] != 'SERVICE':
                if product['stock_qty'] < item.qty:
                     raise Exception(f"Insufficient stock for {product['name']}")
            
            subtotal += item.price * item.qty

        # 2. Create Sale Record
        invoice_no = f"INV-{uuid.uuid4().hex[:8].upper()}"
        
        # Calculate Total
        discount = sale.discount
        tax = 0 # Placeholder for tax logic
        total = subtotal + tax - discount
        if total < 0: total = 0
        
        # Upsert Customer
        cust_id = None
        if sale.customer_phone:
            c.execute("SELECT id FROM customers WHERE phone = ?", (sale.customer_phone,))
            cust = c.fetchone()
            if cust:
                cust_id = cust['id']
                c.execute("UPDATE customers SET name = ? WHERE id = ?", (sale.customer_name, cust_id))
            else:
                c.execute("INSERT INTO customers (name, phone) VALUES (?, ?)", (sale.customer_name, sale.customer_phone))
                cust_id = c.lastrowid

        c.execute("""
            INSERT INTO sales (invoice_no, customer_name, customer_phone, subtotal, total, payment_mode, branch_id, discount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (invoice_no, sale.customer_name, sale.customer_phone, subtotal, total, sale.payment_mode, sale.branch_id, discount))
        
        sale_id = c.lastrowid

        # 3. Insert Items & Deduct Stock
        for item in sale.items:
            c.execute("SELECT name, sku, product_type FROM products WHERE id = ?", (item.product_id,))
            p = c.fetchone()
            
            # Use custom name if provided (e.g. for services), else DB name
            final_name = item.product_name if item.product_name else (p['name'] if p else "Unknown")
            sku = p['sku'] if p else "MISC"
            
            item_total = item.price * item.qty
            c.execute("""
                INSERT INTO sale_items (sale_id, product_id, product_name, sku, qty, price, total)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (sale_id, item.product_id, final_name, sku, item.qty, item.price, item_total))
            
            # Deduct Stock
            if p and p['product_type'] != 'SERVICE':
                c.execute("UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?", (item.qty, item.product_id))

            # Auto-Close Repair Job if linked
            if item.job_no:
                c.execute("UPDATE jobs SET status = 'DELIVERED', updated_at = CURRENT_TIMESTAMP WHERE job_no = ?", (item.job_no,))

        conn.commit()
        return {"id": sale_id, "invoice_no": invoice_no, "status": "success"}

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
    finally:
        conn.close()

@app.get("/api/sales/recent")
async def get_recent_sales():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM sales ORDER BY date DESC LIMIT 10")
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/print/invoice/{invoice_no}", response_class=HTMLResponse)
async def print_invoice(request: Request, invoice_no: str):
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get Sale
    c.execute("SELECT * FROM sales WHERE invoice_no = ?", (invoice_no,))
    sale = c.fetchone()
    
    if not sale:
        return HTMLResponse("<h1>Invoice not found</h1>", status_code=404)

    # Get Items
    c.execute("SELECT * FROM sale_items WHERE sale_id = ?", (sale['id'],))
    items = c.fetchall()
    
    # Get Settings
    c.execute("SELECT key, value FROM settings")
    settings_rows = c.fetchall()
    settings = {row['key']: row['value'] for row in settings_rows}

    conn.close()
    
    return templates.TemplateResponse("invoice.html", {
        "request": request,
        "invoice_no": sale['invoice_no'],
        "date": sale['date'],
        "customer_name": sale['customer_name'],
        "customer_phone": sale['customer_phone'],
        "items": items,
        "subtotal": sale['subtotal'],
        "tax": sale['tax'],
        "total": sale['total'],
        "discount": sale['discount'] if 'discount' in sale.keys() else 0, # Handle old records safely
        "payment_mode": sale['payment_mode'],
        # Dynamic Settings
        "store_name": settings.get('store_name', 'My Store'),
        "store_address": settings.get('store_address', ''),
        "store_phone": settings.get('store_phone', ''),
        "invoice_footer": settings.get('invoice_footer', 'Thank you!')
    })

# --- Repairs API ---

from models import JobCreate, Job

@app.get("/api/jobs", response_model=List[Job])
async def get_jobs():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM jobs ORDER BY created_at DESC")
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/api/jobs/{job_id}", response_model=Job)
async def get_job(job_id: int):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    row = c.fetchone()
    conn.close()
    if row:
        return dict(row)
    raise HTTPException(status_code=404, detail="Job not found")

@app.post("/api/jobs", response_model=Job)
async def create_job(job: JobCreate):
    conn = get_db_connection()
    c = conn.cursor()
    job_no = f"JOB-{uuid.uuid4().hex[:6].upper()}"
    
    try:
        # Upsert Customer
        if job.customer_phone:
            c.execute("SELECT id FROM customers WHERE phone = ?", (job.customer_phone,))
            cust = c.fetchone()
            if cust:
                c.execute("UPDATE customers SET name = ? WHERE id = ?", (job.customer_name, cust['id']))
            else:
                c.execute("INSERT INTO customers (name, phone) VALUES (?, ?)", (job.customer_name, job.customer_phone))

        c.execute("""
            INSERT INTO jobs (job_no, customer_name, customer_phone, device_model, issue_description, status, estimated_cost, advance_amount, branch_id, repair_notes, technician)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (job_no, job.customer_name, job.customer_phone, job.device_model, job.issue_description, job.status, job.estimated_cost, job.advance_amount, job.branch_id, job.repair_notes, job.technician))
        
        job_id = c.lastrowid
        conn.commit()
        
        # Return full object
        c.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
        row = c.fetchone()
        return dict(row)
    except Exception as e:
        conn.rollback()
        print(f"Error creating job: {e}") # DEBUG
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.put("/api/jobs/{job_id}/status")
async def update_job_status(job_id: int, status: str):
    conn = get_db_connection()
    c = conn.cursor()
    
    # Check current status
    c.execute("SELECT status FROM jobs WHERE id = ?", (job_id,))
    job = c.fetchone()
    if not job:
        conn.close()
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job['status'] == 'DELIVERED':
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot change status of a Delivered job.")

    c.execute("UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (status, job_id))
    conn.commit()
    conn.close()
    return {"status": "success", "new_status": status}

@app.get("/api/users")
async def get_users():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT id, username, role FROM users")
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.put("/api/jobs/{job_id}")
async def update_job_details(job_id: int, job: JobCreate):
    conn = get_db_connection()
    c = conn.cursor()
    
    # Check if job exists
    c.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Job not found")

    c.execute("""
        UPDATE jobs 
        SET customer_name=?, customer_phone=?, device_model=?, issue_description=?, 
            estimated_cost=?, advance_amount=?, repair_notes=?, technician=?, updated_at=CURRENT_TIMESTAMP 
        WHERE id=?
    """, (job.customer_name, job.customer_phone, job.device_model, job.issue_description, 
          job.estimated_cost, job.advance_amount, job.repair_notes, job.technician, job_id))
    
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: int, request: Request):
    # Auth Check
    current_user = get_current_user_from_token(request)
    if not current_user or current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized to delete jobs")

    conn = get_db_connection()
    c = conn.cursor()
    
    # Check if job exists
    c.execute("SELECT status FROM jobs WHERE id = ?", (job_id,))
    job = c.fetchone()
    if not job:
        conn.close()
        raise HTTPException(status_code=404, detail="Job not found")

    c.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}

@app.delete("/api/inventory/{product_id}")
async def delete_product(product_id: int, request: Request):
    # Auth Check
    current_user = get_current_user_from_token(request)
    if not current_user or current_user['role'] not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized to delete products")

    conn = get_db_connection()
    c = conn.cursor()
    
    c.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}

# --- Dashboard API ---

@app.get("/api/settings")
async def get_settings():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT key, value FROM settings")
    rows = c.fetchall()
    conn.close()
    return {row[0]: row[1] for row in rows}

class SettingsUpdate(BaseModel):
    store_name: str
    store_address: str
    store_phone: str
    invoice_footer: str

@app.post("/api/settings")
async def update_settings(settings: SettingsUpdate):
    conn = get_db_connection()
    c = conn.cursor()
    data = settings.dict()
    for key, value in data.items():
        c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, value))
    conn.commit()
    conn.close()
    return {"status": "updated"}

@app.get("/api/backup")
async def download_backup():
    from fastapi.responses import FileResponse
    return FileResponse("store.db", filename=f"store_backup_{int(time.time())}.db")

@app.get("/api/dashboard")
async def get_dashboard_stats():
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # ... (existing dashboard queries) ...
    # We will update this later for Low Stock
    
    # Removed premature return block


    conn = get_db_connection()
    c = conn.cursor()
    
    # 1. Sales Today
    today = datetime.date.today().isoformat()
    c.execute("SELECT SUM(total) FROM sales WHERE date(date) = ?", (today,))
    sales_today = c.fetchone()[0] or 0.0

    # 2. Open Jobs
    c.execute("SELECT count(*) FROM jobs WHERE status NOT IN ('DELIVERED', 'CANCELLED')")
    open_jobs = c.fetchone()[0]

    # 3. Low Stock Items
    c.execute("SELECT id, name, stock_qty FROM products WHERE stock_qty < 5 ORDER BY stock_qty ASC LIMIT 5")
    low_stock_items = [dict(row) for row in c.fetchall()]
    low_stock_count = len(low_stock_items)

    # 4. Recent Jobs (Last 5)
    c.execute("SELECT job_no, device_model, status FROM jobs ORDER BY created_at DESC LIMIT 5")
    recent_jobs = [dict(row) for row in c.fetchall()]

    # 5. Purchases Today
    c.execute("SELECT SUM(total_amount) FROM purchases WHERE date(date) = ?", (today,))
    purchases_today = c.fetchone()[0] or 0.0

    # 6. Recent Purchases
    c.execute("""
        SELECT p.invoice_no, s.name as supplier_name, p.total_amount, p.date 
        FROM purchases p 
        LEFT JOIN suppliers s ON p.supplier_id = s.id 
        ORDER BY p.date DESC LIMIT 5
    """)
    recent_purchases = [dict(row) for row in c.fetchall()]

    # 7. Ready for Billing (Finished Repairs)
    c.execute("SELECT count(*) FROM jobs WHERE status = 'READY'")
    ready_jobs_count = c.fetchone()[0]

    conn.close()
    
    print(f"DEBUG: Sales: {sales_today}, Open Jobs: {open_jobs}, Low Stock: {low_stock_count}, Ready Jobs: {ready_jobs_count}") # Debug log

    return {
        "sales_today": sales_today,
        "open_jobs": open_jobs,
        "low_stock_count": low_stock_count,
        "low_stock_items": low_stock_items,
        "recent_jobs": recent_jobs,
        "purchases_today": purchases_today,
        "recent_purchases": recent_purchases,
        "ready_jobs_count": ready_jobs_count
    }

@app.get("/api/analytics/sales")
async def get_sales_analytics(period: str = 'today'):
    conn = get_db_connection()
    c = conn.cursor()
    
    date_filter = "date(date) = date('now')" # Default today
    
    if period == '7d':
        date_filter = "date(date) >= date('now', '-7 days')"
    elif period == '30d':
        date_filter = "date(date) >= date('now', '-30 days')"
    elif period == '90d':
        date_filter = "date(date) >= date('now', '-90 days')"
    elif period == '6m':
        date_filter = "date(date) >= date('now', '-6 months')"
    elif period == '9m':
        date_filter = "date(date) >= date('now', '-9 months')"
    elif period == '12m':
        date_filter = "date(date) >= date('now', '-12 months')"
    elif period == 'all':
        date_filter = "1=1"

    query = f"SELECT SUM(total), COUNT(*) FROM sales WHERE {date_filter}"
    c.execute(query)
    row = c.fetchone()
    conn.close()
    
    return {
        "total": row[0] or 0.0,
        "count": row[1] or 0,
        "period": period
    }

# --- Purchases & Suppliers API ---

from models import Supplier, SupplierCreate, PurchaseCreate

@app.get("/api/suppliers", response_model=List[Supplier])
async def get_suppliers():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM suppliers")
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/api/suppliers", response_model=Supplier)
async def create_supplier(supplier: SupplierCreate):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("INSERT INTO suppliers (name, phone, gstin, address) VALUES (?, ?, ?, ?)", 
              (supplier.name, supplier.phone, supplier.gstin, supplier.address))
    supplier_id = c.lastrowid
    conn.commit()
    conn.close()
    return {**supplier.dict(), "id": supplier_id}

@app.get("/api/purchases")
async def get_purchases():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        SELECT p.id, p.invoice_no, p.date, p.total_amount, s.name as supplier_name 
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY p.date DESC
    """)
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/api/purchases")
async def create_purchase(purchase: PurchaseCreate):
    conn = get_db_connection()
    c = conn.cursor()
    try:
        # 1. Create Purchase Record
        c.execute("""
            INSERT INTO purchases (supplier_id, invoice_no, total_amount, branch_id)
            VALUES (?, ?, ?, ?)
        """, (purchase.supplier_id, purchase.invoice_no, purchase.total_amount, purchase.branch_id))
        purchase_id = c.lastrowid

        # 2. Add Items & Update Inventory Cost/Qty
        for item in purchase.items:
            c.execute("""
                INSERT INTO purchase_items (purchase_id, product_id, qty, cost_price)
                VALUES (?, ?, ?, ?)
            """, (purchase_id, item.product_id, item.qty, item.cost_price))
            
            # Update Stock: Increase Qty, Update Cost (Weighted Avg could be better, simplified to latest cost here)
            c.execute("""
                UPDATE products 
                SET stock_qty = stock_qty + ?, cost = ? 
                WHERE id = ?
            """, (item.qty, item.cost_price, item.product_id))

        conn.commit()
        return {"status": "success", "id": purchase_id}
    except Exception as e:
        conn.rollback()
        return {"error": str(e)}
    finally:
        conn.close()

# --- Customer API ---

from models import Customer, CustomerCreate

@app.get("/api/customers", response_model=List[Customer])
async def search_customers(search: Optional[str] = None):
    conn = get_db_connection()
    c = conn.cursor()
    if search:
        c.execute("SELECT * FROM customers WHERE phone LIKE ? OR name LIKE ? LIMIT 20", (f"%{search}%", f"%{search}%"))
    else:
        c.execute("SELECT * FROM customers ORDER BY created_at DESC LIMIT 50")
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/api/customers", response_model=Customer)
async def create_customer(customer: CustomerCreate):
    conn = get_db_connection()
    c = conn.cursor()
    try:
        # Check if exists
        c.execute("SELECT * FROM customers WHERE phone = ?", (customer.phone,))
        existing = c.fetchone()
        if existing:
            # Update existing
            c.execute("UPDATE customers SET name=?, email=?, address=? WHERE phone=?", 
                      (customer.name, customer.email, customer.address, customer.phone))
            customer_id = existing['id']
        else:
            # Create new
            c.execute("INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)", 
                      (customer.name, customer.phone, customer.email, customer.address))
            customer_id = c.lastrowid
        
        conn.commit()
        return {**customer.dict(), "id": customer_id}
    except Exception as e:
        conn.rollback()
        return {**customer.dict(), "id": -1, "name": "Error"}
    finally:
        conn.close()

# --- Auth API ---
import bcrypt
from fastapi import Response, Cookie, Depends, HTTPException, status
from passlib.context import CryptContext

def get_current_user_from_token(request: Request):
    token = request.cookies.get("session_token")
    if not token: return None
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT u.username, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?", (token,))
    user = c.fetchone()
    conn.close()
    return dict(user) if user else None

# --- User Management API ---
from models import UserCreate, User

@app.post("/api/users")
async def create_user(user: UserCreate, request: Request):
    # Auth Check (Only admin can create users)
    current_user = get_current_user_from_token(request)
    if not current_user or current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")

    conn = get_db_connection()
    c = conn.cursor()
    
    # Hash Password
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    pw_hash = pwd_context.hash(user.password)
    
    try:
        c.execute("INSERT INTO users (username, password_hash, role, branch_id) VALUES (?, ?, ?, ?)",
                  (user.username, pw_hash, user.role, user.branch_id))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")
    
    uid = c.lastrowid
    conn.close()
    return {"status": "success", "id": uid}

@app.get("/api/users")
async def get_users(role: Optional[str] = None):
    conn = get_db_connection()
    c = conn.cursor()
    if role:
        c.execute("SELECT id, username, role, branch_id FROM users WHERE role = ?", (role,))
    else:
        c.execute("SELECT id, username, role, branch_id FROM users")
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/login")
async def login(data: LoginRequest, response: Response):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username = ?", (data.username,))
    user = c.fetchone()
    
    # Bcrypt check
    valid = False
    if user and user['password_hash']:
        try:
             # Hash in DB is string, bcrypt needs bytes
             hashed = user['password_hash'].encode('utf-8')
             if bcrypt.checkpw(data.password.encode('utf-8'), hashed):
                 valid = True
        except Exception as e:
            print(f"Auth Block Error: {e}")

    if not valid:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create Session
    session_token = uuid.uuid4().hex
    c.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (session_token, user['id']))
    conn.commit()
    conn.close()
    
    response.set_cookie(key="session_token", value=session_token, httponly=True)
    return {"status": "success"}

@app.post("/api/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    if session_token:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("DELETE FROM sessions WHERE token = ?", (session_token,))
        conn.commit()
        conn.close()
    response.delete_cookie(key="session_token")
    return {"status": "logged_out"}

@app.get("/api/me")
async def get_current_user(session_token: Optional[str] = Cookie(None)):
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        SELECT u.username, u.role, u.branch_id 
        FROM sessions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.token = ?
    """, (session_token,))
    user = c.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    return dict(user)



