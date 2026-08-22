const { db } = require('../config/db');

const Student = {
  _mapRow(row) {
    if (!row) return null;
    return {
      _id: row._id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      parentName: row.parent_name,
      parentPhone: row.parent_phone,
      address: row.address,
      class: row.class,
      batch: row.batch_id ? { _id: row.batch_id, name: row.batch_name, subject: row.batch_subject } : null,
      monthlyFee: row.monthly_fee,
      joiningDate: row.joining_date,
      profileImage: row.profile_image,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  _mapRowWithBatch(row) {
    if (!row) return null;
    const result = {
      _id: row._id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      parentName: row.parent_name,
      parentPhone: row.parent_phone,
      address: row.address,
      class: row.class,
      monthlyFee: row.monthly_fee,
      joiningDate: row.joining_date,
      profileImage: row.profile_image,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    if (row.batch_id) {
      result.batch = { _id: row.batch_id, name: row.batch_name, subject: row.batch_subject };
    } else {
      result.batch = null;
    }
    return result;
  },

  async find(conditions = {}) {
    let sql = `SELECT s.*, b._id as batch_id, b.name as batch_name, b.subject as batch_subject
               FROM students s LEFT JOIN batches b ON s.batch_id = b._id WHERE 1=1`;
    const params = [];

    if (conditions.$or && Array.isArray(conditions.$or)) {
      const orParts = [];
      for (const cond of conditions.$or) {
        if (cond.fullName && cond.fullName.$regex) {
          orParts.push('s.full_name LIKE ?');
          params.push(`%${cond.fullName.$regex}%`);
        }
        if (cond.email && cond.email.$regex) {
          orParts.push('s.email LIKE ?');
          params.push(`%${cond.email.$regex}%`);
        }
      }
      if (orParts.length > 0) sql += ` AND (${orParts.join(' OR ')})`;
    }

    if (conditions.class) { sql += ' AND s.class = ?'; params.push(conditions.class); }
    if (conditions.batch) { sql += ' AND s.batch_id = ?'; params.push(conditions.batch); }

    const rows = db.prepare(sql).all(...params);
    return rows.map(r => this._mapRowWithBatch(r));
  },

  async findById(id) {
    const row = db.prepare(
      `SELECT s.*, b._id as batch_id, b.name as batch_name, b.subject as batch_subject
       FROM students s LEFT JOIN batches b ON s.batch_id = b._id WHERE s._id = ?`
    ).get(id);
    return this._mapRowWithBatch(row);
  },

  async findOneByEmail(email) {
    if (!email) return null;
    const row = db.prepare('SELECT _id FROM students WHERE email = ? COLLATE NOCASE').get(String(email));
    return row || null;
  },

  async create(data) {
    const stmt = db.prepare(
      `INSERT INTO students (full_name, email, phone, parent_name, parent_phone, address, class, batch_id, monthly_fee, joining_date, profile_image, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.fullName,
      data.email,
      data.phone,
      data.parentName,
      data.parentPhone,
      data.address || '',
      data.class,
      data.batch || null,
      data.monthlyFee || 0,
      data.joiningDate || new Date().toISOString().split('T')[0],
      data.profileImage || '',
      data.userId || null
    );
    return this.findById(result.lastInsertRowid);
  },

  async findByIdAndUpdate(id, updateData) {
    const fieldMap = {
      fullName: 'full_name', email: 'email', phone: 'phone',
      parentName: 'parent_name', parentPhone: 'parent_phone',
      address: 'address', class: 'class', batch: 'batch_id',
      monthlyFee: 'monthly_fee', joiningDate: 'joining_date',
      profileImage: 'profile_image', userId: 'user_id',
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
    db.prepare(`UPDATE students SET ${fields.join(', ')} WHERE _id = ?`).run(...params);
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    const student = this.findById(id);
    if (student) {
      db.prepare('DELETE FROM students WHERE _id = ?').run(id);
    }
    return student;
  },

  async countDocuments() {
    const row = db.prepare('SELECT COUNT(*) as count FROM students').get();
    return row.count;
  },
};

module.exports = Student;
