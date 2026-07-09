-- ============================================================
-- Attendance Management System — Complete Database Script
-- Database: attendance_db
-- ============================================================

-- Drop and recreate the database
DROP DATABASE IF EXISTS attendance_db;

CREATE DATABASE attendance_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE attendance_db;


-- ============================================================
-- TABLE 1: users
-- Purpose: System login accounts (Admin, HR, Employee roles)
-- ============================================================
CREATE TABLE users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(50)  NOT NULL UNIQUE,
  password        VARCHAR(255) NOT NULL,
  role            ENUM('admin', 'hr', 'employee') NOT NULL DEFAULT 'employee',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_users_role (role)
) ENGINE=InnoDB;


-- ============================================================
-- TABLE 2: employees
-- Purpose: Employee master records
-- ============================================================
CREATE TABLE employees (
  employee_id     INT AUTO_INCREMENT PRIMARY KEY,
  employee_name   VARCHAR(120) NOT NULL,
  email           VARCHAR(120) NOT NULL UNIQUE,
  mobile          VARCHAR(15)  NOT NULL,
  department      VARCHAR(80)  NOT NULL,
  designation     VARCHAR(80)  NOT NULL,
  status          ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_employees_department (department),
  INDEX idx_employees_status (status)
) ENGINE=InnoDB;


-- ============================================================
-- TABLE 3: attendance
-- Purpose: Daily attendance log per employee
-- Constraints:
--   • FK → employees.employee_id (CASCADE on DELETE)
--   • One record per employee per day (UNIQUE)
-- ============================================================
CREATE TABLE attendance (
  attendance_id      INT AUTO_INCREMENT PRIMARY KEY,
  employee_id        INT          NOT NULL,
  attendance_date    DATE         NOT NULL,
  check_in_time      TIME         DEFAULT NULL,
  check_out_time     TIME         DEFAULT NULL,
  attendance_status  ENUM('Present', 'Absent', 'Late', 'Half Day', 'On Leave')
                     NOT NULL DEFAULT 'Present',
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign Key
  CONSTRAINT fk_attendance_employee
    FOREIGN KEY (employee_id)
    REFERENCES employees (employee_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- One attendance record per employee per day
  CONSTRAINT uq_employee_date
    UNIQUE (employee_id, attendance_date),

  INDEX idx_attendance_date (attendance_date),
  INDEX idx_attendance_status (attendance_status)
) ENGINE=InnoDB;


-- ============================================================
-- SAMPLE DATA — Users
-- ============================================================
INSERT INTO users (username, password, role) VALUES
  ('admin',     'admin123',     'admin'),
  ('hr_priya',  'priya@hr',     'hr'),
  ('emp_rahul', 'rahul@123',    'employee'),
  ('emp_sneha', 'sneha@123',    'employee'),
  ('emp_kiran', 'kiran@123',    'employee');


-- ============================================================
-- SAMPLE DATA — Employees
-- ============================================================
INSERT INTO employees (employee_name, email, mobile, department, designation, status) VALUES
  ('Rahul Sharma',    'rahul.sharma@company.com',   '9876543210', 'Engineering',      'Software Engineer',     'Active'),
  ('Sneha Patel',     'sneha.patel@company.com',    '9876543211', 'Engineering',      'Senior Developer',      'Active'),
  ('Kiran Desai',     'kiran.desai@company.com',    '9876543212', 'Human Resources',  'HR Executive',          'Active'),
  ('Amit Verma',      'amit.verma@company.com',     '9876543213', 'Marketing',        'Marketing Manager',     'Active'),
  ('Priya Nair',      'priya.nair@company.com',     '9876543214', 'Finance',          'Accountant',            'Active'),
  ('Deepak Kumar',    'deepak.kumar@company.com',   '9876543215', 'Engineering',      'DevOps Engineer',       'Active'),
  ('Ananya Gupta',    'ananya.gupta@company.com',   '9876543216', 'Design',           'UI/UX Designer',        'Active'),
  ('Vikram Singh',    'vikram.singh@company.com',   '9876543217', 'Engineering',      'QA Engineer',           'Inactive'),
  ('Meera Joshi',     'meera.joshi@company.com',    '9876543218', 'Marketing',        'Content Writer',        'Active'),
  ('Arjun Reddy',     'arjun.reddy@company.com',    '9876543219', 'Engineering',      'Tech Lead',             'Active');


-- ============================================================
-- SAMPLE DATA — Attendance (5 days × 10 employees = 50 records)
-- ============================================================

-- Day 1: Monday 2026-07-06
INSERT INTO attendance (employee_id, attendance_date, check_in_time, check_out_time, attendance_status) VALUES
  (1,  '2026-07-06', '09:00:00', '18:00:00', 'Present'),
  (2,  '2026-07-06', '09:15:00', '18:30:00', 'Present'),
  (3,  '2026-07-06', '09:05:00', '17:45:00', 'Present'),
  (4,  '2026-07-06', '09:45:00', '18:00:00', 'Late'),
  (5,  '2026-07-06', '09:00:00', '18:00:00', 'Present'),
  (6,  '2026-07-06', '08:50:00', '18:15:00', 'Present'),
  (7,  '2026-07-06', NULL,       NULL,        'Absent'),
  (8,  '2026-07-06', '09:10:00', '18:00:00', 'Present'),
  (9,  '2026-07-06', '09:00:00', '13:00:00', 'Half Day'),
  (10, '2026-07-06', '08:55:00', '18:30:00', 'Present');

-- Day 2: Tuesday 2026-07-07
INSERT INTO attendance (employee_id, attendance_date, check_in_time, check_out_time, attendance_status) VALUES
  (1,  '2026-07-07', '09:00:00', '18:00:00', 'Present'),
  (2,  '2026-07-07', '09:30:00', '18:00:00', 'Late'),
  (3,  '2026-07-07', NULL,       NULL,        'On Leave'),
  (4,  '2026-07-07', '09:00:00', '18:15:00', 'Present'),
  (5,  '2026-07-07', '09:10:00', '18:00:00', 'Present'),
  (6,  '2026-07-07', '09:00:00', '18:00:00', 'Present'),
  (7,  '2026-07-07', '09:05:00', '18:00:00', 'Present'),
  (8,  '2026-07-07', NULL,       NULL,        'Absent'),
  (9,  '2026-07-07', '09:00:00', '18:30:00', 'Present'),
  (10, '2026-07-07', '09:00:00', '18:00:00', 'Present');

-- Day 3: Wednesday 2026-07-08
INSERT INTO attendance (employee_id, attendance_date, check_in_time, check_out_time, attendance_status) VALUES
  (1,  '2026-07-08', '09:05:00', '18:00:00', 'Present'),
  (2,  '2026-07-08', '09:00:00', '18:00:00', 'Present'),
  (3,  '2026-07-08', '09:00:00', '17:30:00', 'Present'),
  (4,  '2026-07-08', NULL,       NULL,        'On Leave'),
  (5,  '2026-07-08', '09:00:00', '18:00:00', 'Present'),
  (6,  '2026-07-08', '09:40:00', '18:00:00', 'Late'),
  (7,  '2026-07-08', '09:00:00', '18:00:00', 'Present'),
  (8,  '2026-07-08', '09:00:00', '13:00:00', 'Half Day'),
  (9,  '2026-07-08', NULL,       NULL,        'Absent'),
  (10, '2026-07-08', '09:00:00', '18:00:00', 'Present');

-- Day 4: Thursday 2026-07-09 (today)
INSERT INTO attendance (employee_id, attendance_date, check_in_time, check_out_time, attendance_status) VALUES
  (1,  '2026-07-09', '09:00:00', '18:00:00', 'Present'),
  (2,  '2026-07-09', '09:00:00', '18:00:00', 'Present'),
  (3,  '2026-07-09', '09:20:00', '18:00:00', 'Present'),
  (4,  '2026-07-09', '09:00:00', '18:00:00', 'Present'),
  (5,  '2026-07-09', NULL,       NULL,        'Absent'),
  (6,  '2026-07-09', '09:00:00', '18:00:00', 'Present'),
  (7,  '2026-07-09', '09:00:00', '18:15:00', 'Present'),
  (8,  '2026-07-09', NULL,       NULL,        'On Leave'),
  (9,  '2026-07-09', '09:50:00', '18:00:00', 'Late'),
  (10, '2026-07-09', '09:00:00', '18:00:00', 'Present');

-- Day 5: Friday 2026-07-10
INSERT INTO attendance (employee_id, attendance_date, check_in_time, check_out_time, attendance_status) VALUES
  (1,  '2026-07-10', '09:00:00', '17:00:00', 'Present'),
  (2,  '2026-07-10', '09:00:00', '17:00:00', 'Present'),
  (3,  '2026-07-10', '09:00:00', '17:00:00', 'Present'),
  (4,  '2026-07-10', '09:35:00', '17:00:00', 'Late'),
  (5,  '2026-07-10', '09:00:00', '17:00:00', 'Present'),
  (6,  '2026-07-10', NULL,       NULL,        'On Leave'),
  (7,  '2026-07-10', '09:00:00', '12:30:00', 'Half Day'),
  (8,  '2026-07-10', '09:00:00', '17:00:00', 'Present'),
  (9,  '2026-07-10', '09:00:00', '17:00:00', 'Present'),
  (10, '2026-07-10', NULL,       NULL,        'Absent');


-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SELECT '--- USERS ---' AS '';
SELECT * FROM users;

SELECT '--- EMPLOYEES ---' AS '';
SELECT * FROM employees;

SELECT '--- ATTENDANCE (sample) ---' AS '';
SELECT
  a.attendance_id,
  e.employee_name,
  e.department,
  a.attendance_date,
  a.check_in_time,
  a.check_out_time,
  a.attendance_status
FROM attendance a
JOIN employees e ON a.employee_id = e.employee_id
ORDER BY a.attendance_date, e.employee_name
LIMIT 20;

SELECT '--- ATTENDANCE SUMMARY ---' AS '';
SELECT
  attendance_status,
  COUNT(*) AS total_records
FROM attendance
GROUP BY attendance_status
ORDER BY total_records DESC;
