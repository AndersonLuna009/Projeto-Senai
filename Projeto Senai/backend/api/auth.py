from flask import Blueprint, request, jsonify
from db import get_db
from jwt_utils import generate_token
import hashlib

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Email e senha são obrigatórios"}), 400
    
    db = get_db()
    cursor = db.cursor()
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    
    user = cursor.execute("SELECT * FROM users WHERE email = ? AND password = ?", 
                         (email, hashed_password)).fetchone()
    
    if user:
        return jsonify({
            "success": True,
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "is_admin": bool(user['is_admin'])
            }
        })
    else:
        return jsonify({"error": "Credenciais inválidas"}), 401

from flask import Blueprint, request, jsonify
from db import get_db
import hashlib
from jwt_utils import generate_token  # ✅ IMPORTANTE

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    db = get_db()
    cursor = db.cursor()
    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    user = cursor.execute("SELECT * FROM users WHERE email = ? AND password = ?", 
                         (email, hashed_password)).fetchone()

    if user:
        token = generate_token(user["id"], bool(user["is_admin"]))  # ✅ GERA O TOKEN
        return jsonify({
            "success": True,
            "token": token,  # ✅ RETORNA O TOKEN
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "is_admin": bool(user['is_admin'])
            }
        })
    else:
        return jsonify({"error": "Credenciais inválidas"}), 401
