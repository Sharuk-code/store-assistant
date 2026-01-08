from database import get_db_connection

conn = get_db_connection()
c = conn.cursor()

job_no = 'JOB-E23E95'
tech = 'Antigravity'

print(f"Assigning {tech} to {job_no}...")
c.execute("UPDATE jobs SET technician = ? WHERE job_no = ?", (tech, job_no))
conn.commit()

# Verify
c.execute("SELECT job_no, technician FROM jobs WHERE job_no = ?", (job_no,))
row = c.fetchone()
print(f"VERIFY: {list(row)}")

conn.close()
