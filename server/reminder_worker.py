import time
import smtplib
import os
from datetime import datetime
from email.message import EmailMessage
from dotenv import load_dotenv
from tables import get_db_connection

# ===============================
# Load Environment Variables
# ===============================
load_dotenv()

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

# ===============================
# Email Sender Function
# ===============================
def send_email(to_email, subject, body):
    msg = EmailMessage()
    msg['From'] = EMAIL_USER
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.set_content(body)
    
    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(msg)
        print(f"✅ Email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")

# ===============================
# Reminder Checker
# ===============================
def check_and_send_reminders():
    now = datetime.now()
    current_date = now.date()
    current_time_str = now.strftime('%H:%M')  # Format time as HH:MM

    print(f"🔍 Looking for tasks scheduled at {current_time_str} on {current_date}...")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query tasks for the current date and matching schedule time
        cursor.execute("""
            SELECT t.id, u.email, u.name, t.name, t.date, t.time
            FROM tasks t
            JOIN users u ON t.user_id = u.id
            WHERE 
                t.completed = FALSE AND
                t.reminder_sent = FALSE AND
                u.email_notifications = TRUE AND
                t.date = %s AND
                to_char(t.time, 'HH24:MI') = %s
        """, (current_date, current_time_str))
        
        tasks = cursor.fetchall()
        if not tasks:
            print("ℹ️ No tasks found to remind right now.")

        for task in tasks:
            task_id, email, user_name, task_name, date, time_str = task
            subject = f"⏰ Reminder: {task_name}"
            body = (
                f"Hi {user_name},\n\n"
                f"Your task \"{task_name}\" is scheduled for {time_str} on {date}.\n\n"
                f"- Task Manager"
            )
            send_email(email, subject, body)
            
            # Mark the reminder as sent so it is not resent
            cursor.execute("UPDATE tasks SET reminder_sent = TRUE WHERE id = %s", (task_id,))
            conn.commit()
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error during reminder check: {e}")

# ===============================
# Main Loop
# ===============================
def run_reminder_service():
    print("📬 Reminder service started.")
    while True:
        check_and_send_reminders()
        time.sleep(10)  # Check every 10 seconds; adjust as needed

# Optional: run manually
if __name__ == "__main__":
    run_reminder_service()
