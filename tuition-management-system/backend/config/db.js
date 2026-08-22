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
      email TEXT UNIQUE,
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
      email TEXT UNIQUE,
      phone TEXT DEFAULT '',
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
      email TEXT UNIQUE,
      phone TEXT DEFAULT '',
      parent_name TEXT DEFAULT '',
      parent_phone TEXT DEFAULT '',
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

    CREATE TABLE IF NOT EXISTS routine (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      day TEXT NOT NULL CHECK(day IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
      start_time TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL,
      teacher TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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

// Older databases were created with NOT NULL on personal contact fields
// (email/phone/parent fields). These must be optional. SQLite cannot alter a
// column constraint in place, so affected tables are rebuilt with the exact
// same columns and ALL existing rows copied over (data-preserving).
const NULLABLE_MIGRATIONS = {
  users: {
    checkColumns: ['email'],
    ddl: `CREATE TABLE users_new (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('admin', 'teacher', 'student')),
      is_active INTEGER NOT NULL DEFAULT 1,
      profile_id INTEGER,
      profile_model TEXT CHECK(profile_model IN ('Teacher', 'Student')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    copyColumns: '_id, name, username, email, password, role, is_active, profile_id, profile_model, created_at, updated_at',
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    ],
  },
  teachers: {
    checkColumns: ['email', 'phone'],
    ddl: `CREATE TABLE teachers_new (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT DEFAULT '',
      subject TEXT NOT NULL,
      qualification TEXT DEFAULT '',
      joining_date TEXT DEFAULT (date('now')),
      user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(_id) ON DELETE SET NULL
    )`,
    copyColumns: '_id, name, email, phone, subject, qualification, joining_date, user_id, created_at, updated_at',
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email)',
    ],
  },
  students: {
    checkColumns: ['email', 'phone', 'parent_name', 'parent_phone'],
    ddl: `CREATE TABLE students_new (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT DEFAULT '',
      parent_name TEXT DEFAULT '',
      parent_phone TEXT DEFAULT '',
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
    )`,
    copyColumns: '_id, full_name, email, phone, parent_name, parent_phone, address, class, batch_id, monthly_fee, joining_date, profile_image, user_id, created_at, updated_at',
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_students_email ON students(email)',
      'CREATE INDEX IF NOT EXISTS idx_students_class ON students(class)',
      'CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch_id)',
    ],
  },
};

function migrateNullableContactFields() {
  for (const [table, spec] of Object.entries(NULLABLE_MIGRATIONS)) {
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    if (info.length === 0) continue; // table does not exist yet

    const needsRebuild = info.some(
      (c) => spec.checkColumns.includes(c.name) && c.notnull === 1
    );
    if (!needsRebuild) continue;

    console.log(`Migration: Making contact fields optional on "${table}" (existing data preserved)...`);
    db.pragma('foreign_keys = OFF');
    try {
      db.transaction(() => {
        db.exec(spec.ddl);
        db.exec(
          `INSERT INTO ${table}_new (${spec.copyColumns}) SELECT ${spec.copyColumns} FROM ${table}`
        );
        db.exec(`DROP TABLE ${table}`);
        db.exec(`ALTER TABLE ${table}_new RENAME TO ${table}`);
        for (const idx of spec.indexes) db.exec(idx);
      })();
    } finally {
      db.pragma('foreign_keys = ON');
    }
    console.log(`Migration: "${table}" rebuilt with optional contact fields.`);
  }
}

function runMigrations() {
  migrateNullableContactFields();

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

  if (!columns.includes('mfa_enabled')) {
    console.log('Migration: Adding mfa_enabled column to users table...');
    db.exec(`ALTER TABLE users ADD COLUMN mfa_enabled INTEGER NOT NULL DEFAULT 0`);
  }

  if (!columns.includes('mfa_secret')) {
    console.log('Migration: Adding mfa_secret column to users table...');
    db.exec(`ALTER TABLE users ADD COLUMN mfa_secret TEXT`);
  }

  if (!columns.includes('mfa_verified')) {
    console.log('Migration: Adding mfa_verified column to users table...');
    db.exec(`ALTER TABLE users ADD COLUMN mfa_verified INTEGER NOT NULL DEFAULT 0`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      _id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(_id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_prt_hash ON password_reset_tokens(token_hash);
  `);
}

module.exports = { db, initializeDatabase };
