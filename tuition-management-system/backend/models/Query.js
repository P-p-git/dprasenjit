const { db } = require('../config/db');

const QUERY_CATEGORIES = ['Academic', 'Class', 'Fee', 'Technical', 'General'];

const Query = {
  _mapRow(row) {
    if (!row) return null;
    return {
      _id: row._id,
      student: row.student_id ? { _id: row.student_id, fullName: row.student_name, class: row.student_class } : null,
      category: row.category,
      message: row.message,
      status: row.status,
      reply: row.reply,
      repliedBy: row.replied_by ? { _id: row.replied_by, name: row.replier_name } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async find(conditions = {}) {
    let sql = `SELECT q.*, s._id as student_id, s.full_name as student_name, s.class as student_class,
                      u._id as replier_id, u.name as replier_name
               FROM queries q
               LEFT JOIN students s ON q.student_id = s._id
               LEFT JOIN users u ON q.replied_by = u._id
               WHERE 1=1`;
    const params = [];
    if (conditions.student) { sql += ' AND q.student_id = ?'; params.push(conditions.student); }
    if (conditions.status) { sql += ' AND q.status = ?'; params.push(conditions.status); }
    sql += ' ORDER BY q.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map(r => this._mapRow(r));
  },

  async findById(id) {
    const row = db.prepare(
      `SELECT q.*, s._id as student_id, s.full_name as student_name, s.class as student_class,
              u._id as replier_id, u.name as replier_name
       FROM queries q
       LEFT JOIN students s ON q.student_id = s._id
       LEFT JOIN users u ON q.replied_by = u._id
       WHERE q._id = ?`
    ).get(id);
    return this._mapRow(row);
  },

  async create(data) {
    const stmt = db.prepare(
      'INSERT INTO queries (student_id, category, message) VALUES (?, ?, ?)'
    );
    const result = stmt.run(data.student, data.category || 'General', data.message);
    return this.findById(result.lastInsertRowid);
  },

  async findByIdAndUpdate(id, updateData) {
    const fieldMap = { status: 'status', reply: 'reply', repliedBy: 'replied_by' };
    const fields = [];
    const params = [];
    for (const [key, val] of Object.entries(updateData)) {
      const col = fieldMap[key];
      if (col && val !== undefined) { fields.push(`${col} = ?`); params.push(val); }
    }
    if (fields.length === 0) return this.findById(id);
    fields.push("updated_at = datetime('now')");
    params.push(id);
    db.prepare(`UPDATE queries SET ${fields.join(', ')} WHERE _id = ?`).run(...params);
    return this.findById(id);
  },
};

module.exports = { Query, QUERY_CATEGORIES };
