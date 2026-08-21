const { db } = require('../config/db');

const Teacher = {
  _mapRow(row) {
    if (!row) return null;
    return {
      _id: row._id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      subject: row.subject,
      qualification: row.qualification,
      joiningDate: row.joining_date,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async find(conditions = {}) {
    let sql = 'SELECT * FROM teachers WHERE 1=1';
    const params = [];
    if (conditions.userId) { sql += ' AND user_id = ?'; params.push(conditions.userId); }
    const rows = db.prepare(sql).all(...params);
    return rows.map(r => this._mapRow(r));
  },

  async findById(id) {
    const row = db.prepare('SELECT * FROM teachers WHERE _id = ?').get(id);
    return this._mapRow(row);
  },

  async create(data) {
    const stmt = db.prepare(
      `INSERT INTO teachers (name, email, phone, subject, qualification, joining_date, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.name, data.email, data.phone, data.subject,
      data.qualification || '',
      data.joiningDate || new Date().toISOString().split('T')[0],
      data.userId || null
    );
    return this.findById(result.lastInsertRowid);
  },

  async findByIdAndUpdate(id, updateData) {
    const fieldMap = {
      name: 'name', email: 'email', phone: 'phone', subject: 'subject',
      qualification: 'qualification', joiningDate: 'joining_date', userId: 'user_id',
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
    db.prepare(`UPDATE teachers SET ${fields.join(', ')} WHERE _id = ?`).run(...params);
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    const teacher = this.findById(id);
    if (teacher) {
      db.prepare('DELETE FROM teachers WHERE _id = ?').run(id);
    }
    return teacher;
  },

  async countDocuments() {
    const row = db.prepare('SELECT COUNT(*) as count FROM teachers').get();
    return row.count;
  },
};

module.exports = Teacher;
