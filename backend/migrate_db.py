import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

conn = pymysql.connect(
    host=os.getenv('DATABASE_HOST', 'localhost'),
    port=int(os.getenv('DATABASE_PORT', 3306)),
    user=os.getenv('DATABASE_USER', 'root'),
    password=os.getenv('DATABASE_PASSWORD', ''),
    database=os.getenv('DATABASE_NAME', 'h2_medical_reports'),
    autocommit=True
)

cursor = conn.cursor()

def add_col_if_missing(table, col, col_def):
    cursor.execute(f"DESCRIBE {table}")
    existing_cols = [r[0] for r in cursor.fetchall()]
    if col not in existing_cols:
        print(f"Adding {col} to {table}...")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}")
    else:
        print(f"{table}.{col} already exists.")

add_col_if_missing('reports', 'laboratory_name', 'VARCHAR(255) NULL')
add_col_if_missing('reports', 'uploaded_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
add_col_if_missing('test_results', 'status', "VARCHAR(50) NOT NULL DEFAULT 'unknown'")
add_col_if_missing('test_results', 'important_note', 'TEXT NULL')
add_col_if_missing('comparisons', 'comparison_data', 'LONGTEXT NULL')
add_col_if_missing('report_metadata', 'report_summary', 'LONGTEXT NULL')
add_col_if_missing('report_metadata', 'general_notes', 'LONGTEXT NULL')

print("All database columns migrated successfully!")
conn.close()
