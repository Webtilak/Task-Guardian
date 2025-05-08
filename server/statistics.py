from flask import Blueprint, jsonify, request
from tables import get_db_connection
from datetime import date
from auth import token_required  # import token_required

statistics_blueprint = Blueprint("statistics", __name__)

@statistics_blueprint.route("/update_dashboard", methods=["POST"])
@token_required
def update_dashboard_stats(current_user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        today = date.today()
        # Calculate statistics filtering by user_id
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE user_id = %s", (current_user_id,))
        total_tasks = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE completed = TRUE AND user_id = %s", (current_user_id,))
        completed = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE completed = FALSE AND date = %s AND user_id = %s", (today, current_user_id))
        in_progress = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE completed = FALSE AND (date IS NULL OR date <> %s) AND user_id = %s", (today, current_user_id))
        pending = cursor.fetchone()[0]
        efficiency = round((completed / total_tasks) * 100) if total_tasks > 0 else 0

        cursor.execute("SELECT id FROM dashboard WHERE stat_date = %s AND user_id = %s", (today, current_user_id))
        record = cursor.fetchone()
        if record:
            cursor.execute("""
                UPDATE dashboard 
                SET total_tasks = %s,
                    completed_tasks = %s,
                    in_progress = %s,
                    pending = %s,
                    efficiency = %s
                WHERE stat_date = %s AND user_id = %s
            """, (total_tasks, completed, in_progress, pending, efficiency, today, current_user_id))
        else:
            cursor.execute("""
                INSERT INTO dashboard (stat_date, total_tasks, completed_tasks, in_progress, pending, efficiency, user_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (today, total_tasks, completed, in_progress, pending, efficiency, current_user_id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Dashboard updated successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@statistics_blueprint.route("/dashboard", methods=["GET"])
@token_required
def get_dashboard_stats(current_user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        today = date.today()

        cursor.execute("SELECT COUNT(*) FROM tasks WHERE user_id = %s", (current_user_id,))
        total_tasks = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE completed = TRUE AND user_id = %s", (current_user_id,))
        completed = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE completed = FALSE AND date > %s AND user_id = %s", (today, current_user_id))
        pending = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE completed = FALSE AND date = %s AND user_id = %s", (today, current_user_id))
        in_progress = cursor.fetchone()[0]

        if in_progress == 0 and total_tasks > 0:
            in_progress = total_tasks - completed - pending

        efficiency = round((completed / total_tasks) * 100) if total_tasks > 0 else 0

        stats = {
            "total_tasks": total_tasks,
            "completed": completed,
            "in_progress": in_progress,
            "pending": pending,
            "efficiency": efficiency
        }

        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Dashboard statistics retrieved successfully", "stats": stats}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@statistics_blueprint.route("/bar", methods=["GET"])
@token_required
def get_bar_stats(current_user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT EXTRACT(DOW FROM date) as day, COUNT(*) as total,
                   SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed
            FROM tasks
            WHERE date IS NOT NULL AND user_id = %s
            GROUP BY day
            ORDER BY day
        """, (current_user_id,))
        results = cursor.fetchall()
        day_map = {0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat"}
        efficiency_by_day = {name: 0 for name in day_map.values()}
        for row in results:
            day_num = int(row[0])
            total = row[1]
            completed = row[2]
            efficiency = round((completed / total) * 100) if total > 0 else 0
            day_name = day_map.get(day_num)
            efficiency_by_day[day_name] = efficiency
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Bar chart efficiency statistics retrieved successfully", "stats": efficiency_by_day}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
