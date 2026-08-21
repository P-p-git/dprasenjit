const Batch = require('../models/Batch');
const Student = require('../models/Student');
const { db } = require('../config/db');

const getBatches = async (req, res) => {
  try {
    const batches = await Batch.find();
    res.json({ success: true, count: batches.length, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBatch = async (req, res) => {
  try {
    const batch = await Batch.create(req.body);
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBatches, getBatch, createBatch, updateBatch, deleteBatch,
  addStudentToBatch, removeStudentFromBatch,
};
