from datetime import datetime, date
from flask import Blueprint, jsonify, request
from models import db, User, Employee, Attendance
from sqlalchemy import func
from flask_jwt_extended import jwt_required, get_jwt, create_access_token, create_refresh_token
from functools import wraps

api = Blueprint("api", __name__, url_prefix="/api")


# ═══════════════════════════════════════════════════════════════════════════
#  HELPER — standard JSON responses
# ═══════════════════════════════════════════════════════════════════════════

def success_response(data, message="Success", status_code=200):
    return jsonify({"success": True, "message": message, "data": data}), status_code


def error_response(message="An error occurred", status_code=400):
    return jsonify({"success": False, "message": message, "data": None}), status_code


# ═══════════════════════════════════════════════════════════════════════════

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

# ═══════════════════════════════════════════════════════════════════════════
#  USERS ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@api.route("/users", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_users():
    """
    Get all users
    Retrieve a list of all registered users. Admin access only.
    ---
    tags:
      - Users
    security:
      - Bearer: []
    produces:
      - application/json
    responses:
      200:
        description: List of all users retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Success
            data:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                    example: 1
                  username:
                    type: string
                    example: john_doe
                  role:
                    type: string
                    example: employee
                  created_at:
                    type: string
                    example: "2025-01-15T10:30:00"
      401:
        description: Unauthorized — missing or invalid JWT token
      403:
        description: Forbidden — insufficient permissions
      500:
        description: Internal server error
    """
    try:
        users = User.query.order_by(User.username).all()
        return success_response([u.to_dict() for u in users])
    except Exception as e:
        return error_response(str(e), 500)


@api.route("/users/<int:user_id>", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_user(user_id):
    """
    Get a user by ID
    Retrieve details of a specific user by their unique ID. Admin access only.
    ---
    tags:
      - Users
    security:
      - Bearer: []
    produces:
      - application/json
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
        description: Unique identifier of the user
    responses:
      200:
        description: User found
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Success
            data:
              type: object
              properties:
                id:
                  type: integer
                  example: 1
                username:
                  type: string
                  example: john_doe
                role:
                  type: string
                  example: employee
                created_at:
                  type: string
                  example: "2025-01-15T10:30:00"
      401:
        description: Unauthorized — missing or invalid JWT token
      403:
        description: Forbidden — insufficient permissions
      404:
        description: User not found
      500:
        description: Internal server error
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return error_response("User not found", 404)
        return success_response(user.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@api.route("/users", methods=["POST"])
@jwt_required()
@role_required("admin")
def create_user():
    """
    Create a new user
    Register a new user account. Admin access only.
    ---
    tags:
      - Users
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        description: User registration data
        schema:
          type: object
          required:
            - username
            - password
          properties:
            username:
              type: string
              description: Unique username
              example: john_doe
            password:
              type: string
              description: User password
              example: securePass123
            role:
              type: string
              description: User role
              enum: [admin, hr, employee]
              example: employee
    responses:
      201:
        description: User created successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: User created successfully
            data:
              type: object
              properties:
                id:
                  type: integer
                  example: 5
                username:
                  type: string
                  example: john_doe
                role:
                  type: string
                  example: employee
                created_at:
                  type: string
                  example: "2025-01-15T10:30:00"
      400:
        description: Validation error — missing required fields
      401:
        description: Unauthorized — missing or invalid JWT token
      403:
        description: Forbidden — insufficient permissions
      409:
        description: Username already exists
      500:
        description: Internal server error
    """
    try:
        data = request.get_json()
        if not data:
            return error_response("Request body is required")

        required = ["username", "password"]
        for field in required:
            if field not in data or not str(data[field]).strip():
                return error_response(f"'{field}' is required")

        if User.query.filter_by(username=data["username"].strip()).first():
            return error_response("Username already exists", 409)

        role = data.get("role", "employee").strip()
        if role not in ("admin", "hr", "employee"):
            return error_response("Role must be 'admin', 'hr', or 'employee'")

        user = User(
            username=data["username"].strip(),
            password=data["password"].strip(),
            role=role
        )
        db.session.add(user)
        db.session.commit()
        return success_response(user.to_dict(), "User created successfully", 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@api.route("/users/<int:user_id>", methods=["PUT"])
@jwt_required()
@role_required("admin")
def update_user(user_id):
    """
    Update a user
    Modify an existing user's details. Admin access only.
    ---
    tags:
      - Users
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
        description: Unique identifier of the user to update
      - in: body
        name: body
        required: true
        description: Fields to update
        schema:
          type: object
          properties:
            username:
              type: string
              description: New username
              example: john_doe_updated
            password:
              type: string
              description: New password
              example: newSecurePass456
            role:
              type: string
              description: New role
              enum: [admin, hr, employee]
              example: hr
    responses:
      200:
        description: User updated successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: User updated successfully
            data:
              type: object
              properties:
                id:
                  type: integer
                  example: 1
                username:
                  type: string
                  example: john_doe_updated
                role:
                  type: string
                  example: hr
                created_at:
                  type: string
                  example: "2025-01-15T10:30:00"
      401:
        description: Unauthorized — missing or invalid JWT token
      403:
        description: Forbidden — insufficient permissions
      404:
        description: User not found
      409:
        description: Username already exists
      500:
        description: Internal server error
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return error_response("User not found", 404)

        data = request.get_json()
        if not data:
            return error_response("Request body is required")

        if "username" in data and data["username"].strip() != user.username:
            if User.query.filter_by(username=data["username"].strip()).first():
                return error_response("Username already exists", 409)
            user.username = data["username"].strip()

        if "password" in data and data["password"].strip():
            user.password = data["password"].strip()

        if "role" in data:
            role = data["role"].strip()
            if role not in ("admin", "hr", "employee"):
                return error_response("Role must be 'admin', 'hr', or 'employee'")
            user.role = role

        db.session.commit()
        return success_response(user.to_dict(), "User updated successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@api.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def delete_user(user_id):
    """
    Delete a user
    Permanently remove a user account. Admin access only.
    ---
    tags:
      - Users
    security:
      - Bearer: []
    produces:
      - application/json
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
        description: Unique identifier of the user to delete
    responses:
      200:
        description: User deleted successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: User deleted successfully
            data:
              type: string
              example: null
      401:
        description: Unauthorized — missing or invalid JWT token
      403:
        description: Forbidden — insufficient permissions
      404:
        description: User not found
      500:
        description: Internal server error
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return error_response("User not found", 404)
        db.session.delete(user)
        db.session.commit()
        return success_response(None, "User deleted successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@api.route("/users/login", methods=["POST"])
def login_user():
    """
    Authenticate user (API route version)
    Alternative login endpoint under /api/users/login.
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
              description: Username
              example: admin
            password:
              type: string
              description: Password
              example: admin123
    responses:
      200:
        description: Login successful — returns JWT tokens and user info
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
                      example: 1
                    username:
                      type: string
                      example: admin
                    role:
                      type: string
                      example: admin
      400:
        description: Missing required fields
      401:
        description: Invalid credentials
      500:
        description: Internal server error
    """
    try:
        data = request.get_json()
        if not data or "username" not in data or "password" not in data:
            return error_response("Username and password are required")

        user = User.query.filter_by(username=data["username"].strip()).first()
        if not user or user.password != data["password"].strip():
            return error_response("Invalid username or password", 401)

        access_token = create_access_token(identity=user.username, additional_claims={"role": user.role})
        refresh_token = create_refresh_token(identity=user.username, additional_claims={"role": user.role})

        return success_response({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_dict()
        }, "Login successful")
    except Exception as e:
        return error_response(str(e), 500)


# ═══════════════════════════════════════════════════════════════════════════
#  EMPLOYEES ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@api.route("/employees", methods=["GET"])
@jwt_required()
def get_employees():
    """
    Get all employees
    Retrieve a list of all employees with optional search/filter.
    ---
    tags:
      - Employees
    security:
      - Bearer: []
    produces:
      - application/json
    parameters:
      - name: search
        in: query
        type: string
        required: false
        description: Search by employee name, email, or designation
        example: John
      - name: department
        in: query
        type: string
        required: false
        description: Filter by department name
        example: Engineering
      - name: status
        in: query
        type: string
        required: false
        description: Filter by employee status
        enum: [Active, Inactive]
        example: Active
    responses:
      200:
        description: List of employees retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Success
            data:
              type: array
              items:
                type: object
                properties:
                  employee_id:
                    type: integer
                    example: 1
                  employee_name:
                    type: string
                    example: John Smith
                  email:
                    type: string
                    example: john.smith@company.com
                  mobile:
                    type: string
                    example: "9876543210"
                  department:
                    type: string
                    example: Engineering
                  designation:
                    type: string
                    example: Software Engineer
                  status:
                    type: string
                    example: Active
                  created_at:
                    type: string
                    example: "2025-01-15T10:30:00"
      401:
        description: Unauthorized — missing or invalid JWT token
      500:
        description: Internal server error
    """
    try:
        search     = request.args.get("search", "").strip()

        query = Employee.query
        if search:
            query = query.filter(
                db.or_(
                    Employee.employee_name.ilike(f"%{search}%"),
                    Employee.email.ilike(f"%{search}%"),
                    Employee.designation.ilike(f"%{search}%")
                )
            )

        employees = query.order_by(Employee.employee_name).all()
        return success_response([emp.to_dict() for emp in employees])
    except Exception as e:
        return error_response(str(e), 500)


@api.route("/employees/departments", methods=["GET"])
@jwt_required()
def get_departments():
    """
    Get unique department names
    Retrieve a list of all unique department names from the employees table.
    ---
    tags:
      - Employees
    security:
      - Bearer: []
    produces:
      - application/json
    responses:
      200:
        description: List of unique department names
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Success
            data:
              type: array
              items:
                type: string
              example: ["Engineering", "HR", "Marketing", "Finance"]
      401:
        description: Unauthorized — missing or invalid JWT token
      500:
        description: Internal server error
    """
    try:
        depts = db.session.query(Employee.department).distinct().order_by(Employee.department).all()
        return success_response([d[0] for d in depts])
    except Exception as e:
        return error_response(str(e), 500)


@api.route("/employees/<int:employee_id>", methods=["GET"])
@jwt_required()
def get_employee(employee_id):
    """
    Get a single employee by ID
    Retrieve detailed information for a specific employee.
    ---
    tags:
      - Employees
    security:
      - Bearer: []
    produces:
      - application/json
    parameters:
      - name: employee_id
        in: path
        type: integer
        required: true
        description: Unique identifier of the employee
    responses:
      200:
        description: Employee found
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Success
            data:
              type: object
              properties:
                employee_id:
                  type: integer
                  example: 1
                employee_name:
                  type: string
                  example: John Smith
                email:
                  type: string
                  example: john.smith@company.com
                mobile:
                  type: string
                  example: "9876543210"
                department:
                  type: string
                  example: Engineering
                designation:
                  type: string
                  example: Software Engineer
                status:
                  type: string
                  example: Active
                created_at:
                  type: string
                  example: "2025-01-15T10:30:00"
      401:
        description: Unauthorized — missing or invalid JWT token
      404:
        description: Employee not found
      500:
        description: Internal server error
    """
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return error_response("Employee not found", 404)
        return success_response(employee.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@api.route("/employees/<int:employee_id>/attendance-history", methods=["GET"])
@jwt_required()
def get_employee_attendance_history(employee_id):
    """
    Get employee attendance history
    Retrieve the full attendance history for a specific employee, including summary statistics.
    ---
    tags:
      - Employees
    security:
      - Bearer: []
    produces:
      - application/json
    parameters:
      - name: employee_id
        in: path
        type: integer
        required: true
        description: Unique identifier of the employee
    responses:
      200:
        description: Attendance history with summary statistics
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Success
            data:
              type: object
              properties:
                employee:
                  type: object
                  description: Employee details
                summary:
                  type: object
                  properties:
                    total:
                      type: integer
                      example: 30
                    present:
                      type: integer
                      example: 22
                    late:
                      type: integer
                      example: 3
                    half_day:
                      type: integer
                      example: 1
                    absent:
                      type: integer
                      example: 2
                    on_leave:
                      type: integer
                      example: 2
                records:
                  type: array
                  items:
                    type: object
                    properties:
                      attendance_id:
                        type: integer
                      employee_id:
                        type: integer
                      attendance_date:
                        type: string
                        example: "2025-01-15"
                      attendance_status:
                        type: string
                        example: Present
                      check_in_time:
                        type: string
                        example: "09:00:00"
                      check_out_time:
                        type: string
                        example: "18:00:00"
      401:
        description: Unauthorized — missing or invalid JWT token
      404:
        description: Employee not found
      500:
        description: Internal server error
    """
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return error_response("Employee not found", 404)

        records = Attendance.query.filter_by(employee_id=employee_id).order_by(Attendance.attendance_date.desc()).all()

        total    = len(records)
        present  = sum(1 for r in records if r.attendance_status == "Present")
        late     = sum(1 for r in records if r.attendance_status == "Late")
        half_day = sum(1 for r in records if r.attendance_status == "Half Day")
        absent   = sum(1 for r in records if r.attendance_status == "Absent")
        on_leave = sum(1 for r in records if r.attendance_status == "On Leave")

        return success_response({
            "employee": employee.to_dict(),
            "summary": {
                "total": total, "present": present, "late": late,
                "half_day": half_day, "absent": absent, "on_leave": on_leave
            },
            "records": [r.to_dict() for r in records]
        })
    except Exception as e:
        return error_response(str(e), 500)


@api.route("/employees", methods=["POST"])
@jwt_required()
def create_employee():
    """
    Create a new employee
    Add a new employee record to the system.
    ---
    tags:
      - Employees
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        description: Employee data
        schema:
          type: object
          required:
            - employee_name
            - email
            - mobile
            - department
            - designation
          properties:
            employee_name:
              type: string
              description: Full name of the employee
              example: John Smith
            email:
              type: string
              description: Unique email address
              example: john.smith@company.com
            mobile:
              type: string
              description: Mobile phone number
              example: "9876543210"
            department:
              type: string
              description: Department name
              example: Engineering
            designation:
              type: string
              description: Job title / designation
              example: Software Engineer
            status:
              type: string
              description: Employee status
              enum: [Active, Inactive]
              example: Active
    responses:
      201:
        description: Employee created successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Employee created successfully
            data:
              type: object
              properties:
                employee_id:
                  type: integer
                  example: 10
                employee_name:
                  type: string
                  example: John Smith
                email:
                  type: string
                  example: john.smith@company.com
                mobile:
                  type: string
                  example: "9876543210"
                department:
                  type: string
                  example: Engineering
                designation:
                  type: string
                  example: Software Engineer
                status:
                  type: string
                  example: Active
                created_at:
                  type: string
                  example: "2025-01-15T10:30:00"
      400:
        description: Validation error — missing required fields
      401:
        description: Unauthorized — missing or invalid JWT token
      409:
        description: Email already exists
      500:
        description: Internal server error
    """
    try:
        data = request.get_json()
        if not data:
            return error_response("Request body is required")

        required = ["employee_name", "email", "mobile", "department", "designation"]
        for field in required:
            if field not in data or not str(data[field]).strip():
                return error_response(f"'{field}' is required")

        if Employee.query.filter_by(email=data["email"].strip()).first():
            return error_response("Email already exists", 409)

        status = data.get("status", "Active").strip()
        if status not in ("Active", "Inactive"):
            return error_response("Status must be 'Active' or 'Inactive'")

        employee = Employee(
            employee_name=data["employee_name"].strip(),
            email=data["email"].strip(),
            mobile=data["mobile"].strip(),
            department=data["department"].strip(),
            designation=data["designation"].strip(),
            status=status
        )
        db.session.add(employee)
        db.session.commit()
        return success_response(employee.to_dict(), "Employee created successfully", 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@api.route("/employees/<int:employee_id>", methods=["PUT"])
@jwt_required()
def update_employee(employee_id):
    """
    Update an employee
    Modify an existing employee's details.
    ---
    tags:
      - Employees
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - name: employee_id
        in: path
        type: integer
        required: true
        description: Unique identifier of the employee to update
      - in: body
        name: body
        required: true
        description: Fields to update (all fields optional)
        schema:
          type: object
          properties:
            employee_name:
              type: string
              description: Updated full name
              example: John D. Smith
            email:
              type: string
              description: Updated email address
              example: john.d.smith@company.com
            mobile:
              type: string
              description: Updated mobile number
              example: "9876543211"
            department:
              type: string
              description: Updated department
              example: Product
            designation:
              type: string
              description: Updated designation
              example: Senior Engineer
            status:
              type: string
              description: Updated status
              enum: [Active, Inactive]
              example: Active
    responses:
      200:
        description: Employee updated successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Employee updated successfully
            data:
              type: object
              properties:
                employee_id:
                  type: integer
                  example: 1
                employee_name:
                  type: string
                  example: John D. Smith
                email:
                  type: string
                  example: john.d.smith@company.com
                status:
                  type: string
                  example: Active
      401:
        description: Unauthorized — missing or invalid JWT token
      404:
        description: Employee not found
      409:
        description: Email already exists
      500:
        description: Internal server error
    """
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return error_response("Employee not found", 404)

        data = request.get_json()
        if not data:
            return error_response("Request body is required")

        if "email" in data and data["email"].strip() != employee.email:
            if Employee.query.filter_by(email=data["email"].strip()).first():
                return error_response("Email already exists", 409)
            employee.email = data["email"].strip()

        employee.employee_name = data.get("employee_name", employee.employee_name).strip()
        employee.mobile        = data.get("mobile", employee.mobile).strip()
        employee.department    = data.get("department", employee.department).strip()
        employee.designation   = data.get("designation", employee.designation).strip()

        if "status" in data:
            status = data["status"].strip()
            if status not in ("Active", "Inactive"):
                return error_response("Status must be 'Active' or 'Inactive'")
            employee.status = status

        db.session.commit()
        return success_response(employee.to_dict(), "Employee updated successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@api.route("/employees/<int:employee_id>", methods=["DELETE"])
@jwt_required()
def delete_employee(employee_id):
    """
    Delete an employee
    Permanently remove an employee and all associated attendance records.
    ---
    tags:
      - Employees
    security:
      - Bearer: []
    produces:
      - application/json
    parameters:
      - name: employee_id
        in: path
        type: integer
        required: true
        description: Unique identifier of the employee to delete
    responses:
      200:
        description: Employee deleted successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Employee deleted successfully
            data:
              type: string
              example: null
      401:
        description: Unauthorized — missing or invalid JWT token
      404:
        description: Employee not found
      500:
        description: Internal server error
    """
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return error_response("Employee not found", 404)
        db.session.delete(employee)
        db.session.commit()
        return success_response(None, "Employee deleted successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# ═══════════════════════════════════════════════════════════════════════════
#  ATTENDANCE ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@api.route("/attendance", methods=["GET"])
@jwt_required()
def get_attendance():
    """
    Get attendance records
    Retrieve attendance records with optional filters by employee, date, status, department, or search.
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    produces:
      - application/json
    parameters:
      - name: employee_id
        in: query
        type: integer
        required: false
        description: Filter by employee ID
      - name: date
        in: query
        type: string
        required: false
        description: "Filter by date (Format: YYYY-MM-DD)"
        example: "2025-01-15"
      - name: status
        in: query
        type: string
        required: false
        description: Filter by attendance status
        enum: [Present, Absent, Late, Half Day, On Leave]
      - name: department
        in: query
        type: string
        required: false
        description: Filter by department name
      - name: search
        in: query
        type: string
        required: false
        description: Search by employee name
    responses:
      200:
        description: List of attendance records
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Success
            data:
              type: array
              items:
                type: object
                properties:
                  attendance_id:
                    type: integer
                    example: 1
                  employee_id:
                    type: integer
                    example: 5
                  employee_name:
                    type: string
                    example: John Smith
                  department:
                    type: string
                    example: Engineering
                  attendance_date:
                    type: string
                    example: "2025-01-15"
                  check_in_time:
                    type: string
                    example: "09:00:00"
                  check_out_time:
                    type: string
                    example: "18:00:00"
                  attendance_status:
                    type: string
                    example: Present
                  created_at:
                    type: string
                    example: "2025-01-15T09:00:00"
      400:
        description: Invalid date format
      401:
        description: Unauthorized — missing or invalid JWT token
      500:
        description: Internal server error
    """
    try:
        query = Attendance.query.join(Employee)

        employee_id     = request.args.get("employee_id", type=int)
        attendance_date = request.args.get("date")
        status          = request.args.get("status")
        search          = request.args.get("search", "").strip()

        if employee_id:
            query = query.filter(Attendance.employee_id == employee_id)
        if attendance_date:
            query = query.filter(Attendance.attendance_date == datetime.strptime(attendance_date, "%Y-%m-%d").date())
        if status:
            query = query.filter(Attendance.attendance_status == status)
        if search:
            query = query.filter(Employee.employee_name.ilike(f"%{search}%"))

        records = query.order_by(Attendance.attendance_date.desc(), Employee.employee_name).all()
        return success_response([r.to_dict() for r in records])
    except ValueError:
        return error_response("Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        return error_response(str(e), 500)


@api.route("/attendance/employee-summary", methods=["GET"])
@jwt_required()
def attendance_employee_summary():
    """
    Per-employee attendance summary
    Get attendance summary with percentage for each employee.
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    produces:
      - application/json
    parameters:
      - name: department
        in: query
        type: string
        required: false
        description: Filter by department
      - name: search
        in: query
        type: string
        required: false
        description: Search by employee name
      - name: min_percentage
        in: query
        type: number
        required: false
        description: Minimum attendance percentage filter
      - name: max_percentage
        in: query
        type: number
        required: false
        description: Maximum attendance percentage filter
    responses:
      200:
        description: Employee attendance summaries
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Success
            data:
              type: array
              items:
                type: object
                properties:
                  employee_id:
                    type: integer
                    example: 1
                  employee_name:
                    type: string
                    example: John Smith
                  department:
                    type: string
                    example: Engineering
                  designation:
                    type: string
                    example: Software Engineer
                  status:
                    type: string
                    example: Active
                  total_records:
                    type: integer
                    example: 30
                  present:
                    type: integer
                    example: 22
                  late:
                    type: integer
                    example: 3
                  half_day:
                    type: integer
                    example: 1
                  absent:
                    type: integer
                    example: 2
                  on_leave:
                    type: integer
                    example: 2
                  attendance_percentage:
                    type: number
                    example: 91.07
      401:
        description: Unauthorized — missing or invalid JWT token
      500:
        description: Internal server error
    """
    try:
        search      = request.args.get("search", "").strip()

        emp_query = Employee.query
        if search:
            emp_query = emp_query.filter(Employee.employee_name.ilike(f"%{search}%"))

        employees = emp_query.order_by(Employee.employee_name).all()

        summary = []
        for emp in employees:
            records  = Attendance.query.filter_by(employee_id=emp.employee_id).all()
            total    = len(records)
            present  = sum(1 for r in records if r.attendance_status == "Present")
            late     = sum(1 for r in records if r.attendance_status == "Late")
            half_day = sum(1 for r in records if r.attendance_status == "Half Day")
            absent   = sum(1 for r in records if r.attendance_status == "Absent")
            on_leave = sum(1 for r in records if r.attendance_status == "On Leave")

            present_weight = present + late + (half_day * 0.5)
            denominator    = total - on_leave
            attendance_percentage = round((present_weight / denominator * 100), 2) if denominator > 0 else 0

            summary.append({
                "employee_id": emp.employee_id,
                "employee_name": emp.employee_name,
                "department": emp.department,
                "designation": emp.designation,
                "status": emp.status,
                "total_records": total,
                "present": present,
                "late": late,
                "half_day": half_day,
                "absent": absent,
                "on_leave": on_leave,
                "attendance_percentage": attendance_percentage
            })

        return success_response(summary)
    except Exception as e:
        return error_response(str(e), 500)


@api.route("/attendance/<int:attendance_id>", methods=["GET"])
@jwt_required()
def get_attendance_record(attendance_id):
    """
    Get a single attendance record
    Retrieve details of a specific attendance record by its ID.
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    produces:
      - application/json
    parameters:
      - name: attendance_id
        in: path
        type: integer
        required: true
        description: Unique identifier of the attendance record
    responses:
      200:
        description: Attendance record found
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Success
            data:
              type: object
              properties:
                attendance_id:
                  type: integer
                  example: 1
                employee_id:
                  type: integer
                  example: 5
                employee_name:
                  type: string
                  example: John Smith
                department:
                  type: string
                  example: Engineering
                attendance_date:
                  type: string
                  example: "2025-01-15"
                check_in_time:
                  type: string
                  example: "09:00:00"
                check_out_time:
                  type: string
                  example: "18:00:00"
                attendance_status:
                  type: string
                  example: Present
                created_at:
                  type: string
                  example: "2025-01-15T09:00:00"
      401:
        description: Unauthorized — missing or invalid JWT token
      404:
        description: Attendance record not found
      500:
        description: Internal server error
    """
    try:
        record = Attendance.query.get(attendance_id)
        if not record:
            return error_response("Attendance record not found", 404)
        return success_response(record.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@api.route("/attendance", methods=["POST"])
@jwt_required()
def mark_attendance():
    """
    Mark attendance for an employee
    Create a new attendance record. Cannot mark attendance for future dates or duplicate dates.
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        description: Attendance data
        schema:
          type: object
          required:
            - employee_id
            - attendance_date
            - attendance_status
          properties:
            employee_id:
              type: integer
              description: ID of the employee
              example: 5
            attendance_date:
              type: string
              description: "Date of attendance (Format: YYYY-MM-DD). Cannot be a future date."
              example: "2025-01-15"
            attendance_status:
              type: string
              description: Attendance status
              enum: [Present, Absent, Late, Half Day, On Leave]
              example: Present
            check_in_time:
              type: string
              description: "Check-in time (Format: HH:MM:SS)"
              example: "09:00:00"
            check_out_time:
              type: string
              description: "Check-out time (Format: HH:MM:SS)"
              example: "18:00:00"
    responses:
      201:
        description: Attendance marked successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Attendance marked successfully
            data:
              type: object
              properties:
                attendance_id:
                  type: integer
                  example: 15
                employee_id:
                  type: integer
                  example: 5
                employee_name:
                  type: string
                  example: John Smith
                attendance_date:
                  type: string
                  example: "2025-01-15"
                attendance_status:
                  type: string
                  example: Present
                check_in_time:
                  type: string
                  example: "09:00:00"
                check_out_time:
                  type: string
                  example: "18:00:00"
      400:
        description: Validation error — missing fields, future date, or invalid format
      401:
        description: Unauthorized — missing or invalid JWT token
      404:
        description: Employee not found
      409:
        description: Attendance already marked for this employee on this date
      500:
        description: Internal server error
    """
    try:
        data = request.get_json()
        if not data:
            return error_response("Request body is required")

        required = ["employee_id", "attendance_date", "attendance_status"]
        for field in required:
            if field not in data:
                return error_response(f"'{field}' is required")

        valid_statuses = ("Present", "Absent", "Late", "Half Day", "On Leave")
        if data["attendance_status"] not in valid_statuses:
            return error_response(f"Status must be one of {valid_statuses}")

        if not Employee.query.get(data["employee_id"]):
            return error_response("Employee not found", 404)

        rec_date = datetime.strptime(data["attendance_date"], "%Y-%m-%d").date()
        if rec_date > date.today():
            return error_response("Cannot mark attendance for a future date", 400)


        existing = Attendance.query.filter_by(
            employee_id=data["employee_id"],
            attendance_date=rec_date
        ).first()
        if existing:
            return error_response("Attendance already marked for this employee on this date", 409)

        in_time  = None
        out_time = None
        if data.get("check_in_time"):
            in_time  = datetime.strptime(data["check_in_time"],  "%H:%M:%S").time()
        if data.get("check_out_time"):
            out_time = datetime.strptime(data["check_out_time"], "%H:%M:%S").time()

        record = Attendance(
            employee_id=data["employee_id"],
            attendance_date=rec_date,
            check_in_time=in_time,
            check_out_time=out_time,
            attendance_status=data["attendance_status"]
        )
        db.session.add(record)
        db.session.commit()
        return success_response(record.to_dict(), "Attendance marked successfully", 201)
    except ValueError as ve:
        return error_response(f"Invalid format: {str(ve)}")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@api.route("/attendance/<int:attendance_id>", methods=["PUT"])
@jwt_required()
def update_attendance(attendance_id):
    """
    Update an attendance record
    Modify an existing attendance record. Cannot update to a future date.
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - name: attendance_id
        in: path
        type: integer
        required: true
        description: Unique identifier of the attendance record to update
      - in: body
        name: body
        required: true
        description: Fields to update (all fields optional)
        schema:
          type: object
          properties:
            attendance_status:
              type: string
              description: Updated attendance status
              enum: [Present, Absent, Late, Half Day, On Leave]
              example: Late
            attendance_date:
              type: string
              description: "Updated date (Format: YYYY-MM-DD). Cannot be a future date."
              example: "2025-01-15"
            check_in_time:
              type: string
              description: "Updated check-in time (Format: HH:MM:SS). Send null to clear."
              example: "09:15:00"
            check_out_time:
              type: string
              description: "Updated check-out time (Format: HH:MM:SS). Send null to clear."
              example: "18:00:00"
    responses:
      200:
        description: Attendance updated successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Attendance updated successfully
            data:
              type: object
              properties:
                attendance_id:
                  type: integer
                  example: 1
                employee_id:
                  type: integer
                  example: 5
                attendance_date:
                  type: string
                  example: "2025-01-15"
                attendance_status:
                  type: string
                  example: Late
                check_in_time:
                  type: string
                  example: "09:15:00"
                check_out_time:
                  type: string
                  example: "18:00:00"
      400:
        description: Validation error — invalid format or future date
      401:
        description: Unauthorized — missing or invalid JWT token
      404:
        description: Attendance record not found
      500:
        description: Internal server error
    """
    try:
        record = Attendance.query.get(attendance_id)
        if not record:
            return error_response("Attendance record not found", 404)

        data = request.get_json()
        if not data:
            return error_response("Request body is required")

        if "attendance_status" in data:
            valid_statuses = ("Present", "Absent", "Late", "Half Day", "On Leave")
            if data["attendance_status"] not in valid_statuses:
                return error_response(f"Status must be one of {valid_statuses}")
            record.attendance_status = data["attendance_status"]

        if "check_in_time" in data:
            record.check_in_time  = datetime.strptime(data["check_in_time"],  "%H:%M:%S").time() if data["check_in_time"]  else None
        if "check_out_time" in data:
            record.check_out_time = datetime.strptime(data["check_out_time"], "%H:%M:%S").time() if data["check_out_time"] else None
        if "attendance_date" in data:
            upd_date = datetime.strptime(data["attendance_date"], "%Y-%m-%d").date()
            if upd_date > date.today():
                return error_response("Cannot mark attendance for a future date", 400)
            record.attendance_date = upd_date

        db.session.commit()
        return success_response(record.to_dict(), "Attendance updated successfully")
    except ValueError as ve:
        return error_response(f"Invalid format: {str(ve)}")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@api.route("/attendance/<int:attendance_id>", methods=["DELETE"])
@jwt_required()
def delete_attendance(attendance_id):
    """
    Delete an attendance record
    Permanently remove an attendance record.
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    produces:
      - application/json
    parameters:
      - name: attendance_id
        in: path
        type: integer
        required: true
        description: Unique identifier of the attendance record to delete
    responses:
      200:
        description: Attendance record deleted successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Attendance record deleted successfully
            data:
              type: string
              example: null
      401:
        description: Unauthorized — missing or invalid JWT token
      404:
        description: Attendance record not found
      500:
        description: Internal server error
    """
    try:
        record = Attendance.query.get(attendance_id)
        if not record:
            return error_response("Attendance record not found", 404)
        db.session.delete(record)
        db.session.commit()
        return success_response(None, "Attendance record deleted successfully")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@api.route("/attendance/export", methods=["GET"])
@jwt_required()
def export_attendance_csv():
    """
    Export attendance records to CSV
    Download filtered attendance logs as a downloadable CSV file.
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    produces:
      - text/csv
    parameters:
      - name: employee_id
        in: query
        type: integer
        required: false
        description: Filter export by specific employee ID
      - name: date
        in: query
        type: string
        required: false
        description: "Filter export by date (Format: YYYY-MM-DD)"
        example: "2025-01-15"
      - name: status
        in: query
        type: string
        required: false
        description: Filter export by attendance status
        enum: [Present, Absent, Late, Half Day, On Leave]
      - name: search
        in: query
        type: string
        required: false
        description: Search/filter by employee name
    responses:
      200:
        description: A CSV file containing attendance logs matching active filters
        headers:
          Content-Disposition:
            type: string
            description: attachment; filename=attendance_report.csv
      401:
        description: Unauthorized — missing or invalid JWT token
      500:
        description: Internal server error
    """
    import csv
    import io
    from flask import Response
    try:
        query = Attendance.query.join(Employee)

        employee_id     = request.args.get("employee_id", type=int)
        attendance_date = request.args.get("date")
        status          = request.args.get("status")
        search          = request.args.get("search", "").strip()

        if employee_id:
            query = query.filter(Attendance.employee_id == employee_id)
        if attendance_date:
            query = query.filter(Attendance.attendance_date == datetime.strptime(attendance_date, "%Y-%m-%d").date())
        if status:
            query = query.filter(Attendance.attendance_status == status)
        if search:
            query = query.filter(Employee.employee_name.ilike(f"%{search}%"))

        records = query.order_by(Attendance.attendance_date.desc(), Employee.employee_name).all()

        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(["Attendance ID", "Employee ID", "Employee Name", "Department", "Date", "Check-In Time", "Check-Out Time", "Status"])
        
        for r in records:
            writer.writerow([
                r.attendance_id,
                r.employee_id,
                r.employee.employee_name if r.employee else "",
                r.employee.department if r.employee else "",
                r.attendance_date.strftime("%Y-%m-%d"),
                r.check_in_time.strftime("%H:%M:%S") if r.check_in_time else "",
                r.check_out_time.strftime("%H:%M:%S") if r.check_out_time else "",
                r.attendance_status
            ])
            
        output.seek(0)
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-disposition": "attachment; filename=attendance_report.csv"}
        )
    except Exception as e:
        return error_response(str(e), 500)


# ═══════════════════════════════════════════════════════════════════════════
#  ATTENDANCE REPORT
# ═══════════════════════════════════════════════════════════════════════════

@api.route("/attendance/report", methods=["GET"])
@jwt_required()
def attendance_report():
    """
    Generate attendance statistics report
    Get aggregated attendance statistics with optional filters by employee, month, year, or department.
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    produces:
      - application/json
    parameters:
      - name: employee_id
        in: query
        type: integer
        required: false
        description: Filter by employee ID
      - name: month
        in: query
        type: integer
        required: false
        description: "Filter by month (1-12)"
        example: 1
      - name: year
        in: query
        type: integer
        required: false
        description: Filter by year
        example: 2025
      - name: department
        in: query
        type: string
        required: false
        description: Filter by department name
    responses:
      200:
        description: Attendance statistics generated successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Attendance stats report generated successfully
            data:
              type: object
              properties:
                total_records:
                  type: integer
                  example: 150
                status_counts:
                  type: object
                  properties:
                    Present:
                      type: integer
                      example: 100
                    Absent:
                      type: integer
                      example: 15
                    Late:
                      type: integer
                      example: 20
                    Half Day:
                      type: integer
                      example: 5
                    On Leave:
                      type: integer
                      example: 10
                attendance_percentage:
                  type: number
                  example: 87.86
      401:
        description: Unauthorized — missing or invalid JWT token
      500:
        description: Internal server error
    """
    try:
        query = Attendance.query.join(Employee)

        employee_id = request.args.get("employee_id", type=int)
        month       = request.args.get("month", type=int)
        year        = request.args.get("year", type=int)
        department  = request.args.get("department")

        if employee_id:
            query = query.filter(Attendance.employee_id == employee_id)
        if month:
            query = query.filter(db.extract("month", Attendance.attendance_date) == month)
        if year:
            query = query.filter(db.extract("year",  Attendance.attendance_date) == year)
        if department:
            query = query.filter(Employee.department == department)

        records = query.all()
        total   = len(records)

        status_counts = {
            "Present":  sum(1 for r in records if r.attendance_status == "Present"),
            "Absent":   sum(1 for r in records if r.attendance_status == "Absent"),
            "Late":     sum(1 for r in records if r.attendance_status == "Late"),
            "Half Day": sum(1 for r in records if r.attendance_status == "Half Day"),
            "On Leave": sum(1 for r in records if r.attendance_status == "On Leave"),
        }

        present_weight = status_counts["Present"] + status_counts["Late"] + (status_counts["Half Day"] * 0.5)
        denominator    = total - status_counts["On Leave"]
        percentage     = round((present_weight / denominator * 100), 2) if denominator > 0 else 0

        return success_response({
            "total_records": total,
            "status_counts": status_counts,
            "attendance_percentage": percentage
        }, "Attendance stats report generated successfully")
    except Exception as e:
        return error_response(str(e), 500)


# ═══════════════════════════════════════════════════════════════════════════
#  DASHBOARD ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@api.route("/dashboard/stats", methods=["GET"])
@jwt_required()
def get_dashboard_stats():
    """
    Get dashboard statistics
    Retrieve overall HR dashboard statistics including employee totals, today's attendance, department breakdown, and 7-day trend data.
    ---
    tags:
      - Dashboard
    security:
      - Bearer: []
    produces:
      - application/json
    responses:
      200:
        description: Dashboard statistics generated successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: Dashboard statistics generated successfully
            data:
              type: object
              properties:
                total_employees:
                  type: integer
                  description: Total number of employees
                  example: 50
                active_employees:
                  type: integer
                  description: Number of active employees
                  example: 45
                present_today:
                  type: integer
                  description: Employees present today (including half-day)
                  example: 38
                absent_today:
                  type: integer
                  description: Employees absent today
                  example: 5
                leave_today:
                  type: integer
                  description: Employees on leave today
                  example: 2
                attendance_percentage_today:
                  type: number
                  description: Today's attendance percentage
                  example: 88.37
                department_data:
                  type: array
                  description: Employee count per department
                  items:
                    type: object
                    properties:
                      name:
                        type: string
                        example: Engineering
                      value:
                        type: integer
                        example: 15
                trend_data:
                  type: array
                  description: Last 7 days attendance trend
                  items:
                    type: object
                    properties:
                      date:
                        type: string
                        example: "01/15"
                      Present:
                        type: integer
                        example: 40
                      Absent:
                        type: integer
                        example: 5
      401:
        description: Unauthorized — missing or invalid JWT token
      500:
        description: Internal server error
    """
    try:
        today = date.today()

        total_employees  = Employee.query.count()
        active_employees = Employee.query.filter_by(status="Active").count()

        today_records = Attendance.query.filter_by(attendance_date=today).all()

        present_today  = sum(1 for r in today_records if r.attendance_status in ("Present", "Late"))
        half_day_today = sum(1 for r in today_records if r.attendance_status == "Half Day")
        absent_today   = sum(1 for r in today_records if r.attendance_status == "Absent")
        leave_today    = sum(1 for r in today_records if r.attendance_status == "On Leave")

        denominator_today = present_today + half_day_today + absent_today
        attendance_percentage_today = round(
            ((present_today + (half_day_today * 0.5)) / denominator_today * 100), 2
        ) if denominator_today > 0 else 0

        dept_counts = db.session.query(
            Employee.department, func.count(Employee.employee_id)
        ).group_by(Employee.department).all()
        department_data = [{"name": dept, "value": count} for dept, count in dept_counts]

        trend_records = db.session.query(
            Attendance.attendance_date,
            func.sum(db.case((Attendance.attendance_status.in_(["Present", "Late"]), 1), else_=0)),
            func.sum(db.case((Attendance.attendance_status == "Absent", 1), else_=0))
        ).group_by(Attendance.attendance_date).order_by(Attendance.attendance_date.desc()).limit(7).all()

        trend_data = [{
            "date": str(d.strftime("%m/%d")),
            "Present": int(p or 0),
            "Absent":  int(ab or 0)
        } for d, p, ab in reversed(trend_records)]

        stats = {
            "total_employees": total_employees,
            "active_employees": active_employees,
            "present_today": present_today + half_day_today,
            "absent_today": absent_today,
            "leave_today": leave_today,
            "attendance_percentage_today": attendance_percentage_today,
            "department_data": department_data,
            "trend_data": trend_data
        }

        return success_response(stats, "Dashboard statistics generated successfully")
    except Exception as e:
        return error_response(str(e), 500)
