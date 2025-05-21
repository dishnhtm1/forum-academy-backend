const Application = require('../models/Application');

exports.submitApplication = async (req, res) => {
  try {
    const application = new Application(req.body);
    await application.save();
    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
