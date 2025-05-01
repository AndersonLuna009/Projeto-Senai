import jwt
import datetime

SECRET_KEY = '090807060504030201'

def generate_token(user_id, is_admin=False, expires_in=3600):
    payload = {
        'user_id': user_id,
        'is_admin': is_admin,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=expires_in)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    return token

def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
