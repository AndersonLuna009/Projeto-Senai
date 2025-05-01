from flask import Blueprint, jsonify
from db import get_db

users_bp = Blueprint('users', __name__)

@users_bp.route('/users', methods=['GET'])
def get_users():
    db = get_db()
    cursor = db.cursor()
    
    users = cursor.execute("SELECT id, name, email, is_admin FROM users").fetchall()
    
    result = []
    for user in users:
        result.append({
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "is_admin": bool(user['is_admin'])
        })
    
    return jsonify(result)