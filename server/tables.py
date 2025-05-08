import psycopg2

# Database connection parameters
DB_NAME = "task_reminder"
DB_USER = "postgres"
DB_PASSWORD = "tilak"
DB_HOST = "localhost"
DB_PORT = "5432"

# Function to connect to the database
def get_db_connection():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )

# Function to create the users table
def create_users_table():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100) UNIQUE NOT NULL,
            password TEXT, 
            profile_picture VARCHAR(255),
            oauth_provider VARCHAR(50) 
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Users table created successfully.")
    except Exception as e:
        print(f"❌ Error creating users table: {e}")




# Function to create the tasks table
def create_tasks_table():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name VARCHAR(255) NOT NULL,
            list_name VARCHAR(100),
            notes TEXT,
            priority BOOLEAN DEFAULT FALSE,
            date DATE,
            time TIME,
            completed BOOLEAN DEFAULT FALSE,
            repeat_frequency VARCHAR(20) DEFAULT 'none',
            repeat_interval INT DEFAULT 1,
            end_repeat DATE,
            schedule_time TIME,
            reminder_sent BOOLEAN DEFAULT FALSE,  -- NEW column added for email reminders
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Tasks table updated successfully.")
    except Exception as e:
        print(f"❌ Error creating tasks table: {e}")



# Function to create the dashboard table
def create_dashboard_table():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS dashboard (
                id SERIAL PRIMARY KEY,
                stat_date DATE NOT NULL,
                user_id INTEGER NOT NULL,
                total_tasks INT,
                completed_tasks INT,
                in_progress INT,
                pending INT,
                efficiency INT,
                UNIQUE(stat_date, user_id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Dashboard table created successfully.")
    except Exception as e:
        print(f"❌ Error creating dashboard table: {e}")


def create_lists_table():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lists (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                user_id INTEGER,
                UNIQUE(name, user_id)
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Lists table created successfully.")
    except Exception as e:
        print(f"❌ Error creating lists table: {e}")


# When this script is run directly, create all tables.
if __name__ == "__main__":
    create_users_table()
    create_tasks_table()
    create_lists_table()
    create_dashboard_table()
