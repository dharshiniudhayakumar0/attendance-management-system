# Attendance Management System

A full-stack Attendance Management System developed using **React.js**, **Flask**, and **MySQL**. The application helps administrators manage employees and monitor daily attendance through a clean, responsive web interface.

---

## Project Overview

The Attendance Management System is designed to simplify employee management and attendance tracking. It provides a centralized dashboard where administrators can add employees, record attendance, view attendance history, and monitor employee statistics.

---

## Features

- Secure Admin Login
- Dashboard with Attendance Statistics
- Employee Management (Add, Edit, Delete, View)
- Search Employees
- Attendance Management
- Attendance History
- Attendance Summary
- Department-wise Employee Count
- Responsive User Interface
- REST API Integration
- MySQL Database Connectivity

---

## Technology Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- React Router DOM
- Axios

### Backend
- Python
- Flask
- Flask-CORS
- Flask-SQLAlchemy

### Database
- MySQL

### Tools
- Git
- GitHub
- Visual Studio Code
- MySQL Workbench
- Postman

---

## Project Structure

```
attendance-management-system/

│── frontend/
│── backend/
│── database/
│    └── attendance_db.sql
│── README.md
```

---

## Database Tables

### Users
- ID
- Username
- Password
- Role
- Created At

### Employees
- Employee ID
- Employee Name
- Email
- Mobile Number
- Department
- Designation
- Status
- Created At

### Attendance
- Attendance ID
- Employee ID
- Attendance Date
- Check In Time
- Check Out Time
- Attendance Status
- Created At

---

## Installation Guide

### Clone Repository

```bash
git clone https://github.com/dharshiniudhayakumar0/attendance-management-system.git
```

---

## Backend Setup

```bash
cd backend

pip install -r requirements.txt

python app.py
```

The Flask server will start on:

```
http://127.0.0.1:5000
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

The React application will start on:

```
http://localhost:5173
```

---

## Database Setup

1. Open MySQL Workbench.

2. Create a database named:

```
attendance_db
```

3. Import:

```
database/attendance_db.sql
```

4. Update the MySQL username and password in the backend configuration if required.

---

## REST API Endpoints

### Authentication

POST

```
/login
```

---

### Employee APIs

GET

```
/employees
```

POST

```
/employees
```

PUT

```
/employees/<id>
```

DELETE

```
/employees/<id>
```

---

### Attendance APIs

GET

```
/attendance
```

POST

```
/attendance
```

GET

```
/attendance/summary
```

---

### Dashboard APIs

GET

```
/dashboard
```

---

## Screenshots

Add screenshots inside a folder named:

```
screenshots/
```

Recommended screenshots:

- Login Page
- Dashboard
- Employee Management
- Attendance Management
- Attendance History

---

## Future Enhancements

- JWT Authentication
- Role-Based Access Control
- Email Notifications
- Attendance Report Export (CSV/Excel)
- Docker Deployment
- Cloud Deployment
- Swagger API Documentation
- Unit Testing

---

## Author

**Dharshini U**

B.E. Electronics and Communication Engineering

Meenakshi College of Engineering

GitHub

https://github.com/dharshiniudhayakumar0

LinkedIn

https://www.linkedin.com/in/dharshini-u-a8a6992a0

---