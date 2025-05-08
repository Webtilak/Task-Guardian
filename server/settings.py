import os
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from tables import get_db_connection
from flask_bcrypt import Bcrypt
from auth import token_required

settings_blueprint = Blueprint("settings", __name__)
bcrypt = Bcrypt()

# Allowed file extensions for uploaded images
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ------------------------------
# GET: Retrieve current user settings
# ------------------------------
@settings_blueprint.route("/", methods=["GET"])
@token_required
def get_settings(current_user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, email, profile_picture, phone, dark_mode, accent_color, 
                   email_notifications, sms_notifications, push_notifications
            FROM users
            WHERE id = %s
        """, (current_user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        if user:
            user_settings = {
                "id": user[0],
                "name": user[1],
                "email": user[2],
                "profile_picture": user[3],
                "phone": user[4],
                "dark_mode": user[5],
                "accent_color": user[6],
                "email_notifications": user[7],
                "sms_notifications": user[8],
                "push_notifications": user[9]
            }
            return jsonify({
                "success": True, 
                "message": "User settings retrieved successfully", 
                "settings": user_settings
            }), 200
        else:
            return jsonify({"success": False, "message": "User not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ------------------------------
# PUT: Update user settings
# (Profile: name, email, phone; Appearance; Notification preferences)
# ------------------------------
@settings_blueprint.route("/", methods=["PUT"])
@token_required
def update_settings(current_user_id):
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form

    new_email = data.get("email")
    new_name = data.get("name")
    new_phone = data.get("phone")
    # Appearance settings
    dark_mode = data.get("dark_mode")  # Expected as boolean or string "true"/"false"
    accent_color = data.get("accent_color")
    # Notification preferences
    email_notifications = data.get("email_notifications")
    sms_notifications = data.get("sms_notifications")
    push_notifications = data.get("push_notifications")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        update_fields = []
        values = []

        if new_email:
            update_fields.append("email = %s")
            values.append(new_email)
        if new_name:
            update_fields.append("name = %s")
            values.append(new_name)
        if new_phone:
            update_fields.append("phone = %s")
            values.append(new_phone)
        if dark_mode is not None:
            if isinstance(dark_mode, str):
                dark_mode = dark_mode.lower() == "true"
            update_fields.append("dark_mode = %s")
            values.append(dark_mode)
        if accent_color:
            update_fields.append("accent_color = %s")
            values.append(accent_color)
        if email_notifications is not None:
            if isinstance(email_notifications, str):
                email_notifications = email_notifications.lower() == "true"
            update_fields.append("email_notifications = %s")
            values.append(email_notifications)
        if sms_notifications is not None:
            if isinstance(sms_notifications, str):
                sms_notifications = sms_notifications.lower() == "true"
            update_fields.append("sms_notifications = %s")
            values.append(sms_notifications)
        if push_notifications is not None:
            if isinstance(push_notifications, str):
                push_notifications = push_notifications.lower() == "true"
            update_fields.append("push_notifications = %s")
            values.append(push_notifications)

        if update_fields:
            values.append(current_user_id)
            sql = "UPDATE users SET " + ", ".join(update_fields) + " WHERE id = %s"
            cursor.execute(sql, tuple(values))
            conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Settings updated successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ------------------------------
# POST: Upload Profile Picture
# ------------------------------
@settings_blueprint.route("/upload-profile-picture", methods=["POST"])
@token_required
def upload_profile_picture(current_user_id):
    if 'profile_picture' not in request.files:
        return jsonify({"success": False, "message": "No file part in the request"}), 400
    file = request.files['profile_picture']
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        upload_folder = os.path.join(current_app.root_path, 'uploads')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET profile_picture = %s WHERE id = %s", (filename, current_user_id))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({
                "success": True, 
                "message": "Profile picture updated successfully", 
                "profile_picture": filename
            }), 200
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500
    else:
        return jsonify({"success": False, "message": "File type not allowed"}), 400

# ------------------------------
# POST: Change User Password
# ------------------------------
@settings_blueprint.route("/update-password", methods=["POST"])
@token_required
def update_password(current_user_id):
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form

    current_password = data.get("current_password")
    new_password = data.get("new_password")
    if not all([current_password, new_password]):
        return jsonify({"success": False, "message": "Current and new passwords are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT password FROM users WHERE id = %s", (current_user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        stored_password = user[0]
        if not bcrypt.check_password_hash(stored_password, current_password):
            return jsonify({"success": False, "message": "Current password is incorrect"}), 401
        hashed_new_password = bcrypt.generate_password_hash(new_password).decode("utf-8")
        cursor.execute("UPDATE users SET password = %s WHERE id = %s", (hashed_new_password, current_user_id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Password changed successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ------------------------------
# POST: Logout (Simulated)
# ------------------------------
@settings_blueprint.route("/logout", methods=["POST"])
@token_required
def logout(current_user_id):
    # For token-based auth, the client simply discards the token.
    # Optionally, implement token blacklisting.
    return jsonify({"success": True, "message": "Logged out successfully"}), 200

# ------------------------------
# Serve Uploaded Images
# ------------------------------
@settings_blueprint.route('/uploads/<filename>', methods=["GET"])
def uploaded_file(filename):
    upload_folder = os.path.join(current_app.root_path, 'uploads')
    return send_from_directory(upload_folder, filename)
