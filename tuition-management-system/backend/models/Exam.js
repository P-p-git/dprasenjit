const { db } = require('../config/db');

const Exam = {
  _mapRow(row) {
    if (!row) return null;
    return {
      _id: row._id,
      name: row.name,
      subject: row.subject,
      batch: row.batch_id ? { _id: row.batch_id, name: row.batch_name } : null,
      teacher: row.teacher_id ? { _id: row.teacher_id, name: row.teacher_name } : null,
      date: row.date,
      totalMarks: row.total_marks,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async find(conditions = {}) {
    let sql = `SELECT e.*,
               b._id as batch_id, b.name as batch_name,
               t._id as teacher_id, t.name as teacher_name
               FROM exams e
               LEFT JOIN batches b ON e.batch_id = b._id
               LEFT JOIN teachers t ON e.teacher_id = t._id
               WHERE 1=1`;
    const params = [];
    if (conditions.batch) { sql += ' AND e.batch_id = ?'; params.push(conditions.batch); }
    if (conditions.subject) { sql += ' AND e.subject = ?'; params.push(conditions.subject); }
    if (conditions.teacher) { sql += ' AND e.teacher_id = ?'; params.push(conditions.teacher); }
    if (conditions.date && conditions.date.$gte) { sql += ' AND e.date >= ?'; params.push(conditions.date.$gte); }
    sql += ' ORDER BY e.date DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map(r => this._mapRow(r));
  },

  async findById(id) {
    const row = db.prepare(
      `SELECT e.*,
       b._id as batch_id, b.name as batch_name,
       t._id as teacher_id, t.name as teacher_name
       FROM exams e
       LEFT JOIN batches b ON e.batch_id = b._id
       LEFT JOIN teachers t ON e.teacher_id = t._id
       WHERE e._id = ?`
    ).get(id);
    return this._mapRow(row);
  },

  async create(data) {
    const stmt = db.prepare(
      `INSERT INTO exams (name, subject, batch_id, teacher_id, date, total_marks)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.name, data.subject, data.batch, data.teacher,
      data.date, data.totalMarks
    );
    return this.findById(result.lastInsertRowid);
  },

  async countDocuments(conditions = {}) {
    let sql = 'SELECT COUNT(*) as count FROM exams WHERE 1=1';
    const params = [];
    if (conditions.batch) { sql += ' AND batch_id = ?'; params.push(conditions.batch); }
    if (conditions.teacher) { sql += ' AND teacher_id = ?'; params.push(conditions.teacher); }
    const row = db.prepare(sql).get(...params);
    return row.count;
  },
};

module.exports = Exam;
