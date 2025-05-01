import json
import hashlib
from db import get_db

def init_db():
    db = get_db()
    cursor = db.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        features TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
    )''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        duration INTEGER NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (room_id) REFERENCES rooms (id)
    )''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )''')

    admin_password = hashlib.sha256("admin123".encode()).hexdigest()
    cursor.execute("INSERT OR IGNORE INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)",
                  ("Administrador", "admin@example.com", admin_password, True))

    db.commit()