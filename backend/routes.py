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

#  USERS ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@api.route("/users", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_users():
    """
    Get all users
    ---
    tags:
      - Users
    responses:
      200:
        description: List of all users
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
    ---
    tags:
      - Users
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: User found
      404:
        description: User not found
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
    ---
    tags:
      - Users
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [username, password]
          properties:
            username:
              type: string
            password:
              type: string
            role:
              type: string
              enum: [admin, hr, employee]
    responses:
      201:
        description: User created
      409:
        description: Username already exists
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
    ---
    tags:
      - Users
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
            password:
              type: string
            role:
              type: string
    responses:
      200:
        description: User updated
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
    ---
    tags:
      - Users
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: User deleted
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
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
            password:
              type: string
    responses:
      200:
        description: Login successful
      401:
        description: Invalid credentials
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
    Get all employees (with optional search/filter)
    ---
    tags:
      - Employees
    parameters:
      - name: search
        in: query
        type: string
        description: Search by name, email, or designation
      - name: department
        in: query
        type: string
      - name: status
        in: query
        type: string
        enum: [Active, Inactive]
    responses:
      200:
        description: List of employees
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
    ---
    tags:
      - Employees
    responses:
      200:
        description: List of department names
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
    ---
    tags:
      - Employees
    parameters:
      - name: employee_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Employee found
      404:
        description: Employee not found
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
    Get full attendance history for a specific employee
    ---
    tags:
      - Employees
    parameters:
      - name: employee_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Attendance history with summary statistics
      404:
        description: Employee not found
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
    ---
    tags:
      - Employees
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [employee_name, email, mobile, department, designation]
          properties:
            employee_name:
              type: string
            email:
              type: string
            mobile:
              type: string
            department:
              type: string
            designation:
              type: string
            status:
              type: string
              enum: [Active, Inactive]
    responses:
      201:
        description: Employee created
      409:
        description: Email already exists
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
    ---
    tags:
      - Employees
    parameters:
      - name: employee_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
    responses:
      200:
        description: Employee updated
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
    ---
    tags:
      - Employees
    parameters:
      - name: employee_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Employee deleted
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
    Get attendance records (with optional filters)
    ---
    tags:
      - Attendance
    parameters:
      - name: employee_id
        in: query
        type: integer
      - name: date
        in: query
        type: string
        description: "Format: YYYY-MM-DD"
      - name: status
        in: query
        type: string
        enum: [Present, Absent, Late, Half Day, On Leave]
      - name: department
        in: query
        type: string
      - name: search
        in: query
        type: string
        description: Search by employee name
    responses:
      200:
        description: List of attendance records
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
    Per-employee attendance summary with percentage
    ---
    tags:
      - Attendance
    parameters:
      - name: department
        in: query
        type: string
      - name: search
        in: query
        type: string
      - name: min_percentage
        in: query
        type: number
      - name: max_percentage
        in: query
        type: number
    responses:
      200:
        description: Employee attendance summaries
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
                "on_leave": on_leave
            })

        return success_response(summary)
    except Exception as e:
        return error_response(str(e), 500)


@api.route("/attendance/<int:attendance_id>", methods=["GET"])
@jwt_required()
def get_attendance_record(attendance_id):
    """
    Get a single attendance record by ID
    ---
    tags:
      - Attendance
    parameters:
      - name: attendance_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Attendance record found
      404:
        description: Not found
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
    ---
    tags:
      - Attendance
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [employee_id, attendance_date, attendance_status]
          properties:
            employee_id:
              type: integer
            attendance_date:
              type: string
              description: "Format: YYYY-MM-DD"
            attendance_status:
              type: string
              enum: [Present, Absent, Late, Half Day, On Leave]
            check_in_time:
              type: string
              description: "Format: HH:MM:SS"
            check_out_time:
              type: string
              description: "Format: HH:MM:SS"
    responses:
      201:
        description: Attendance marked
      409:
        description: Already marked for this date
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
    ---
    tags:
      - Attendance
    parameters:
      - name: attendance_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
    responses:
      200:
        description: Attendance updated
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
            record.attendance_date = datetime.strptime(data["attendance_date"], "%Y-%m-%d").date()

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
    ---
    tags:
      - Attendance
    parameters:
      - name: attendance_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Attendance deleted
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


# ═══════════════════════════════════════════════════════════════════════════
#  ATTENDANCE REPORT
# ═══════════════════════════════════════════════════════════════════════════

@api.route("/attendance/report", methods=["GET"])
@jwt_required()
def attendance_report():
    """
    Generate attendance statistics (summary report)
    ---
    tags:
      - Attendance
    parameters:
      - name: employee_id
        in: query
        type: integer
      - name: month
        in: query
        type: integer
        description: "Month number 1-12"
      - name: year
        in: query
        type: integer
      - name: department
        in: query
        type: string
    responses:
      200:
        description: Attendance statistics
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
    Get overall HR dashboard statistics
    ---
    tags:
      - Dashboard
    responses:
      200:
        description: Dashboard statistics including totals, trends, and department data
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
