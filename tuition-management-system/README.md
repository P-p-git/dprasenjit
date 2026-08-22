# Smart Tuition - Tuition Management System

A full-stack web application for managing coaching classes, students, teachers, attendance, fees, homework, exams, results, and notices.

## Project Overview

Smart Tuition is a comprehensive tuition management platform designed to help coaching class administrators, teachers, and students manage daily operations. It provides:

- **Admin Dashboard** with analytics, fee summaries, and student management
- **Teacher Dashboard** with assigned batches, homework, and exam management
- **Student Dashboard** with attendance, results, fee status, and homework
- **Attendance Tracking** with batch-wise marking and per-student summaries
- **Fee Management** with individual records, pending-fee month-range detection, and range payments
- **Homework & Exam Management** with batch/subject filtering
- **Results & Grading** with automatic percentage and grade computation
- **Notice System** for announcements to all or specific batches
- **Dark/Light Theme** with system preference detection
- **Role-Based Access Control** (Admin, Teacher, Student)

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router DOM 7, Vite 8 |
| **Backend** | Node.js, Express.js 4 |
| **Database** | SQLite via better-sqlite3 |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs |
| **Validation** | express-validator |
| **Linter** | Oxlint |

## Requirements

- **Node.js** >= 18.x
- **npm** >= 9.x
- **No MongoDB or MongoDB Atlas required** - the project uses SQLite exclusively

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd tuition-management-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Environment Setup

Create a `.env` file in the `backend/` directory:

```env
JWT_SECRET=your_random_secret_key_here
PORT=5000
NODE_ENV=development
```

A `.env.example` file is provided with safe placeholder values. Copy it as a starting point:

```bash
cp backend/.env.example backend/.env
```

**Important:** Change `JWT_SECRET` to a strong random string for production use. Never commit the `.env` file.

## SQLite Setup

The project uses **SQLite** with the `better-sqlite3` library. No external database server is required.

- The SQLite database file is automatically created at `backend/data/database.sqlite`
- Tables and indexes are created automatically on server startup
- Foreign key enforcement is enabled
- WAL (Write-Ahead Logging) mode is enabled for better concurrent performance

### Seeding Demo Data

To populate the database with demo data:

```bash
cd backend
npm run seed
```

This will create:

| Role | Username | Password |
|------|----------|----------|
| Admin | `ADMIN_USERNAME` env var (default `admin`) | `ADMIN_PASSWORD` env var — if unset, a strong random password is generated and printed ONCE in the console |
| Teacher | rahul | teacher@123 |
| Student | student01 | student@123 |
| Student | student02 | student@123 |
| Student | student03 | student@123 |
| Student | student04 | student@123 |

> **Security note:** Admin credentials are never hardcoded in the source. Set `ADMIN_NAME`, `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` environment variables before seeding a fresh production database.

### Resetting the Database

To reset the database, delete the SQLite files and re-run the seed:

```bash
rm backend/data/database.sqlite*
cd backend
npm run seed
```

## How to Run

### Production Mode (Single Command)

The backend serves both the API and the frontend build. No separate frontend server needed.

```bash
cd tuition-management-system
cd frontend && npm run build && cd ../backend && node server.js
```

Open `http://localhost:5000` in your browser.

### Development Mode (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend dev server runs on `http://localhost:3000` and proxies API requests to the backend.

## Login Credentials

### Admin
- **Username:** the `ADMIN_USERNAME` environment variable (default `admin`)
- **Password:** the `ADMIN_PASSWORD` environment variable (never stored in code)

Login is a single step: username + password. There is no OTP/2FA/authenticator code.

Admins can reset any teacher/student password from the Edit form in the Students/Teachers pages, or mint one-time reset links with `node utils/resetPasswordCli.js <username-or-email>`.

### Teacher
- **Username:** rahul
- **Password:** teacher@123

### Student
- **Username:** student01
- **Password:** student@123
- **Username:** student02
- **Password:** student@123
- **Username:** student03
- **Password:** student@123
- **Username:** student04
- **Password:** student@123

> **Note:** All teacher and student accounts use a common default password for development convenience. Admins should set custom passwords when creating accounts or reset them later from the admin UI.

## Features

### Admin Features
- Full dashboard with student/teacher/batch counts, fee summaries, and recent activity
- Student management (CRUD, search, filter by class/batch)
- Teacher management (CRUD)
- Batch management (create, assign teachers and students)
- Attendance marking
- Fee management (individual records, range-based pending fee detection, range payments)
- Homework and exam management
- Result entry and management
- Notice creation (global or batch-specific)

### Teacher Features
- Dashboard showing assigned batches and students
- View students
- Mark attendance for assigned batches
- Create homework and exams
- Enter exam results
- Create notices

### Student Features
- Dashboard with attendance percentage, fee status, average marks, and results
- View attendance history
- View fee status and payment history
- View homework
- View exam results
- View notices

## Fee Management

### Fee Records Tab
- View all fee records with status (paid/pending)
- Filter by status
- Mark individual fees as paid
- Admin dashboard shows total collected and pending amounts

### Pending Fee Range Tab
- Select a student
- Choose a month range (From Month/Year to To Month/Year)
- System calculates:
  - Months with existing paid records
  - Months with existing pending records
  - Months with no records (auto-generated using student's monthly fee)
- Shows total pending and paid amounts
- Record payment for all pending months at once
- Supports payment methods: Cash, UPI, Bank Transfer, Card, Other

## Database Structure

### Tables
- **users** - User accounts with username, role, and active status
- **teachers** - Teacher profiles linked to user accounts
- **students** - Student profiles linked to user accounts
- **batches** - Class batches with teacher assignment
- **batch_students** - Junction table for batch-student many-to-many relationship
- **attendance** - Daily attendance records per student per batch
- **fees** - Monthly fee records per student with payment status
- **homework** - Homework assignments per batch
- **exams** - Exam records per batch
- **results** - Student exam results with grades
- **notices** - Announcements (global or batch-specific)

### Key Constraints
- Foreign keys with CASCADE/SET NULL as appropriate
- UNIQUE constraints on username, email, attendance records, fee records per month/year, and student exam results
- CHECK constraints on roles, months, marks, and status fields
- Indexes for query performance

## API Overview

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Admin |
| POST | `/api/auth/login` | Login with username + password | None |
| GET | `/api/auth/me` | Get current user | Any |

### Students
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/students` | List students (search, filter) | Admin, Teacher |
| GET | `/api/students/:id` | Get student details | Any (students: own profile only) |
| POST | `/api/students` | Add student | Admin |
| PUT | `/api/students/:id` | Update student | Admin |
| DELETE | `/api/students/:id` | Delete student | Admin |

### Teachers
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/teachers` | List teachers | Admin |
| GET | `/api/teachers/:id` | Get teacher details | Admin |
| POST | `/api/teachers` | Add teacher | Admin |
| PUT | `/api/teachers/:id` | Update teacher | Admin |
| DELETE | `/api/teachers/:id` | Delete teacher | Admin |

### Routine (Weekly Class Schedule)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/routine` | View weekly routine | Any |
| POST | `/api/routine` | Add routine entry | Admin, Teacher |
| PUT | `/api/routine/:id` | Update routine entry | Admin, Teacher |
| DELETE | `/api/routine/:id` | Delete routine entry | Admin, Teacher |

### Batches
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/batches` | List batches | Any |
| GET | `/api/batches/:id` | Get batch with students | Any |
| POST | `/api/batches` | Create batch | Admin |
| PUT | `/api/batches/:id` | Update batch | Admin |
| DELETE | `/api/batches/:id` | Delete batch | Admin |

### Attendance
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/attendance` | List attendance | Any |
| POST | `/api/attendance` | Mark attendance (bulk) | Admin, Teacher |
| GET | `/api/attendance/summary/:studentId` | Student summary | Any |

### Fees
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/fees` | List fees | Any |
| POST | `/api/fees` | Create fee record | Admin |
| PUT | `/api/fees/:id` | Update fee record | Admin |
| GET | `/api/fees/summary` | Fee collection summary | Any |
| GET | `/api/fees/student/:studentId` | Student fee records | Any |
| GET | `/api/fees/pending-range` | Check pending fees for range | Any |
| POST | `/api/fees/record-range` | Record range payment | Admin, Teacher |

### Homework
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/homework` | List homework | Any |
| POST | `/api/homework` | Create homework | Admin, Teacher |
| PUT | `/api/homework/:id` | Update homework | Admin, Teacher |
| DELETE | `/api/homework/:id` | Delete homework | Admin, Teacher |

### Exams
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/exams` | List exams | Any |
| POST | `/api/exams` | Create exam | Admin, Teacher |

### Results
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/results` | List results | Any |
| POST | `/api/results` | Enter/update result | Admin, Teacher |
| GET | `/api/results/student/:studentId` | Student results | Any |

### Notices
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notices` | List notices | Any |
| POST | `/api/notices` | Create notice | Admin, Teacher |
| DELETE | `/api/notices/:id` | Delete notice | Admin, Teacher |

### Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/admin` | Admin dashboard | Admin |
| GET | `/api/dashboard/teacher` | Teacher dashboard | Teacher |
| GET | `/api/dashboard/student` | Student dashboard | Student |
| GET | `/api/dashboard/performance/:studentId` | Student performance | Admin, Teacher |

## Role Permissions

| Action | Admin | Teacher | Student |
|--------|-------|---------|---------|
| View Dashboard | Admin only | Teacher only | Student only |
| Manage Students | Yes | No | No |
| Manage Teachers | Yes | No | No |
| Manage Batches | Yes | No | No |
| Mark Attendance | Yes | Yes (assigned) | No |
| Manage Fees | Yes | Record payments | View only |
| Create Homework | Yes | Yes | No |
| Create Exams | Yes | Yes | No |
| Enter Results | Yes | Yes | No |
| Create Notices | Yes | Yes | No |

## Project Structure

```
tuition-management-system/
├── .gitignore
├── README.md
├── backend/
│   ├── .env                    # Environment variables (git-ignored)
│   ├── .env.example            # Environment template
│   ├── package.json
│   ├── server.js               # Express app entry point
│   ├── config/
│   │   └── db.js               # SQLite database setup & schema
│   ├── controllers/            # Route handler logic
│   ├── data/                   # SQLite database files (git-ignored)
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT auth & role authorization
│   │   └── errorMiddleware.js  # Global error handler
│   ├── models/                 # Data access layer (SQL queries)
│   ├── routes/                 # Express routers
│   └── utils/
│       └── seed.js             # Database seeding script
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css           # Global styles (light/dark themes)
        ├── components/         # Reusable UI components
        ├── context/            # React context providers
        ├── pages/              # Page components
        └── utils/
            └── api.js          # API client
```

## Deployment

### Render (recommended)

A `render.yaml` blueprint is included. The app deploys as ONE web service — Express serves both the API and the built React frontend from `frontend/dist/`.

1. Push this repository to GitHub
2. In Render, create a **Blueprint** from the repo (or a Web Service with the commands below)
3. Set environment variables in the Render dashboard:
   - `JWT_SECRET` (required, long random string)
   - `ADMIN_PASSWORD` (used only when seeding an empty database)
   - `CORS_ORIGIN` (your public URL, e.g. `https://your-app.onrender.com`)
   - `NODE_ENV=production`
   - `DATA_DIR=/data` (path of the persistent disk mount)
4. Attach a **persistent disk** (paid plans) mounted at `/data` so the SQLite file survives deploys

**Render build command:** `npm run build`
**Render start command:** `npm start`

> SQLite on the free Render tier lives on an ephemeral filesystem and resets on every deploy — use a paid plan with a disk for real data.

### Production Build (local)
```bash
cd frontend
npm run build
cd ../backend
NODE_ENV=production node server.js
```

The backend will serve the frontend from `frontend/dist/` at the root path.

### Environment Variables for Production
```env
JWT_SECRET=<strong-random-string>
ADMIN_PASSWORD=<initial-admin-password>
CORS_ORIGIN=https://your-app.onrender.com
PORT=5000
NODE_ENV=production
DATA_DIR=/data
```

## Troubleshooting

### Port already in use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <pid> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### Database initialization failure
Delete the database files and restart:
```bash
rm backend/data/database.sqlite*
cd backend
npm run seed
```

### Frontend cannot connect to backend
- Ensure the backend is running on port 5000
- Check that the Vite proxy is configured in `vite.config.js`

### Authentication problems
- Ensure JWT_SECRET is set in `.env`
- Verify you're using the correct username/password
- Check that the account is not deactivated

## MongoDB Removal

This project previously used MongoDB/MongoDB Atlas. It has been **fully migrated to SQLite**:

- **MongoDB Atlas / MONGO_URI**: Removed
- **Mongoose ODM**: Removed
- **MongoDB driver**: Removed
- **MongoDB-specific queries**: Replaced with parameterized SQL
- **MongoDB models**: Replaced with SQLite-backed model layer using `better-sqlite3`
- **Zero MongoDB dependencies** remain in `package.json` or source code
- All data is stored locally in `backend/data/database.sqlite`
