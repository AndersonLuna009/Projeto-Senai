import sqlite3
from flask import g

DATABASE = 'reservas_salas.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

def close_db(e=None):
    db = g.pop('_database', None)
    if db is not None:
        db.close()