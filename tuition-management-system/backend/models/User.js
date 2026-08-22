const { db } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  async findOne(conditions = {}) {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    for (const [key, val] of Object.entries(conditions)) {
      if (key === 'username') { sql += ' AND username = ?'; params.push(val); }
      if (key === 'email') { sql += ' AND email = ?'; params.push(val); }
      if (key === '_id') { sql += ' AND _id = ?'; params.push(val); }
      if (key === 'role') { sql += ' AND role = ?'; params.push(val); }
    }
    const row = db.prepare(sql).get(...params);
    return row || null;
  },

  async findById(id) {
    const row = db.prepare('SELECT * FROM users WHERE _id = ?').get(id);
    return row || null;
  },

  async create(data) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const stmt = db.prepare(
      'INSERT INTO users (name, username, email, password, role, profile_id, profile_model) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      data.name,
      data.username || '',
      data.email,
      hashedPassword,
      data.role || 'student',
      data.profileId || null,
      data.profileModel || null
    );
    return this.findById(result.lastInsertRowid);
  },

  async findByIdAndUpdate(id, updateData) {
    const fields = [];
    const params = [];
    if (updateData.name !== undefined) { fields.push('name = ?'); params.push(updateData.name); }
    if (updateData.username !== undefined) { fields.push('username = ?'); params.push(updateData.username); }
    if (updateData.email !== undefined) { fields.push('email = ?'); params.push(updateData.email); }
    if (updateData.password !== undefined) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(updateData.password, salt);
      fields.push('password = ?');
      params.push(hashedPassword);
    }
    if (updateData.role !== undefined) { fields.push('role = ?'); params.push(updateData.role); }
    if (updateData.is_active !== undefined) { fields.push('is_active = ?'); params.push(updateData.is_active ? 1 : 0); }
    if (updateData.profileId !== undefined) { fields.push('profile_id = ?'); params.push(updateData.profileId); }
    if (updateData.profileModel !== undefined) { fields.push('profile_model = ?'); params.push(updateData.profileModel); }
    if (updateData.mfa_enabled !== undefined) { fields.push('mfa_enabled = ?'); params.push(updateData.mfa_enabled ? 1 : 0); }
    if (updateData.mfa_secret !== undefined) { fields.push('mfa_secret = ?'); params.push(updateData.mfa_secret); }
    if (updateData.mfa_verified !== undefined) { fields.push('mfa_verified = ?'); params.push(updateData.mfa_verified ? 1 : 0); }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = datetime('now')");
    params.push(id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE _id = ?`).run(...params);
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    const user = this.findById(id);
    if (user) {
      db.prepare('DELETE FROM users WHERE _id = ?').run(id);
    }
    return user;
  },

  async matchPassword(enteredPassword, hashedPassword) {
    return bcrypt.compare(enteredPassword, hashedPassword);
  },

  toJSON(user) {
    if (!user) return null;
    const { password, mfa_secret, ...rest } = user;
    rest.isActive = !!rest.is_active;
    delete rest.is_active;
    rest.mfaEnabled = !!rest.mfa_enabled;
    delete rest.mfa_enabled;
    rest.mfaVerified = !!rest.mfa_verified;
    delete rest.mfa_verified;
    return rest;
  }
};

module.exports = User;
