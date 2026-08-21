const { db } = require('../config/db');

const Homework = {
  _mapRow(row) {
    if (!row) return null;
    return {
      _id: row._id,
      title: row.title,
      description: row.description,
      subject: row.subject,
      batch: row.batch_id ? { _id: row.batch_id, name: row.batch_name } : null,
      teacher: row.teacher_id ? { _id: row.teacher_id, name: row.teacher_name } : null,
      dueDate: row.due_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async find(conditions = {}) {
    let sql = `SELECT h.*,
               b._id as batch_id, b.name as batch_name,
               t._id as teacher_id, t.name as teacher_name
               FROM homework h
               LEFT JOIN batches b ON h.batch_id = b._id
               LEFT JOIN teachers t ON h.teacher_id = t._id
               WHERE 1=1`;
    const params = [];
    if (conditions.batch) { sql += ' AND h.batch_id = ?'; params.push(conditions.batch); }
    if (conditions.subject) { sql += ' AND h.subject = ?'; params.push(conditions.subject); }
    if (conditions.teacher) { sql += ' AND h.teacher_id = ?'; params.push(conditions.teacher); }
    sql += ' ORDER BY h.due_date DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map(r => this._mapRow(r));
  },

  async findById(id) {
    const row = db.prepare(
      `SELECT h.*,
       b._id as batch_id, b.name as batch_name,
       t._id as teacher_id, t.name as teacher_name
       FROM homework h
       LEFT JOIN batches b ON h.batch_id = b._id
       LEFT JOIN teachers t ON h.teacher_id = t._id
       WHERE h._id = ?`
    ).get(id);
    return this._mapRow(row);
  },

  async create(data) {
    const stmt = db.prepare(
      `INSERT INTO homework (title, description, subject, batch_id, teacher_id, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.title, data.description || '', data.subject,
      data.batch, data.teacher, data.dueDate
    );
    return this.findById(result.lastInsertRowid);
  },

  async findByIdAndUpdate(id, updateData) {
    const fieldMap = {
      title: 'title', description: 'description', subject: 'subject',
      batch: 'batch_id', teacher: 'teacher_id', dueDate: 'due_date',
    };
    const fields = [];
    const params = [];
    for (const [key, val] of Object.entries(updateData)) {
      const col = fieldMap[key];
      if (col && val !== undefined) { fields.push(`${col} = ?`); params.push(val); }
    }
    if (fields.length === 0) return this.findById(id);
    fields.push("updated_at = datetime('now')");
    params.push(id);
    db.prepare(`UPDATE homework SET ${fields.join(', ')} WHERE _id = ?`).run(...params);
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    const hw = this.findById(id);
    if (hw) { db.prepare('DELETE FROM homework WHERE _id = ?').run(id); }
    return hw;
  },

  async countDocuments(conditions = {}) {
    let sql = 'SELECT COUNT(*) as count FROM homework WHERE 1=1';
    const params = [];
    if (conditions.batch) { sql += ' AND batch_id = ?'; params.push(conditions.batch); }
    if (conditions.teacher) { sql += ' AND teacher_id = ?'; params.push(conditions.teacher); }
    const row = db.prepare(sql).get(...params);
    return row.count;
  },
};

module.exports = Homework;
