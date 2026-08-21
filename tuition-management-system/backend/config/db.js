const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('admin', 'teacher', 'student')),
      is_active INTEGER NOT NULL DEFAULT 1,
      profile_id INTEGER,
      profile_model TEXT CHECK(profile_model IN ('Teacher', 'Student')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teachers (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      subject TEXT NOT NULL,
      qualification TEXT DEFAULT '',
      joining_date TEXT DEFAULT (date('now')),
      user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS batches (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      class TEXT NOT NULL,
      subject TEXT NOT NULL,
      teacher_id INTEGER,
      days TEXT DEFAULT '[]',
      start_time TEXT DEFAULT '',
      end_time TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (teacher_id) REFERENCES teachers(_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      address TEXT DEFAULT '',
      class TEXT NOT NULL,
      batch_id INTEGER,
      monthly_fee REAL NOT NULL DEFAULT 0,
      joining_date TEXT DEFAULT (date('now')),
      profile_image TEXT DEFAULT '',
      user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (batch_id) REFERENCES batches(_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS attendance (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('present', 'absent')),
      marked_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(student_id, batch_id, date),
      FOREIGN KEY (student_id) REFERENCES students(_id) ON DELETE CASCADE,
      FOREIGN KEY (batch_id) REFERENCES batches(_id) ON DELETE CASCADE,
      FOREIGN KEY (marked_by) REFERENCES teachers(_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS fees (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
      year INTEGER NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('paid', 'pending')),
      payment_date TEXT,
      payment_method TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(student_id, month, year),
      FOREIGN KEY (student_id) REFERENCES students(_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS homework (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      subject TEXT NOT NULL,
      batch_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (batch_id) REFERENCES batches(_id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exams (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      batch_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      total_marks INTEGER NOT NULL CHECK(total_marks >= 1),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (batch_id) REFERENCES batches(_id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS results (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      exam_id INTEGER NOT NULL,
      marks INTEGER NOT NULL DEFAULT 0 CHECK(marks >= 0),
      total_marks INTEGER NOT NULL CHECK(total_marks >= 1),
      percentage REAL DEFAULT 0,
      grade TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(student_id, exam_id),
      FOREIGN KEY (student_id) REFERENCES students(_id) ON DELETE CASCADE,
      FOREIGN KEY (exam_id) REFERENCES exams(_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notices (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      batch_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(_id) ON DELETE CASCADE,
      FOREIGN KEY (batch_id) REFERENCES batches(_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS batch_students (
      batch_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      PRIMARY KEY (batch_id, student_id),
      FOREIGN KEY (batch_id) REFERENCES batches(_id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
    CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
    CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch_id);
    CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_batch ON attendance(batch_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
    CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
    CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);
    CREATE INDEX IF NOT EXISTS idx_fees_month_year ON fees(month, year);
    CREATE INDEX IF NOT EXISTS idx_homework_batch ON homework(batch_id);
    CREATE INDEX IF NOT EXISTS idx_homework_teacher ON homework(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_exams_batch ON exams(batch_id);
    CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
    CREATE INDEX IF NOT EXISTS idx_results_exam ON results(exam_id);
    CREATE INDEX IF NOT EXISTS idx_notices_batch ON notices(batch_id);
  `);

  runMigrations();

  console.log('SQLite database initialized successfully');
}

function runMigrations() {
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  const columns = tableInfo.map(c => c.name);

  if (!columns.includes('username')) {
    console.log('Migration: Adding username column to users table...');
    db.exec(`ALTER TABLE users ADD COLUMN username TEXT NOT NULL DEFAULT ''`);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  }

  if (!columns.includes('is_active')) {
    console.log('Migration: Adding is_active column to users table...');
    db.exec(`ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`);
  }
}

module.exports = { db, initializeDatabase };
