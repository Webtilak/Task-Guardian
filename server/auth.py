from flask import Blueprint, request, jsonify, url_for, redirect
import psycopg2
from psycopg2.extras import RealDictCursor
from flask_bcrypt import Bcrypt
from tables import get_db_connection
from datetime import datetime, timedelta
import jwt
from dotenv import load_dotenv
import os
from functools import wraps
from authlib.integrations.flask_client import OAuth

# Load environment variables
load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5000")

# Initialize Flask Blueprint
auth_blueprint = Blueprint("auth", __name__)
bcrypt = Bcrypt()
oauth = OAuth()

# OAuth Configuration
oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
    authorize_params={'redirect_uri': 'http://localhost:5000/api/auth/google/callback'}
)

oauth.register(
    name='github',
    client_id=os.getenv('GITHUB_CLIENT_ID'),
    client_secret=os.getenv('GITHUB_CLIENT_SECRET'),
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize',
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'},
    authorize_params={'redirect_uri': 'http://localhost:5000/api/auth/github/callback'}
)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split()[1]
            
        if not token:
            return jsonify({"success": False, "message": "Token is missing!"}), 401
            
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user_id = data['user_id']
        except Exception as e:
            return jsonify({"success": False, "message": "Token is invalid!"}), 401
            
        return f(current_user_id, *args, **kwargs)
        
    return decorated

# Helper function to handle OAuth users
def handle_oauth_user(email, name, provider):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Check existing user
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            # Create new OAuth user
            cursor.execute(
                """INSERT INTO users (name, email, password, oauth_provider)
                VALUES (%s, %s, %s, %s) RETURNING id""",
                (name, email, None, provider)
            )
            user_id = cursor.fetchone()['id']
            conn.commit()
        else:
            user_id = user['id']

        # Generate JWT token
        token = jwt.encode({
            "user_id": user_id,
            "exp": datetime.utcnow() + timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")

        return redirect( f"{FRONTEND_URL}/oauth-callback.html?token={token}&username={name}&userId={user_id}")
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn:
            cursor.close()
            conn.close()

# OAuth Routes
@auth_blueprint.route('/google')
def google_login():
    redirect_uri = url_for('auth.google_auth', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@auth_blueprint.route('/google/callback')
def google_auth():
    try:
        token = oauth.google.authorize_access_token()
        user_info = token.get('userinfo')
        
        if not user_info or not user_info.get('email'):
            return jsonify({"success": False, "message": "Google authentication failed"}), 400
            
        return handle_oauth_user(
            email=user_info['email'],
            name=user_info.get('name', user_info['email']),
            provider='google'
        )
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@auth_blueprint.route('/github')
def github_login():
    redirect_uri = url_for('auth.github_auth', _external=True)
    return oauth.github.authorize_redirect(redirect_uri)

@auth_blueprint.route('/github/callback')
def github_auth():
    try:
        token = oauth.github.authorize_access_token()
        resp = oauth.github.get('user')
        user_info = resp.json()
        emails = oauth.github.get('user/emails').json()
        
        primary_email = next((e['email'] for e in emails if e['primary']), None)
        if not primary_email:
            return jsonify({"success": False, "message": "Email not found"}), 400
            
        return handle_oauth_user(
            email=primary_email,
            name=user_info.get('name', user_info.get('login')),
            provider='github'
        )
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# Existing Email/Password Auth Routes
@auth_blueprint.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        if not name or not email or not password:
            return jsonify({"success": False, "message": "All fields are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE email = %s OR name = %s", (email, name))
        if cursor.fetchone():
            return jsonify({
                "success": False, 
                "message": "User already exists"
            }), 400

        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (%s, %s, %s) RETURNING id",
            (name, email, hashed_password)
        )
        conn.commit()
        return jsonify({"success": True, "message": "User registered successfully"}), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn:
            cursor.close()
            conn.close()

@auth_blueprint.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"success": False, "message": "Email and password required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if user and user['password'] and bcrypt.check_password_hash(user["password"], password):
            token = jwt.encode({
                "user_id": user["id"],
                "exp": datetime.utcnow() + timedelta(hours=24)
            }, SECRET_KEY, algorithm="HS256")
            
            return jsonify({
                "success": True,
                "message": "Login successful",
                "user_id": user["id"],
                "user_name": user["name"],
                "token": token
            }), 200
            
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn:
            cursor.close()
            conn.close()