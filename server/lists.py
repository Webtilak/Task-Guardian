from flask import Blueprint, request, jsonify
from tables import get_db_connection

lists_blueprint = Blueprint("lists", __name__)

@lists_blueprint.route("/", methods=["POST"])
def create_list():
    data = request.get_json()
    user_id = data.get("user_id")
    name = data.get("name")
    if not user_id or not name:
        return jsonify({"success": False, "message": "User ID and list name are required"}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO lists (name, user_id) VALUES (%s, %s) RETURNING id", (name, user_id))
        list_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "List created successfully", "list": {"id": list_id, "name": name}}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@lists_blueprint.route("/", methods=["GET"])
def get_lists():
    user_id = request.args.get("user_id")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name FROM lists WHERE user_id = %s", (user_id,))
        lists = cursor.fetchall()
        lists = [{"id": l[0], "name": l[1]} for l in lists]
        cursor.close()
        conn.close()
        return jsonify({"success": True, "lists": lists}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@lists_blueprint.route("/<int:list_id>", methods=["DELETE"])
def delete_list(list_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM lists WHERE id = %s", (list_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "List deleted successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
