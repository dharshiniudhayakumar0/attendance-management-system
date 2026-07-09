import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flasgger import Swagger

from config import config_by_name
from models import db
from routes import api

# ═══════════════════════════════════════════════════════════════════════════════
#  SWAGGER / FLASGGER — Template & Configuration
# ═══════════════════════════════════════════════════════════════════════════════

SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "Attendance Management System API",
        "description": (
            "REST APIs for Employee Attendance Management System.\n\n"
            "This API provides endpoints for managing employees, recording "
            "attendance, generating reports, and viewing dashboard statistics.\n\n"
            "**Authentication:** Most endpoints require a valid JWT Bearer token. "
            "Use the `/login` endpoint to obtain a token, then click the "
            "**Authorize** button above and enter: `Bearer <your_token>`"
        ),
        "version": "1.0",
        "contact": {
            "name": "Dharshini U",
            "email": "dharshini@example.com"
        },
        "license": {
            "name": "MIT",
            "url": "https://opensource.org/licenses/MIT"
        }
    },
    "host": "127.0.0.1:5000",
    "basePath": "/",
    "schemes": ["http", "https"],
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": (
                "JWT Authorization header using the Bearer scheme.\n\n"
                "Enter your token in the format: **Bearer &lt;JWT_TOKEN&gt;**\n\n"
                "Example: `Bearer eyJhbGciOiJIUzI1NiIs...`"
            )
        }
    },
    "security": [{"Bearer": []}],
    "tags": [
        {
            "name": "Authentication",
            "description": "User login, token generation, and token refresh endpoints"
        },
        {
            "name": "Users",
            "description": "User account management (admin only)"
        },
        {
            "name": "Employees",
            "description": "Employee CRUD operations and search"
        },
        {
            "name": "Attendance",
            "description": "Attendance marking, tracking, reports, and summaries"
        },
        {
            "name": "Dashboard",
            "description": "Dashboard statistics and analytics data"
        }
    ]
}

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/"
}


# ═══════════════════════════════════════════════════════════════════════════════
#  APPLICATION FACTORY
# ═══════════════════════════════════════════════════════════════════════════════

def create_app(config_name=None):
    """Application factory — creates and configures the Flask app."""

    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["default"]))

    # ── Initialise extensions ──────────────────────────────────────────────
    CORS(app, resources={r"/*": {"origins": "*"}})
    db.init_app(app)
    JWTManager(app)

    # Swagger UI — available at http://127.0.0.1:5000/apidocs/
    Swagger(app, template=SWAGGER_TEMPLATE, config=SWAGGER_CONFIG)

    # ── Register blueprints ────────────────────────────────────────────────
    app.register_blueprint(api)

    # ── Create tables if they don't exist ──────────────────────────────────
    with app.app_context():
        db.create_all()

    # ── Global error handlers ──────────────────────────────────────────────

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"success": False, "message": "Resource not found", "data": None}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({"success": False, "message": "Method not allowed", "data": None}), 405

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"success": False, "message": "Internal server error", "data": None}), 500

    # ══════════════════════════════════════════════════════════════════════════
    #  AUTHENTICATION ENDPOINTS (defined on the app, not the blueprint)
    # ══════════════════════════════════════════════════════════════════════════

    @app.route("/login", methods=["POST"])
    def root_login():
        """
        User Login
        Authenticate with username and password to receive JWT tokens.
        ---
        tags:
          - Authentication
        consumes:
          - application/json
        produces:
          - application/json
        parameters:
          - in: body
            name: body
            required: true
            description: Login credentials
            schema:
              type: object
              required:
                - username
                - password
              properties:
                username:
                  type: string
                  description: The user's username
                  example: admin
                password:
                  type: string
                  description: The user's password
                  example: admin123
        responses:
          200:
            description: Login successful — returns JWT access & refresh tokens
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: Login successful
                data:
                  type: object
                  properties:
                    access_token:
                      type: string
                      example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                    refresh_token:
                      type: string
                      example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                    user:
                      type: object
                      properties:
                        id:
                          type: integer
                          example: 0
                        username:
                          type: string
                          example: admin
                        role:
                          type: string
                          example: admin
          400:
            description: Missing username or password
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: Username and password are required
                data:
                  type: string
                  example: null
          401:
            description: Invalid credentials
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: Invalid username or password
                data:
                  type: string
                  example: null
          500:
            description: Internal server error
        """
        from flask import request
        from flask_jwt_extended import create_access_token, create_refresh_token
        from models import User
        try:
            data = request.get_json()
            if not data or "username" not in data or "password" not in data:
                return jsonify({"success": False, "message": "Username and password are required", "data": None}), 400

            username = data["username"].strip()
            password = data["password"].strip()

            user_data = None

            # Hardcoded admin check
            if username == "admin" and password == "admin123":
                user_data = {"id": 0, "username": "admin", "role": "admin"}

            # Database check
            if user_data is None:
                user = User.query.filter_by(username=username).first()
                if user and user.password == password:
                    user_data = {"id": user.id, "username": user.username, "role": user.role}

            if user_data is None:
                return jsonify({"success": False, "message": "Invalid username or password", "data": None}), 401

            # Issue JWT tokens
            access_token  = create_access_token(identity=str(user_data["id"]), additional_claims={"username": user_data["username"], "role": user_data["role"]})
            refresh_token = create_refresh_token(identity=str(user_data["id"]))

            return jsonify({
                "success": True,
                "message": "Login successful",
                "data": {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "user": user_data
                }
            }), 200
        except Exception as e:
            return jsonify({"success": False, "message": str(e), "data": None}), 500

    @app.route("/api/auth/refresh", methods=["POST"])
    def refresh_token():
        """
        Refresh JWT Access Token
        Use a valid refresh token to obtain a new access token.
        ---
        tags:
          - Authentication
        consumes:
          - application/json
        produces:
          - application/json
        security:
          - Bearer: []
        parameters:
          - in: header
            name: Authorization
            type: string
            required: true
            description: "Refresh token in format: Bearer <refresh_token>"
        responses:
          200:
            description: New access token issued successfully
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: Token refreshed
                data:
                  type: object
                  properties:
                    access_token:
                      type: string
                      example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
          401:
            description: Missing or invalid refresh token
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: Missing refresh token
                data:
                  type: string
                  example: null
        """
        from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, create_access_token
        # This endpoint uses the refresh token — handled manually
        from flask import request
        try:
            from flask_jwt_extended import decode_token
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return jsonify({"success": False, "message": "Missing refresh token", "data": None}), 401
            token = auth_header.split(" ")[1]
            decoded = decode_token(token)
            identity = decoded["sub"]
            new_token = create_access_token(identity=identity, additional_claims={"username": decoded.get("username",""), "role": decoded.get("role","employee")})
            return jsonify({"success": True, "message": "Token refreshed", "data": {"access_token": new_token}}), 200
        except Exception as e:
            return jsonify({"success": False, "message": str(e), "data": None}), 401

    return app


# ═══════════════════════════════════════════════════════════════════════════════
#  RUN THE APPLICATION
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
