const { Routine, WEEK_DAYS } = require('../models/Routine');

const getRoutine = async (req, res) => {
  try {
    const entries = await Routine.find();
    res.json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    console.error('Get routine error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const validateDay = (day) => WEEK_DAYS.includes(day);

const addRoutine = async (req, res) => {
  try {
    const { day, startTime, subject, teacher } = req.body;

    if (!validateDay(day)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid day of the week' });
    }
    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }

    const entry = await Routine.create({
      day,
      startTime: startTime || '',
      subject: String(subject).trim(),
      teacher: teacher ? String(teacher).trim() : '',
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error('Add routine error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateRoutine = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.day !== undefined && !validateDay(payload.day)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid day of the week' });
    }

    const entry = await Routine.findByIdAndUpdate(req.params.id, payload);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Routine entry not found' });
    }
    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('Update routine error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteRoutine = async (req, res) => {
  try {
    const entry = await Routine.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Routine entry not found' });
    }
    res.json({ success: true, message: 'Routine entry deleted successfully' });
  } catch (error) {
    console.error('Delete routine error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getRoutine, addRoutine, updateRoutine, deleteRoutine };
