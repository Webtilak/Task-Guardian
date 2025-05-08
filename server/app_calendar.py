from flask import Blueprint, jsonify, request
from tables import get_db_connection
from auth import token_required  # import token_required decorator

calendar_blueprint = Blueprint("calendar", __name__)

@calendar_blueprint.route("/events", methods=["GET"])
@token_required
def get_calendar_events(current_user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Only fetch events for the logged-in user
        cursor.execute("""
            SELECT id, name, notes, date, time, repeat_frequency, repeat_interval, end_repeat
            FROM tasks
            WHERE user_id = %s
        """, (current_user_id,))
        tasks = cursor.fetchall()
        events = []
        for task in tasks:
            task_id, name, notes, task_date, task_time, frequency, interval, end_date = task
            start = f"{task_date}T{task_time}" if task_time else str(task_date)
            events.append({
                "id": task_id,
                "title": name,
                "start": start,
                "extendedProps": {
                    "description": notes if notes else ""
                }
            })
            # Generate recurring events if scheduling exists
            if frequency != "none" and end_date:
                from datetime import datetime, timedelta
                start_date = datetime.strptime(str(task_date), "%Y-%m-%d")
                end_repeat = datetime.strptime(str(end_date), "%Y-%m-%d")
                current_date = start_date
                while current_date <= end_repeat:
                    current_date += timedelta(days=interval if frequency == "daily" else
                                              7 * interval if frequency == "weekly" else
                                              30 * interval if frequency == "monthly" else
                                              365 * interval)
                    if current_date <= end_repeat:
                        events.append({
                            "id": f"{task_id}-{current_date}",
                            "title": name,
                            "start": current_date.strftime("%Y-%m-%dT") + (task_time if task_time else ""),
                            "extendedProps": {
                                "description": notes if notes else ""
                            }
                        })
        cursor.close()
        conn.close()
        return jsonify(events), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
