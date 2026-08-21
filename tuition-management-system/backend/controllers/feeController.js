const Fee = require('../models/Fee');
const Student = require('../models/Student');
const { db } = require('../config/db');

const getFees = async (req, res) => {
  try {
    const { status, month, year, student } = req.query;
    let conditions = {};

    if (status) conditions.status = status;
    if (month) conditions.month = parseInt(month);
    if (year) conditions.year = parseInt(year);
    if (student) conditions.student = student;

    const fees = await Fee.find(conditions);
    res.json({ success: true, count: fees.length, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createFee = async (req, res) => {
  try {
    const { student, month, year, amount, status, paymentDate, paymentMethod } = req.body;

    const existing = await Fee.findOne({ student, month, year });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Fee record already exists for this student and month' });
    }

    const fee = await Fee.create({
      student, month, year, amount, status, paymentDate, paymentMethod,
    });

    res.status(201).json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateFee = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.status === 'paid' && !updateData.paymentDate) {
      updateData.paymentDate = new Date().toISOString();
    }

    const fee = await Fee.findByIdAndUpdate(req.params.id, updateData);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    res.json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFeeSummary = async (req, res) => {
  try {
    const paidRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fees WHERE status = 'paid'").get();
    const pendingRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fees WHERE status = 'pending'").get();
    const paidCountRow = db.prepare("SELECT COUNT(*) as count FROM fees WHERE status = 'paid'").get();
    const pendingCountRow = db.prepare("SELECT COUNT(*) as count FROM fees WHERE status = 'pending'").get();

    res.json({
      success: true,
      data: {
        totalCollected: paidRow.total,
        totalPending: pendingRow.total,
        paidCount: paidCountRow.count,
        pendingCount: pendingCountRow.count,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentFees = async (req, res) => {
  try {
    const fees = await Fee.find({ student: req.params.studentId });
    res.json({ success: true, count: fees.length, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPendingFeesRange = async (req, res) => {
  try {
    const { studentId, fromMonth, fromYear, toMonth, toYear } = req.query;

    if (!studentId || !fromMonth || !fromYear || !toMonth || !toYear) {
      return res.status(400).json({ success: false, message: 'Please provide studentId, fromMonth, fromYear, toMonth, toYear' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const from = { month: parseInt(fromMonth), year: parseInt(fromYear) };
    const to = { month: parseInt(toMonth), year: parseInt(toYear) };

    if (from.year > to.year || (from.year === to.year && from.month > to.month)) {
      return res.status(400).json({ success: false, message: 'Invalid date range. From date must be before to date.' });
    }

    const months = [];
    let m = from.month;
    let y = from.year;
    while (y < to.year || (y === to.year && m <= to.month)) {
      months.push({ month: m, year: y });
      m++;
      if (m > 12) { m = 1; y++; }
    }

    const existingFees = db.prepare(
      'SELECT * FROM fees WHERE student_id = ? AND ((year = ? AND month >= ?) OR (year = ? AND month <= ?) OR (year > ? AND year < ?)) ORDER BY year, month'
    ).all(studentId, from.year, from.month, to.year, to.month, from.year, to.year);

    const existingMap = {};
    for (const f of existingFees) {
      existingMap[`${f.year}-${f.month}`] = f;
    }

    const pendingMonths = [];
    const paidMonths = [];
    let totalPendingAmount = 0;
    let totalPaidAmount = 0;

    for (const { month, year } of months) {
      const key = `${year}-${month}`;
      const feeRecord = existingMap[key];
      if (feeRecord) {
        if (feeRecord.status === 'paid') {
          paidMonths.push({ month, year, amount: feeRecord.amount, status: 'paid', paymentDate: feeRecord.payment_date, paymentMethod: feeRecord.payment_method });
          totalPaidAmount += feeRecord.amount;
        } else {
          pendingMonths.push({ month, year, amount: feeRecord.amount, status: 'pending', feeId: feeRecord._id });
          totalPendingAmount += feeRecord.amount;
        }
      } else {
        pendingMonths.push({ month, year, amount: student.monthlyFee, status: 'pending', feeId: null });
        totalPendingAmount += student.monthlyFee;
      }
    }

    res.json({
      success: true,
      data: {
        student: { _id: student._id, fullName: student.fullName, monthlyFee: student.monthlyFee },
        pendingMonths,
        paidMonths,
        totalPendingAmount,
        totalPaidAmount,
        totalMonths: months.length,
        paidMonthsCount: paidMonths.length,
        pendingMonthsCount: pendingMonths.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const recordRangePayment = async (req, res) => {
  try {
    const { studentId, fromMonth, fromYear, toMonth, toYear, paymentMethod } = req.body;

    if (!studentId || !fromMonth || !fromYear || !toMonth || !toYear) {
      return res.status(400).json({ success: false, message: 'Please provide studentId, fromMonth, fromYear, toMonth, toYear' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const from = { month: parseInt(fromMonth), year: parseInt(fromYear) };
    const to = { month: parseInt(toMonth), year: parseInt(toYear) };

    if (from.year > to.year || (from.year === to.year && from.month > to.month)) {
      return res.status(400).json({ success: false, message: 'Invalid date range.' });
    }

    const months = [];
    let m = from.month;
    let y = from.year;
    while (y < to.year || (y === to.year && m <= to.month)) {
      months.push({ month: m, year: y });
      m++;
      if (m > 12) { m = 1; y++; }
    }

    const paymentDate = new Date().toISOString();
    const upsertFee = db.prepare(
      `INSERT INTO fees (student_id, month, year, amount, status, payment_date, payment_method)
       VALUES (?, ?, ?, ?, 'paid', ?, ?)
       ON CONFLICT(student_id, month, year) DO UPDATE SET
         status = 'paid', payment_date = excluded.payment_date, payment_method = excluded.payment_method, updated_at = datetime('now')`
    );

    const transaction = db.transaction(() => {
      let paidCount = 0;
      for (const { month, year } of months) {
        upsertFee.run(studentId, month, year, student.monthlyFee, paymentDate, paymentMethod || 'Cash');
        paidCount++;
      }
      return paidCount;
    });

    const paidCount = transaction();

    res.status(201).json({
      success: true,
      message: `Payment recorded for ${paidCount} month(s)`,
      data: { paidCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getFees, createFee, updateFee, getFeeSummary, getStudentFees, getPendingFeesRange, recordRangePayment };
