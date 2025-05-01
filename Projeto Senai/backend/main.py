from flask import Flask
from flask_cors import CORS
from api.auth import auth_bp
from api.rooms import rooms_bp
from api.reservations import reservations_bp
from api.notifications import notifications_bp
from api.users import users_bp
from init_db import init_db

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(rooms_bp, url_prefix='/api')
app.register_blueprint(reservations_bp, url_prefix='/api')
app.register_blueprint(notifications_bp, url_prefix='/api')
app.register_blueprint(users_bp, url_prefix='/api')

if __name__ == '__main__':
    with app.app_context():
        init_db()
    app.run(debug=True)