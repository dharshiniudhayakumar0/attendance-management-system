# 📊 Mini-Attendance Management System

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-purple)

A full-stack, responsive web application for managing employee directories and daily attendance. Built with **React** (Vite), **Tailwind CSS**, **Flask**, and **MySQL**, this system provides a secure, role-based architecture to streamline human resource workflows.

---

## 🚀 Features

- **Authentication & Security:** Secure login powered by JWT (JSON Web Tokens) and Role-Based Access Control (RBAC).
- **Employee Management:** Full CRUD operations with detailed profile views.
- **Attendance Tracking:** Mark, edit, and delete daily attendance (Present, Absent, Late, Half Day, On Leave) with exact timestamps.
- **Advanced Dashboard:** Real-time metrics and dynamic chart analytics.
- **Data Tables:** High-performance tables with client-side Pagination, Sorting, and multi-parameter Search & Filtering.
- **Export Capabilities:** Instant one-click CSV/Excel exports for both employee and attendance reports.
- **API Documentation:** Interactive OpenAPI/Swagger documentation (`/apidocs`).
- **Containerization:** Fully dockerized backend, frontend, and database environments using `docker-compose`.

---

## 💻 Technology Stack

**Frontend:**
- React 18 (Vite)
- Tailwind CSS
- Axios (with JWT interceptors)
- React Router DOM
- Chart.js / React-Chartjs-2

**Backend:**
- Python 3 / Flask
- Flask-SQLAlchemy & PyMySQL
- Flask-JWT-Extended
- Flasgger (Swagger UI)
- Gunicorn

**Database & DevOps:**
- MySQL 8.0
- Docker & Docker Compose
- Nginx

---

## 📁 Folder Structure

```text
attendance-management-system/
├── backend/
│   ├── app.py                # Flask application factory
│   ├── config.py             # Environment configurations & JWT Secrets
│   ├── models.py             # SQLAlchemy Database Models
│   ├── routes.py             # REST API Endpoints with Swagger docstrings
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Backend container configuration
│
├── frontend/
│   ├── index.html            # Main HTML entry point
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite configuration
│   ├── Dockerfile            # Frontend container (Nginx)
│   └── src/
│       ├── components/       # Reusable React components (Layout, Modals, etc.)
│       ├── pages/            # Main views (Dashboard, Employees, Attendance, Login)
│       └── services/         # API integration logic (api.js, authService, etc.)
│
├── database/
│   └── init.sql              # MySQL initialization script
│
└── docker-compose.yml        # Multi-container orchestration
```

---

## ⚙️ Installation & Setup

You can run this project either natively using your local environment (Node + Python + XAMPP/MySQL) or via Docker.

### 🐳 Option 1: Docker Setup (Recommended)
Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.
1. Open a terminal in the root directory.
2. Run the following command:
   ```bash
   docker-compose up -d --build
   ```
3. The application will be available at `http://localhost`.

### 💻 Option 2: Local Native Setup

#### 1. MySQL Setup
1. Ensure your local MySQL server (or XAMPP) is running on port `3306`.
2. Create a new database named `attendance_db`.
3. Create a user `root` with the password `root` (or update `backend/config.py` to match your credentials).
4. *(Optional)* Import the `database/init.sql` file if you wish to seed dummy data.

#### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask API:
   ```bash
   python app.py
   ```
   *The backend will run on `http://localhost:5000`. API Docs are available at `http://localhost:5000/apidocs/`.*

#### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node modules:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`.*

---

## 🔗 API List

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/users/login` | POST | Authenticate user & get JWT | Public |
| `/api/users` | GET/POST | Manage admin/HR accounts | Admin |
| `/api/employees` | GET/POST | List/Search or create employees | Admin/HR |
| `/api/employees/<id>` | GET/PUT/DELETE | View, update, or remove employee | Admin/HR |
| `/api/employees/<id>/attendance-history`| GET | Detailed history of specific employee | Admin/HR |
| `/api/attendance` | GET/POST | View filters or mark daily attendance | Admin/HR |
| `/api/attendance/<id>` | PUT/DELETE | Modify or delete a specific log | Admin/HR |
| `/api/attendance/employee-summary` | GET | Comprehensive attendance percentages | Admin/HR |
| `/api/dashboard/stats` | GET | High-level metrics for dashboard UI | All Roles |

*(For full interactive documentation and schema definitions, visit the Swagger UI at `http://localhost:5000/apidocs/` while the backend is running).*

---

## 🖼️ Screenshots

> **Note:** Replace these placeholder links with actual screenshot images of your application.

* **Dashboard Overview:**  
  ![Dashboard Screenshot](#)
* **Employee Directory:**  
  ![Employees Screenshot](#)
* **Attendance Tracking:**  
  ![Attendance Screenshot](#)
* **API Documentation (Swagger):**  
  ![Swagger Screenshot](#)

---

## 🔮 Future Enhancements

- [ ] **Cloud Deployment:** CI/CD pipelines for deployment to AWS (EC2/RDS) or Vercel/Render.
- [ ] **Automated Testing:** Implement `pytest` for backend unit testing and `jest` for frontend components.
- [ ] **Biometric Integration:** Open endpoints to receive automated check-in/check-out pings from physical RFID/Biometric scanners.
- [ ] **Email Notifications:** Automated email reports sent to HR at the end of every week summarizing absentees using `Flask-Mail`.
- [ ] **Leave Management System:** A dedicated module for employees to request PTO/Vacation days and for HR to approve them.
