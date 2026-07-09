import re

with open('routes.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('from sqlalchemy import func', 'from sqlalchemy import func\nfrom flask_jwt_extended import jwt_required, get_jwt\nfrom functools import wraps')

def role_required(*roles):
    text = text # dummy line
    
role_decorator = '''
def role_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") not in roles and "admin" not in roles:
                if claims.get("role") != "admin":
                    return jsonify({"success": False, "message": "Insufficient permissions", "data": None}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
'''

text = text.replace('#  USERS ROUTES', role_decorator + '\n#  USERS ROUTES')

# Add @jwt_required() to all routes EXCEPT /users/login
text = re.sub(r'(@api\.route\(\"(?!/users/login).*?\", methods=\[.*?\]\))', r'\1\n@jwt_required()', text)

# For role based:
# /users (GET, POST, PUT, DELETE) -> admin only
text = re.sub(r'(@api\.route\(\"/users.*?\", methods=\[.*?\]\)\n@jwt_required\(\))', r'\1\n@role_required("admin")', text)

with open('routes.py', 'w', encoding='utf-8') as f:
    f.write(text)
