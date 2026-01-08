from database import get_db_connection
import bcrypt

# Generate hash using bcrypt directly
password = b"admin"
salt = bcrypt.gensalt()
pw_hash = bcrypt.hashpw(password, salt) # Returns bytes

# Convert to string for storage if needed, or keep as bytes. 
# SQLite usually stores text, so decode.
pw_hash_str = pw_hash.decode('utf-8')

conn = get_db_connection()
c = conn.cursor()

# Check if admin exists
c.execute("SELECT * FROM users WHERE username = 'admin'")
user = c.fetchone()

if user:
    print(f"Updating admin password...")
    c.execute("UPDATE users SET password_hash = ? WHERE username = 'admin'", (pw_hash_str,))
    conn.commit()
    print("Admin password updated to 'admin'.")
else:
    print("Admin user not found, creating...")
    c.execute("INSERT INTO users (username, password_hash, role, branch_id) VALUES ('admin', ?, 'admin', 1)", (pw_hash_str,))
    conn.commit()
    print("Admin user created.")

conn.close()
