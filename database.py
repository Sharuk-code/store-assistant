import sqlite3
from typing import Optional

DB_NAME = "store.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Enable Foreign Keys
    c.execute("PRAGMA foreign_keys = ON;")
    
    # Create Tables
    # 1. Branches
    c.execute("""
    CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT
    );
    """)

    # 2. Users (Roles: admin, manager, staff, tech)
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        role TEXT NOT NULL,
        branch_id INTEGER,
        FOREIGN KEY (branch_id) REFERENCES branches (id)
    );
    """)
    
    # Migration: Add password_hash if not exists (for existing DB)
    try:
        c.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
    except sqlite3.OperationalError:
        pass # Column likely exists or table just created


    # 3. Products (Inventory)
    c.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE, 
        name TEXT NOT NULL,
        category TEXT,
        price REAL NOT NULL,
        cost REAL,
        stock_qty INTEGER DEFAULT 0,
        is_serialized BOOLEAN DEFAULT 0,
        branch_id INTEGER,
        FOREIGN KEY (branch_id) REFERENCES branches (id)
    );
    """)

    # 4. Sales
    c.execute("""
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_no TEXT UNIQUE NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        subtotal REAL NOT NULL,
        tax REAL DEFAULT 0,
        total REAL NOT NULL,
        payment_mode TEXT DEFAULT 'CASH', 
        branch_id INTEGER,
        FOREIGN KEY (branch_id) REFERENCES branches (id)
    );
    """)

    # Migration: Add discount to sales if not exists
    try:
        c.execute("ALTER TABLE sales ADD COLUMN discount REAL DEFAULT 0")
    except sqlite3.OperationalError:
        pass

    # 5. Sale Items
    c.execute("""
    CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT,
        sku TEXT,
        qty INTEGER NOT NULL,
        price REAL NOT NULL,
        total REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    );
    """)

    # 6. Jobs (Repairs)
    c.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_no TEXT UNIQUE,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        device_model TEXT NOT NULL,
        issue_description TEXT,
        status TEXT DEFAULT 'RECEIVED',
        estimated_cost REAL,
        advance_amount REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        branch_id INTEGER,
        FOREIGN KEY (branch_id) REFERENCES branches (id)
    );
    """)

    # Migration: Add repair_notes if not exists
    try:
        c.execute("ALTER TABLE jobs ADD COLUMN repair_notes TEXT")
    except sqlite3.OperationalError:
        pass

    # Migration: Add product_type to products
    try:
        c.execute("ALTER TABLE products ADD COLUMN product_type TEXT DEFAULT 'PHYSICAL'")
        # Update existing Service item
        c.execute("UPDATE products SET product_type = 'SERVICE' WHERE sku = 'SERVICE'")
    except sqlite3.OperationalError:
        pass

    # Migration: Add technician to jobs
    try:
        c.execute("ALTER TABLE jobs ADD COLUMN technician TEXT")
    except sqlite3.OperationalError:
        pass

    # 7. Suppliers
    c.execute('''CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_amount REAL,
        invoice_no TEXT,
        branch_id INTEGER,
        FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS purchase_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_id INTEGER,
        product_id INTEGER,
        qty INTEGER,
        cost_price REAL,
        FOREIGN KEY(purchase_id) REFERENCES purchases(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')
    
    # Seed default settings if empty
    c.execute("SELECT count(*) FROM settings")
    if c.fetchone()[0] == 0:
        c.executemany("INSERT INTO settings (key, value) VALUES (?, ?)", [
            ('store_name', 'My Mobile Store'),
            ('store_address', '123, Main Street, City'),
            ('store_phone', '9876543210'),
            ('invoice_footer', 'Thank you for your business!')
        ])

    # Seed initial data if empty
    c.execute("SELECT count(*) FROM branches")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO branches (name, address) VALUES ('Main Branch', 'City Center')")
        
        # Admin User (password: admin)
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        pw_hash = pwd_context.hash("admin")
        
        c.execute("INSERT INTO users (username, password_hash, role, branch_id) VALUES (?, ?, 'admin', 1)", ('admin', pw_hash))
        print("Database seeded with initial data.")

    # Seed Service Product
    c.execute("SELECT count(*) FROM products WHERE sku = 'SERVICE'")
    if c.fetchone()[0] == 0:
        c.execute("""
            INSERT INTO products (sku, name, category, price, stock_qty, is_serialized, branch_id)
            VALUES ('SERVICE', 'Repair Service', 'Services', 0, 99999, 0, 1)
        """)
        print("Seeded Service Product.")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized.")
