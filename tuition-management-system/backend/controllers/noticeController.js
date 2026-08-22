const Notice = require('../models/Notice');

const getNotices = async (req, res) => {
  try {
    const { batch } = req.query;
    let conditions = {};

    if (batch) {
      conditions.batch = batch;
    }

    const notices = await Notice.find(conditions);
    res.json({ success: true, count: notices.length, data: notices });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createNotice = async (req, res) => {
  try {
    const notice = await Notice.create({
      title: req.body.title,
      description: req.body.description,
      createdBy: req.user._id,
      batch: req.body.batch || null,
    });
    res.status(201).json({ success: true, data: notice });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Request failed:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getNotices, createNotice, deleteNotice };
