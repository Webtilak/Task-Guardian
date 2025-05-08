import os
import threading
from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Import Blueprints and oauth object
from auth import auth_blueprint, oauth
from task import task_blueprint
from statistics import statistics_blueprint
from settings import settings_blueprint
from app_calendar import calendar_blueprint
from lists import lists_blueprint
from tables import create_users_table, create_tasks_table, create_dashboard_table, create_lists_table
from reminder_worker import run_reminder_service

# Load environment variables
load_dotenv()

# Resolve full path to the 'client' folder
base_dir = os.path.abspath(os.path.dirname(__file__))
client_path = os.path.join(base_dir, "../client")

# Initialize Flask app
app = Flask(__name__, static_folder=client_path, static_url_path="")
app.secret_key = os.getenv("FLASK_SECRET_KEY")

# Initialize OAuth with app
oauth.init_app(app)

# Enable CORS
CORS(
    app,
    origins="*",
    methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"]
)

# Register Blueprints
app.register_blueprint(auth_blueprint, url_prefix="/api/auth")
app.register_blueprint(task_blueprint, url_prefix="/api/tasks")
app.register_blueprint(statistics_blueprint, url_prefix="/api/statistics")
app.register_blueprint(settings_blueprint, url_prefix="/api/settings")
app.register_blueprint(calendar_blueprint, url_prefix="/api/calendar")
app.register_blueprint(lists_blueprint, url_prefix="/api/lists")

# Serve index.html for root
@app.route("/")
def serve_home():
    return send_from_directory(app.static_folder, "index.html")

# Serve static files
@app.route("/<path:path>")
def serve_static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route("/oauth-callback")
def serve_oauth_callback():
    return send_from_directory(app.static_folder, "oauth-callback.html")


# Run app and start background reminder service
if __name__ == "__main__":
    threading.Thread(target=run_reminder_service, daemon=True).start()
    app.run(host='localhost', port=5000, debug=True)  
