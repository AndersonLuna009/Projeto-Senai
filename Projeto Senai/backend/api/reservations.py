from flask import Blueprint, request, jsonify
from db import get_db

reservations_bp = Blueprint('reservations', __name__)

@reservations_bp.route('/reservations', methods=['GET'])
def get_reservations():
    user_id = request.args.get('user_id')
    room_id = request.args.get('room_id')
    date = request.args.get('date')
    
    db = get_db()
    cursor = db.cursor()
    
    query = "SELECT r.*, u.name as user_name, rm.name as room_name FROM reservations r "
    query += "JOIN users u ON r.user_id = u.id "
    query += "JOIN rooms rm ON r.room_id = rm.id "
    query += "WHERE r.status = 'active' "
    
    params = []
    if user_id:
        query += "AND r.user_id = ? "
        params.append(user_id)
    if room_id:
        query += "AND r.room_id = ? "
        params.append(room_id)
    if date:
        query += "AND r.date = ? "
        params.append(date)
    
    reservations = cursor.execute(query, params).fetchall()
    
    result = []
    for res in reservations:
        result.append({
            "id": res['id'],
            "user_id": res['user_id'],
            "user_name": res['user_name'],
            "room_id": res['room_id'],
            "room_name": res['room_name'],
            "title": res['title'],
            "description": res['description'],
            "date": res['date'],
            "start_time": res['start_time'],
            "duration": res['duration'],
            "status": res['status'],
            "created_at": res['created_at']
        })
    
    return jsonify(result)

@reservations_bp.route('/reservations', methods=['POST'])
def create_reservation():
    data = request.get_json()
    user_id = data.get('user_id')
    room_id = data.get('room_id')
    title = data.get('title')
    description = data.get('description', '')
    date = data.get('date')
    start_time = data.get('start_time')
    duration = data.get('duration')
    
    if not all([user_id, room_id, title, date, start_time, duration]):
        return jsonify({"error": "Campos obrigatórios faltando"}), 400
    
    db = get_db()
    cursor = db.cursor()

    query = """
    SELECT id FROM reservations 
    WHERE room_id = ? AND date = ? AND status = 'active' AND (
        (? BETWEEN start_time AND datetime(start_time, '+' || duration || ' hours')) OR
        (datetime(?, '+' || ? || ' hours') BETWEEN start_time AND datetime(start_time, '+' || duration || ' hours'))
    )
    """
    conflicts = cursor.execute(query, (room_id, date, start_time, start_time, duration)).fetchall()
    if conflicts:
        return jsonify({"error": "Horário já reservado"}), 409

    cursor.execute("""
    INSERT INTO reservations (user_id, room_id, title, description, date, start_time, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, room_id, title, description, date, start_time, duration))
    db.commit()

    new_reservation_id = cursor.lastrowid
    res = cursor.execute("""
    SELECT r.*, u.name as user_name, rm.name as room_name FROM reservations r 
    JOIN users u ON r.user_id = u.id 
    JOIN rooms rm ON r.room_id = rm.id 
    WHERE r.id = ?
    """, (new_reservation_id,)).fetchone()

    return jsonify({
        "success": True,
        "reservation": {
            "id": res['id'],
            "user_id": res['user_id'],
            "user_name": res['user_name'],
            "room_id": res['room_id'],
            "room_name": res['room_name'],
            "title": res['title'],
            "description": res['description'],
            "date": res['date'],
            "start_time": res['start_time'],
            "duration": res['duration'],
            "status": res['status'],
            "created_at": res['created_at']
        }
    })

@reservations_bp.route('/reservations/<int:reservation_id>', methods=['DELETE'])
def cancel_reservation(reservation_id):
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"error": "ID do usuário é obrigatório"}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    user = cursor.execute("SELECT is_admin FROM users WHERE id = ?", (user_id,)).fetchone()
    is_admin = bool(user['is_admin'])
    
    if not is_admin:
        reservation = cursor.execute("SELECT * FROM reservations WHERE id = ? AND user_id = ?", 
                                    (reservation_id, user_id)).fetchone()
        if not reservation:
            return jsonify({"error": "Reserva não encontrada ou não autorizado"}), 404
    
    cursor.execute("UPDATE reservations SET status = 'cancelled' WHERE id = ?", (reservation_id,))
    db.commit()
    
    return jsonify({"success": True})