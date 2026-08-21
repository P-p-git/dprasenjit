const { db } = require('../config/db');

function computeGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  return 'D';
}

const Result = {
  _mapRow(row) {
    if (!row) return null;
    return {
      _id: row._id,
      student: row.student_id ? { _id: row.student_id, fullName: row.student_name, class: row.student_class } : null,
      exam: row.exam_id ? { _id: row.exam_id, name: row.exam_name, subject: row.exam_subject, totalMarks: row.exam_total_marks, date: row.exam_date } : null,
      marks: row.marks,
      totalMarks: row.total_marks,
      percentage: row.percentage,
      grade: row.grade,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async find(conditions = {}) {
    let sql = `SELECT r.*,
               s._id as student_id, s.full_name as student_name, s.class as student_class,
               e._id as exam_id, e.name as exam_name, e.subject as exam_subject, e.total_marks as exam_total_marks, e.date as exam_date
               FROM results r
               LEFT JOIN students s ON r.student_id = s._id
               LEFT JOIN exams e ON r.exam_id = e._id
               WHERE 1=1`;
    const params = [];
    if (conditions.exam) { sql += ' AND r.exam_id = ?'; params.push(conditions.exam); }
    if (conditions.student) { sql += ' AND r.student_id = ?'; params.push(conditions.student); }
    sql += ' ORDER BY r.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map(r => this._mapRow(r));
  },

  async findOne(conditions) {
    let sql = 'SELECT * FROM results WHERE 1=1';
    const params = [];
    if (conditions.student) { sql += ' AND student_id = ?'; params.push(conditions.student); }
    if (conditions.exam) { sql += ' AND exam_id = ?'; params.push(conditions.exam); }
    const row = db.prepare(sql).get(...params);
    return row || null;
  },

  async create(data) {
    const percentage = data.totalMarks > 0 ? Math.round((data.marks / data.totalMarks) * 100) : 0;
    const grade = computeGrade(percentage);
    const stmt = db.prepare(
      `INSERT INTO results (student_id, exam_id, marks, total_marks, percentage, grade)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      data.student, data.exam, data.marks, data.totalMarks,
      percentage, grade
    );
    return this._mapRow(db.prepare(
      `SELECT r.*,
       s._id as student_id, s.full_name as student_name, s.class as student_class,
       e._id as exam_id, e.name as exam_name, e.subject as exam_subject, e.total_marks as exam_total_marks, e.date as exam_date
       FROM results r
       LEFT JOIN students s ON r.student_id = s._id
       LEFT JOIN exams e ON r.exam_id = e._id
       WHERE r._id = ?`
    ).get(result.lastInsertRowid));
  },

  async findOneAndUpdate(conditions, updateData) {
    const existing = await this.findOne(conditions);
    if (existing) {
      const percentage = updateData.totalMarks > 0 ? Math.round((updateData.marks / updateData.totalMarks) * 100) : 0;
      const grade = computeGrade(percentage);
      db.prepare(
        `UPDATE results SET marks = ?, total_marks = ?, percentage = ?, grade = ?, updated_at = datetime('now')
         WHERE _id = ?`
      ).run(updateData.marks, updateData.totalMarks, percentage, grade, existing._id);
    } else {
      await this.create({
        student: conditions.student,
        exam: conditions.exam,
        marks: updateData.marks,
        totalMarks: updateData.totalMarks,
      });
    }
    const result = await this.findOne(conditions);
    return this._mapRow(db.prepare(
      `SELECT r.*,
       s._id as student_id, s.full_name as student_name, s.class as student_class,
       e._id as exam_id, e.name as exam_name, e.subject as exam_subject, e.total_marks as exam_total_marks, e.date as exam_date
       FROM results r
       LEFT JOIN students s ON r.student_id = s._id
       LEFT JOIN exams e ON r.exam_id = e._id
       WHERE r.student_id = ? AND r.exam_id = ?`
    ).get(conditions.student, conditions.exam));
  },
};

module.exports = Result;
