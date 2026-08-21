const { db } = require('../config/db');

const Attendance = {
  _mapRow(row) {
    if (!row) return null;
    return {
      _id: row._id,
      student: row.student_id ? { _id: row.student_id, fullName: row.student_name } : null,
      batch: row.batch_id ? { _id: row.batch_id, name: row.batch_name } : null,
      date: row.date,
      status: row.status,
      markedBy: row.marked_by ? { _id: row.marked_by, name: row.marked_by_name } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async find(conditions = {}) {
    let sql = `SELECT a.*,
               s._id as student_id, s.full_name as student_name,
               b._id as batch_id, b.name as batch_name,
               t._id as marked_by, t.name as marked_by_name
               FROM attendance a
               LEFT JOIN students s ON a.student_id = s._id
               LEFT JOIN batches b ON a.batch_id = b._id
               LEFT JOIN teachers t ON a.marked_by = t._id
               WHERE 1=1`;
    const params = [];
    if (conditions.batch) { sql += ' AND a.batch_id = ?'; params.push(conditions.batch); }
    if (conditions.date) { sql += ' AND a.date = ?'; params.push(conditions.date); }
    if (conditions.student) { sql += ' AND a.student_id = ?'; params.push(conditions.student); }
    sql += ' ORDER BY a.date DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map(r => this._mapRow(r));
  },

  async findOne(conditions = {}) {
    let sql = `SELECT a.*,
               s._id as student_id, s.full_name as student_name,
               b._id as batch_id, b.name as batch_name,
               t._id as marked_by, t.name as marked_by_name
               FROM attendance a
               LEFT JOIN students s ON a.student_id = s._id
               LEFT JOIN batches b ON a.batch_id = b._id
               LEFT JOIN teachers t ON a.marked_by = t._id
               WHERE 1=1`;
    const params = [];
    if (conditions.student) { sql += ' AND a.student_id = ?'; params.push(conditions.student); }
    if (conditions.batch) { sql += ' AND a.batch_id = ?'; params.push(conditions.batch); }
    if (conditions.date) { sql += ' AND a.date = ?'; params.push(conditions.date); }
    const row = db.prepare(sql).get(...params);
    return this._mapRow(row);
  },

  async findOneAndUpdate(conditions, updateData, options = {}) {
    const existing = await this.findOne(conditions);
    if (existing && !options.upsert) {
      const fields = [];
      const params = [];
      if (updateData.status) { fields.push('status = ?'); params.push(updateData.status); }
      if (updateData.markedBy !== undefined) { fields.push('marked_by = ?'); params.push(updateData.markedBy); }
      if (fields.length > 0) {
        fields.push("updated_at = datetime('now')");
        params.push(existing._id);
        db.prepare(`UPDATE attendance SET ${fields.join(', ')} WHERE _id = ?`).run(...params);
      }
      return this.findOne({ student: conditions.student, batch: conditions.batch, date: conditions.date });
    }

    if (options.upsert && !existing) {
      const stmt = db.prepare(
        `INSERT INTO attendance (student_id, batch_id, date, status, marked_by)
         VALUES (?, ?, ?, ?, ?)`
      );
      const result = stmt.run(
        conditions.student, conditions.batch, conditions.date,
        updateData.status, updateData.markedBy || null
      );
      return this.findOne({ student: conditions.student, batch: conditions.batch, date: conditions.date });
    }

    return existing;
  },

  async countDocuments(conditions = {}) {
    let sql = 'SELECT COUNT(*) as count FROM attendance WHERE 1=1';
    const params = [];
    if (conditions.student) { sql += ' AND student_id = ?'; params.push(conditions.student); }
    const row = db.prepare(sql).get(...params);
    return row.count;
  },
};

module.exports = Attendance;
