from database import get_db_connection

conn = get_db_connection()
c = conn.cursor()

try:
    c.execute("INSERT INTO users (username, password_hash, role, branch_id) VALUES ('Antigravity', 'system_hash', 'technician', 1)")
    conn.commit()
    print("User 'Antigravity' created successfully.")
except Exception as e:
    print(f"Error (maybe already exists): {e}")

# Verify
c.execute("SELECT username, role FROM users")
print("USERS:", c.fetchall())

conn.close()
