from flask import Blueprint, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from tables import get_db_connection
from auth import token_required  # Import the JWT decorator

task_blueprint = Blueprint("task", __name__)

@task_blueprint.route("/create", methods=["POST"])
@token_required
def create_task(current_user_id):
    data = request.get_json()
    name = data.get("name")
    list_name = data.get("list_name")
    notes = data.get("notes")
    priority = data.get("priority", False)
    date = data.get("date")
    time = data.get("time")
    completed = data.get("completed", False)
    repeat_frequency = data.get("repeat_frequency", "none")
    repeat_interval = data.get("repeat_interval", 1)
    end_repeat = data.get("end_repeat")
    schedule_time = data.get("schedule_time")

    if not name or not date:
        return jsonify({"success": False, "message": "Task name and date are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tasks (
                user_id, name, list_name, notes, priority, date, time, completed,
                repeat_frequency, repeat_interval, end_repeat, schedule_time
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            current_user_id, name, list_name, notes, priority, date, time, completed,
            repeat_frequency, repeat_interval, end_repeat, schedule_time
        ))
        
        task_id = cursor.fetchone()[0]
        conn.commit()
        return jsonify({
            "success": True, 
            "message": "Task created successfully", 
            "task_id": task_id
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@task_blueprint.route("/", methods=["GET"])
@token_required
def get_tasks(current_user_id):
    date_filter = request.args.get("date")
    list_name = request.args.get("list_name")  # NEW

    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT 
                id, 
                name, 
                list_name, 
                notes, 
                priority,
                to_char(date, 'YYYY-MM-DD') as date,
                to_char(time, 'HH24:MI') as time,
                completed,
                repeat_frequency, 
                repeat_interval,
                to_char(end_repeat, 'YYYY-MM-DD') as end_repeat,
                to_char(schedule_time, 'HH24:MI') as schedule_time
            FROM tasks 
            WHERE user_id = %s
        """
        params = [current_user_id]

        if list_name:
            query += " AND list_name = %s"
            params.append(list_name)

        if date_filter:
            query += " AND date = %s"
            params.append(date_filter)

        cursor.execute(query, tuple(params))
        tasks = cursor.fetchall()

        return jsonify({
            "success": True,
            "message": "Tasks retrieved successfully",
            "tasks": tasks
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@task_blueprint.route("/update/<int:task_id>", methods=["PUT"])
@token_required
def update_task(current_user_id, task_id):
    data = request.get_json()
    name = data.get("name")
    list_name = data.get("list_name")
    notes = data.get("notes")
    priority = data.get("priority")
    date = data.get("date")
    time = data.get("time")
    completed = data.get("completed")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE tasks 
            SET name=%s, list_name=%s, notes=%s, 
                priority=%s, date=%s, time=%s, completed=%s
            WHERE id=%s AND user_id=%s
        """, (name, list_name, notes, priority, date, time, completed, task_id, current_user_id))
        
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Task not found or unauthorized"}), 404
            
        conn.commit()
        return jsonify({"success": True, "message": "Task updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@task_blueprint.route("/delete/<int:task_id>", methods=["DELETE"])
@token_required
def delete_task(current_user_id, task_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM tasks 
            WHERE id=%s AND user_id=%s
        """, (task_id, current_user_id))
        
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Task not found or unauthorized"}), 404
            
        conn.commit()
        return jsonify({"success": True, "message": "Task deleted successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()