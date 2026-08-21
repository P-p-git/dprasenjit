const { db } = require('../config/db');

const Fee = {
  _mapRow(row) {
    if (!row) return null;
    return {
      _id: row._id,
      student: row.student_id ? { _id: row.student_id, fullName: row.student_name, class: row.student_class } : null,
      month: row.month,
      year: row.year,
      amount: row.amount,
      status: row.status,
      paymentDate: row.payment_date,
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  _mapRowBasic(row) {
    if (!row) return null;
    return {
      _id: row._id,
      studentId: row.student_id,
      month: row.month,
      year: row.year,
      amount: row.amount,
      status: row.status,
      paymentDate: row.payment_date,
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async find(conditions = {}) {
    let sql = `SELECT f.*,
               s._id as student_id, s.full_name as student_name, s.class as student_class
               FROM fees f
               LEFT JOIN students s ON f.student_id = s._id
               WHERE 1=1`;
    const params = [];
    if (conditions.status) { sql += ' AND f.status = ?'; params.push(conditions.status); }
    if (conditions.month) { sql += ' AND f.month = ?'; params.push(conditions.month); }
    if (conditions.year) { sql += ' AND f.year = ?'; params.push(conditions.year); }
    if (conditions.student) { sql += ' AND f.student_id = ?'; params.push(conditions.student); }
    sql += ' ORDER BY f.year DESC, f.month DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map(r => this._mapRow(r));
  },

  async findById(id) {
    const row = db.prepare(
      `SELECT f.*,
       s._id as student_id, s.full_name as student_name, s.class as student_class
       FROM fees f LEFT JOIN students s ON f.student_id = s._id WHERE f._id = ?`
    ).get(id);
    return this._mapRow(row);
  },

  async findOne(conditions) {
    let sql = 'SELECT * FROM fees WHERE 1=1';
    const params = [];
    if (conditions.student) { sql += ' AND student_id = ?'; params.push(conditions.student); }
    if (conditions.month) { sql += ' AND month = ?'; params.push(conditions.month); }
    if (conditions.year) { sql += ' AND year = ?'; params.push(conditions.year); }
    const row = db.prepare(sql).get(...params);
    return row ? this._mapRowBasic(row) : null;
  },

  async create(data) {
    const stmt = db.prepare(
      `INSERT INTO fees (student_id, month, year, amount, status, payment_date, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.student, data.month, data.year, data.amount,
      data.status || 'pending',
      data.paymentDate || null,
      data.paymentMethod || ''
    );
    return this.findById(result.lastInsertRowid);
  },

  async findByIdAndUpdate(id, updateData) {
    const fieldMap = {
      status: 'status', paymentDate: 'payment_date', paymentMethod: 'payment_method',
      amount: 'amount', month: 'month', year: 'year',
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
    db.prepare(`UPDATE fees SET ${fields.join(', ')} WHERE _id = ?`).run(...params);
    return this.findById(id);
  },

  async countDocuments(conditions = {}) {
    let sql = 'SELECT COUNT(*) as count FROM fees WHERE 1=1';
    const params = [];
    if (conditions.status) { sql += ' AND status = ?'; params.push(conditions.status); }
    if (conditions.student) { sql += ' AND student_id = ?'; params.push(conditions.student); }
    const row = db.prepare(sql).get(...params);
    return row.count;
  },
};

module.exports = Fee;
