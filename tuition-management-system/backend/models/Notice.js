const { db } = require('../config/db');

const Notice = {
  _mapRow(row) {
    if (!row) return null;
    return {
      _id: row._id,
      title: row.title,
      description: row.description,
      createdBy: row.created_by_id ? { _id: row.created_by_id, name: row.created_by_name, role: row.created_by_role } : null,
      batch: row.batch_id ? { _id: row.batch_id, name: row.batch_name } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async find(conditions = {}) {
    let sql = `SELECT n.*,
               u._id as created_by_id, u.name as created_by_name, u.role as created_by_role,
               b._id as batch_id, b.name as batch_name
               FROM notices n
               LEFT JOIN users u ON n.created_by = u._id
               LEFT JOIN batches b ON n.batch_id = b._id
               WHERE 1=1`;
    const params = [];
    if (conditions.batch) {
      sql += ' AND (n.batch_id = ? OR n.batch_id IS NULL)';
      params.push(conditions.batch);
    }
    sql += ' ORDER BY n.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map(r => this._mapRow(r));
  },

  async findById(id) {
    const row = db.prepare(
      `SELECT n.*,
       u._id as created_by_id, u.name as created_by_name, u.role as created_by_role,
       b._id as batch_id, b.name as batch_name
       FROM notices n
       LEFT JOIN users u ON n.created_by = u._id
       LEFT JOIN batches b ON n.batch_id = b._id
       WHERE n._id = ?`
    ).get(id);
    return this._mapRow(row);
  },

  async create(data) {
    const stmt = db.prepare(
      `INSERT INTO notices (title, description, created_by, batch_id)
       VALUES (?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.title, data.description, data.createdBy,
      data.batch || null
    );
    return this.findById(result.lastInsertRowid);
  },

  async findByIdAndDelete(id) {
    const notice = this.findById(id);
    if (notice) {
      db.prepare('DELETE FROM notices WHERE _id = ?').run(id);
    }
    return notice;
  },
};

module.exports = Notice;
