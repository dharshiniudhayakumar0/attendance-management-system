from datetime import datetime, date, time
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# ---------------------------------------------------------------------------
# User Model (mapped to 'users' table)
# ---------------------------------------------------------------------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(
        db.Enum("admin", "hr", "employee", name="user_role"),
        nullable=False,
        default="employee"
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# ---------------------------------------------------------------------------
# Employee Model (mapped to 'employees' table)
# ---------------------------------------------------------------------------
class Employee(db.Model):
    __tablename__ = "employees"

    employee_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    employee_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    mobile = db.Column(db.String(15), nullable=False)
    department = db.Column(db.String(80), nullable=False)
    designation = db.Column(db.String(80), nullable=False)
    status = db.Column(
        db.Enum("Active", "Inactive", name="employee_status"),
        nullable=False,
        default="Active"
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    attendances = db.relationship(
        "Attendance",
        backref="employee",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "employee_id": self.employee_id,
            "employee_name": self.employee_name,
            "email": self.email,
            "mobile": self.mobile,
            "department": self.department,
            "designation": self.designation,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# ---------------------------------------------------------------------------
# Attendance Model (mapped to 'attendance' table)
# ---------------------------------------------------------------------------
class Attendance(db.Model):
    __tablename__ = "attendance"

    attendance_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    employee_id = db.Column(
        db.Integer,
        db.ForeignKey("employees.employee_id", ondelete="CASCADE"),
        nullable=False
    )
    attendance_date = db.Column(db.Date, nullable=False, default=date.today)
    check_in_time = db.Column(db.Time, default=None, nullable=True)
    check_out_time = db.Column(db.Time, default=None, nullable=True)
    attendance_status = db.Column(
        db.Enum("Present", "Absent", "Late", "Half Day", "On Leave", name="attendance_status"),
        nullable=False,
        default="Present"
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint: one record per employee per day
    __table_args__ = (
        db.UniqueConstraint("employee_id", "attendance_date", name="uq_employee_date"),
    )

    def to_dict(self):
        return {
            "attendance_id": self.attendance_id,
            "employee_id": self.employee_id,
            "employee_name": self.employee.employee_name if self.employee else None,
            "department": self.employee.department if self.employee else None,
            "attendance_date": self.attendance_date.isoformat() if self.attendance_date else None,
            "check_in_time": self.check_in_time.strftime("%H:%M:%S") if self.check_in_time else None,
            "check_out_time": self.check_out_time.strftime("%H:%M:%S") if self.check_out_time else None,
            "attendance_status": self.attendance_status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
