const Contact = require('../models/Contact');

exports.submitContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    const contact = new Contact({ name, email, phone, message });
    await contact.save();

    res.status(201).json({ message: 'Thank you for your message! We will get back to you shortly.' });
  } catch (err) {
    console.error('Contact submission error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
};
