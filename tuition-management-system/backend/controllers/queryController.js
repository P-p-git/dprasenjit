const { Query, QUERY_CATEGORIES } = require('../models/Query');

const getQueries = async (req, res) => {
  try {
    const { status } = req.query;
    const conditions = {};
    if (status) conditions.status = status;

    // Students are ALWAYS scoped to their own queries
    if (req.user.role === 'student') {
      conditions.student = req.user.profile_id;
    }

    const queries = await Query.find(conditions);
    res.json({ success: true, count: queries.length, data: queries });
  } catch (error) {
    console.error('Get queries error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createQuery = async (req, res) => {
  try {
    const { category, message } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    const cleanCategory = QUERY_CATEGORIES.includes(category) ? category : 'General';

    if (!req.user.profile_id) {
      return res.status(400).json({ success: false, message: 'Only students can submit queries' });
    }

    const query = await Query.create({
      student: req.user.profile_id,
      category: cleanCategory,
      message: String(message).trim().slice(0, 2000),
    });

    res.status(201).json({ success: true, data: query });
  } catch (error) {
    console.error('Create query error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const replyToQuery = async (req, res) => {
  try {
    const { reply, status } = req.body;

    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }

    const update = {};
    if (reply !== undefined) update.reply = String(reply).trim().slice(0, 2000);
    if (status !== undefined && ['open', 'resolved'].includes(status)) update.status = status;
    else if (reply !== undefined && !update.status) update.status = query.reply ? query.status : 'resolved';

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }
    update.repliedBy = req.user._id;

    const updated = await Query.findByIdAndUpdate(req.params.id, update);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Reply to query error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getQueries, createQuery, replyToQuery };
