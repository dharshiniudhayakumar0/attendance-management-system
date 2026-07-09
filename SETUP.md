## Setup Instructions

### Prerequisites

Make sure the following software is installed:

- Python 3.10 or above
- Node.js and npm
- MySQL Server
- Git

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/dharshiniudhayakumar0/attendance-management-system.git

cd attendance-management-system
```

---

### Step 2: Database Setup

1. Open MySQL Workbench.
2. Create a database named:

```
attendance_db
```

3. Import the SQL file:

```
database/attendance_db.sql
```

---

### Step 3: Backend Setup

Open a terminal.

```bash
cd backend
```

Create a virtual environment (optional):

```bash
python -m venv venv
```

Activate it.

Windows:

```bash
venv\Scripts\activate
```

Install the required packages:

```bash
pip install -r requirements.txt
```

Run the Flask server:

```bash
python app.py
```

Backend runs on:

```
http://127.0.0.1:5000
```

---

### Step 4: Frontend Setup

Open another terminal.

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the React application:

```bash
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

### Step 5: Login Credentials

```
Username : admin
Password : admin123
```

---

### Step 6: Using the Application

- Login using the admin credentials.
- Add employees.
- Edit or delete employees.
- Mark employee attendance.
- View attendance history.
- View dashboard statistics.

git add SETUP.md