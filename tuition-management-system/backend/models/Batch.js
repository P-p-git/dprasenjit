const { db } = require('../config/db');

const Batch = {
  _mapRowWithJoins(row) {
    if (!row) return null;
    return {
      _id: row._id,
      name: row.name,
      class: row.class,
      subject: row.subject,
      teacher: row.teacher_id ? { _id: row.teacher_id, name: row.teacher_name, subject: row.teacher_subject } : null,
      days: row.days ? JSON.parse(row.days) : [],
      startTime: row.start_time,
      endTime: row.end_time,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  _mapRowBasic(row) {
    if (!row) return null;
    return {
      _id: row._id,
      name: row.name,
      class: row.class,
      subject: row.subject,
      teacherId: row.teacher_id,
      days: row.days ? JSON.parse(row.days) : [],
      startTime: row.start_time,
      endTime: row.end_time,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async find(conditions = {}) {
    let sql = `SELECT b.*, t._id as teacher_id, t.name as teacher_name, t.subject as teacher_subject
               FROM batches b LEFT JOIN teachers t ON b.teacher_id = t._id WHERE 1=1`;
    const params = [];
    if (conditions.teacher) { sql += ' AND b.teacher_id = ?'; params.push(conditions.teacher); }
    const rows = db.prepare(sql).all(...params);

    const batches = rows.map(r => {
      const batch = this._mapRowWithJoins(r);
      batch.students = this._getBatchStudents(batch._id);
      return batch;
    });
    return batches;
  },

  async findById(id) {
    const row = db.prepare(
      `SELECT b.*, t._id as teacher_id, t.name as teacher_name, t.subject as teacher_subject
       FROM batches b LEFT JOIN teachers t ON b.teacher_id = t._id WHERE b._id = ?`
    ).get(id);
    if (!row) return null;
    const batch = this._mapRowWithJoins(row);
    batch.students = this._getBatchStudentsDetailed(batch._id);
    return batch;
  },

  _getBatchStudents(batchId) {
    const rows = db.prepare(
      `SELECT s._id, s.full_name FROM students s
       INNER JOIN batch_students bs ON s._id = bs.student_id
       WHERE bs.batch_id = ?`
    ).all(batchId);
    return rows.map(r => ({ _id: r._id, fullName: r.full_name }));
  },

  _getBatchStudentsDetailed(batchId) {
    const rows = db.prepare(
      `SELECT s._id, s.full_name, s.email, s.phone, s.class FROM students s
       INNER JOIN batch_students bs ON s._id = bs.student_id
       WHERE bs.batch_id = ?`
    ).all(batchId);
    return rows.map(r => ({ _id: r._id, fullName: r.full_name, email: r.email, phone: r.phone, class: r.class }));
  },

  async create(data) {
    const stmt = db.prepare(
      `INSERT INTO batches (name, class, subject, teacher_id, days, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const daysJson = Array.isArray(data.days) ? JSON.stringify(data.days) : (data.days || '[]');
    const result = stmt.run(
      data.name, data.class, data.subject,
      data.teacher || null,
      daysJson,
      data.startTime || '',
      data.endTime || ''
    );

    if (data.students && Array.isArray(data.students)) {
      const insertStudent = db.prepare('INSERT OR IGNORE INTO batch_students (batch_id, student_id) VALUES (?, ?)');
      for (const studentId of data.students) {
        insertStudent.run(result.lastInsertRowid, studentId);
      }
    }

    return this.findById(result.lastInsertRowid);
  },

  async findByIdAndUpdate(id, updateData) {
    const fieldMap = {
      name: 'name', class: 'class', subject: 'subject',
      teacher: 'teacher_id', startTime: 'start_time', endTime: 'end_time',
    };
    const fields = [];
    const params = [];
    for (const [key, val] of Object.entries(updateData)) {
      const col = fieldMap[key];
      if (col && key !== 'days' && key !== 'students') { fields.push(`${col} = ?`); params.push(val); }
    }
    if (updateData.days !== undefined) {
      const daysJson = Array.isArray(updateData.days) ? JSON.stringify(updateData.days) : updateData.days;
      fields.push('days = ?');
      params.push(daysJson);
    }
    if (fields.length === 0) return this.findById(id);
    fields.push("updated_at = datetime('now')");
    params.push(id);
    db.prepare(`UPDATE batches SET ${fields.join(', ')} WHERE _id = ?`).run(...params);
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    const batch = this.findById(id);
    if (batch) {
      db.prepare('DELETE FROM batches WHERE _id = ?').run(id);
    }
    return batch;
  },

  async addStudent(batchId, studentId) {
    db.prepare('INSERT OR IGNORE INTO batch_students (batch_id, student_id) VALUES (?, ?)').run(batchId, studentId);
    return this.findById(batchId);
  },

  async removeStudent(batchId, studentId) {
    db.prepare('DELETE FROM batch_students WHERE batch_id = ? AND student_id = ?').run(batchId, studentId);
    return this.findById(batchId);
  },

  async hasStudent(batchId, studentId) {
    const row = db.prepare('SELECT 1 FROM batch_students WHERE batch_id = ? AND student_id = ?').get(batchId, studentId);
    return !!row;
  },

  async countDocuments() {
    const row = db.prepare('SELECT COUNT(*) as count FROM batches').get();
    return row.count;
  },

  async updateMany(conditions, update) {
    if (update.$unset && update.$unset.teacher) {
      db.prepare('UPDATE batches SET teacher_id = NULL WHERE teacher_id = ?').run(conditions.teacher);
    }
  },

  async removeStudentFromAll(studentId) {
    db.prepare('DELETE FROM batch_students WHERE student_id = ?').run(studentId);
  },
};

module.exports = Batch;
