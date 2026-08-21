const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Batch = require('../models/Batch');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const Notice = require('../models/Notice');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Homework = require('../models/Homework');
const { db } = require('../config/db');

const getAdminDashboard = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalBatches = await Batch.countDocuments();

    const paidRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fees WHERE status = 'paid'").get();
    const pendingRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fees WHERE status = 'pending'").get();

    const recentStudentsRows = db.prepare(
      `SELECT s.*, b._id as batch_id, b.name as batch_name
       FROM students s LEFT JOIN batches b ON s.batch_id = b._id
       ORDER BY s.created_at DESC LIMIT 5`
    ).all();
    const recentStudents = recentStudentsRows.map(r => ({
      _id: r._id, fullName: r.full_name, email: r.email, phone: r.phone,
      class: r.class, monthlyFee: r.monthly_fee,
      batch: r.batch_id ? { _id: r.batch_id, name: r.batch_name } : null,
      createdAt: r.created_at,
    }));

    const pendingFeesRows = db.prepare(
      `SELECT f.*, s._id as student_id, s.full_name as student_name
       FROM fees f LEFT JOIN students s ON f.student_id = s._id
       WHERE f.status = 'pending'
       ORDER BY f.year DESC, f.month DESC LIMIT 10`
    ).all();
    const pendingFees = pendingFeesRows.map(r => ({
      _id: r._id,
      student: { _id: r.student_id, fullName: r.student_name },
      amount: r.amount, month: r.month, year: r.year, status: r.status,
    }));

    const recentNoticesRows = db.prepare(
      `SELECT n.*, u._id as user_id, u.name as user_name
       FROM notices n LEFT JOIN users u ON n.created_by = u._id
       ORDER BY n.created_at DESC LIMIT 5`
    ).all();
    const recentNotices = recentNoticesRows.map(r => ({
      _id: r._id, title: r.title, description: r.description,
      createdBy: { _id: r.user_id, name: r.user_name },
      createdAt: r.created_at,
    }));

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingExamsRows = db.prepare(
      `SELECT e.*, b._id as batch_id, b.name as batch_name
       FROM exams e LEFT JOIN batches b ON e.batch_id = b._id
       WHERE e.date >= ?
       ORDER BY e.date ASC LIMIT 5`
    ).all(todayStr);
    const upcomingExams = upcomingExamsRows.map(r => ({
      _id: r._id, name: r.name, subject: r.subject, date: r.date, totalMarks: r.total_marks,
      batch: r.batch_id ? { _id: r.batch_id, name: r.batch_name } : null,
    }));

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalBatches,
        totalFeesCollected: paidRow.total,
        totalFeesPending: pendingRow.total,
        recentStudents,
        pendingFees,
        recentNotices,
        upcomingExams,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.profile_id;

    const assignedBatches = await Batch.find({ teacher: teacherId });
    const totalStudents = assignedBatches.reduce((sum, b) => sum + (b.students?.length || 0), 0);

    const recentHomework = await Homework.find({ teacher: teacherId });
    const limitedHomework = recentHomework.slice(0, 5);

    const recentExams = await Exam.find({ teacher: teacherId });
    const limitedExams = recentExams.slice(0, 5);

    res.json({
      success: true,
      data: {
        assignedBatches,
        totalStudents,
        totalBatches: assignedBatches.length,
        recentHomework: limitedHomework,
        recentExams: limitedExams,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.profile_id;

    const attendanceRecords = await Attendance.find({ student: studentId });
    const totalClasses = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const attendancePercentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;

    const feeRecords = await Fee.find({ student: studentId });
    const latestFee = feeRecords[0] || null;

    const student = await Student.findById(studentId);
    const studentBatchId = student?.batch?._id;

    let upcomingHomework = [];
    if (studentBatchId) {
      const allHomework = await Homework.find({ batch: studentBatchId });
      upcomingHomework = allHomework.slice(0, 5);
    }

    const recentResults = await Result.find({ student: studentId });
    const limitedResults = recentResults.slice(0, 5);

    let latestNotices = [];
    if (studentBatchId) {
      const allNotices = await Notice.find({ batch: studentBatchId });
      latestNotices = allNotices.slice(0, 5);
    }

    const allResults = await Result.find({ student: studentId });
    const avgMarks = allResults.length > 0
      ? Math.round(allResults.reduce((sum, r) => sum + r.percentage, 0) / allResults.length)
      : 0;

    res.json({
      success: true,
      data: {
        attendance: { totalClasses, present, absent: totalClasses - present, percentage: attendancePercentage },
        latestFee,
        feeCount: feeRecords.length,
        paidCount: feeRecords.filter(f => f.status === 'paid').length,
        upcomingHomework,
        recentResults: limitedResults,
        latestNotices,
        avgMarks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentPerformance = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const attendanceRecords = await Attendance.find({ student: studentId });
    const totalClasses = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const attendancePercentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;

    const results = await Result.find({ student: studentId });
    const avgMarks = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
      : 0;

    const feeRecords = await Fee.find({ student: studentId });
    const pendingFees = feeRecords.filter(f => f.status === 'pending').length;

    const student = await Student.findById(studentId);
    const studentBatchId = student?.batch?._id;
    let homeworkCount = 0;
    if (studentBatchId) {
      homeworkCount = await Homework.countDocuments({ batch: studentBatchId });
    }

    const performanceScore = Math.round(
      (attendancePercentage * 0.3) + (avgMarks * 0.5) + ((homeworkCount > 0 ? 80 : 0) * 0.2)
    );

    res.json({
      success: true,
      data: {
        attendancePercentage,
        totalClasses,
        present,
        avgMarks,
        totalExams: results.length,
        pendingFees,
        homeworkCount,
        performanceScore,
        results,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAdminDashboard, getTeacherDashboard, getStudentDashboard, getStudentPerformance };
