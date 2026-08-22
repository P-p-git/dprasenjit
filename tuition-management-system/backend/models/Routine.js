const { db } = require('../config/db');

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Routine = {
  _mapRow(row) {
    if (!row) return null;
    return {
      _id: row._id,
      day: row.day,
      startTime: row.start_time,
      subject: row.subject,
      teacher: row.teacher,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async find() {
    const rows = db.prepare(
      `SELECT * FROM routine
       ORDER BY CASE day
         ${WEEK_DAYS.map((d, i) => `WHEN '${d}' THEN ${i}`).join(' ')}
       END, start_time`
    ).all();
    return rows.map(r => this._mapRow(r));
  },

  async findById(id) {
    const row = db.prepare('SELECT * FROM routine WHERE _id = ?').get(id);
    return this._mapRow(row);
  },

  async create(data) {
    const stmt = db.prepare(
      'INSERT INTO routine (day, start_time, subject, teacher) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(data.day, data.startTime || '', data.subject, data.teacher || '');
    return this.findById(result.lastInsertRowid);
  },

  async findByIdAndUpdate(id, updateData) {
    const fieldMap = { day: 'day', startTime: 'start_time', subject: 'subject', teacher: 'teacher' };
    const fields = [];
    const params = [];
    for (const [key, val] of Object.entries(updateData)) {
      const col = fieldMap[key];
      if (col && val !== undefined) { fields.push(`${col} = ?`); params.push(val); }
    }
    if (fields.length === 0) return this.findById(id);
    fields.push("updated_at = datetime('now')");
    params.push(id);
    db.prepare(`UPDATE routine SET ${fields.join(', ')} WHERE _id = ?`).run(...params);
    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    const routine = this.findById(id);
    if (routine) {
      db.prepare('DELETE FROM routine WHERE _id = ?').run(id);
    }
    return routine;
  },
};

module.exports = { Routine, WEEK_DAYS };
