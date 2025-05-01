from flask import Blueprint, request, jsonify
from db import get_db
import json

rooms_bp = Blueprint('rooms', __name__)

@rooms_bp.route('/rooms', methods=['GET'])
def get_rooms():
    db = get_db()
    cursor = db.cursor()
    rooms = cursor.execute("SELECT * FROM rooms WHERE is_active = TRUE").fetchall()
    
    result = []
    for room in rooms:
        result.append({
            "id": room['id'],
            "name": room['name'],
            "capacity": room['capacity'],
            "features": json.loads(room['features'])
        })
    
    return jsonify(result)

@rooms_bp.route('/rooms', methods=['POST'])
def add_room():
    data = request.get_json()
    name = data.get('name')
    capacity = data.get('capacity')
    features = data.get('features')
    
    if not name or not capacity:
        return jsonify({"error": "Nome e capacidade são obrigatórios"}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute("INSERT INTO rooms (name, capacity, features) VALUES (?, ?, ?)",
                  (name, capacity, json.dumps(features)))
    db.commit()
    
    new_room_id = cursor.lastrowid
    room = cursor.execute("SELECT * FROM rooms WHERE id = ?", (new_room_id,)).fetchone()
    
    return jsonify({
        "success": True,
        "room": {
            "id": room['id'],
            "name": room['name'],
            "capacity": room['capacity'],
            "features": json.loads(room['features'])
        }
    })

@rooms_bp.route('/rooms/<int:room_id>', methods=['DELETE'])
def delete_room(room_id):
    db = get_db()
    cursor = db.cursor()

    room = cursor.execute("SELECT * FROM rooms WHERE id = ?", (room_id,)).fetchone()
    if not room:
        return jsonify({"error": "Sala não encontrada"}), 404

    cursor.execute("DELETE FROM rooms WHERE id = ?", (room_id,))
    db.commit()

    return jsonify({"success": True})