from flask import Blueprint, request, jsonify
from db import get_db

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/notifications', methods=['GET'])
def get_notifications():
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"error": "ID do usuário é obrigatório"}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    notifications = cursor.execute("""
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC
    """, (user_id,)).fetchall()
    
    result = []
    for notif in notifications:
        result.append({
            "id": notif['id'],
            "message": notif['message'],
            "is_read": bool(notif['is_read']),
            "created_at": notif['created_at']
        })
    
    return jsonify(result)

@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
def mark_notification_read(notification_id):
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"error": "ID do usuário é obrigatório"}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute("UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?", 
                  (notification_id, user_id))
    db.commit()
    
    return jsonify({"success": True})