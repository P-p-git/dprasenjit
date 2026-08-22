const Batch = require('../models/Batch');
const Student = require('../models/Student');
const { db } = require('../config/db');

// Students may browse batches but never see other students' personal data
const sanitizeBatchForStudent = (batch) => {
  if (!batch) return batch;
  const { students, ...rest } = batch;
  return { ...rest, studentCount: Array.isArray(students) ? students.length : 0 };
};

const getBatches = async (req, res) => {
  try {
    let batches = await Batch.find();
    if (req.user.role === 'student') batches = batches.map(sanitizeBatchForStudent);
    res.json({ success: true, count: batches.length, data: batches });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    res.json({ success: true, data: req.user.role === 'student' ? sanitizeBatchForStudent(batch) : batch });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createBatch = async (req, res) => {
  try {
    const batch = await Batch.create(req.body);
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(req.params.id, req.body);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    res.json({ success: true, data: batch });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    db.prepare('UPDATE students SET batch_id = NULL WHERE batch_id = ?').run(req.params.id);
    await Batch.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const addStudentToBatch = async (req, res) => {
  try {
    const { studentId } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const hasStudent = await Batch.hasStudent(req.params.id, studentId);
    if (hasStudent) {
      return res.status(400).json({ success: false, message: 'Student already in this batch' });
    }

    await Batch.addStudent(req.params.id, studentId);
    const updatedBatch = await Batch.findById(req.params.id);
    res.json({ success: true, data: updatedBatch });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const removeStudentFromBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    await Batch.removeStudent(req.params.id, req.params.studentId);
    const updatedBatch = await Batch.findById(req.params.id);
    res.json({ success: true, data: updatedBatch });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getBatches, getBatch, createBatch, updateBatch, deleteBatch,
  addStudentToBatch, removeStudentFromBatch,
};
