const Contact = require('../models/Contact');
const { sendReplyEmail } = require('../services/emailService');

exports.submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const contact = new Contact({ name, email, phone, subject, message });
    await contact.save();

    res.status(201).json({ message: 'Thank you for your message! We will get back to you shortly.' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// New function to get all contacts for admin
exports.getAllContacts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    
    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
      
    const total = await Contact.countDocuments(filter);
    
    res.json({
      success: true,
      message: 'Contacts retrieved successfully',
      contacts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts'
    });
  }
};

// New function to update contact status
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'resolved', 'approved', 'ignored'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const contact = await Contact.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      message: `Contact marked as ${status}`,
      contact
    });
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact status'
    });
  }
};

// New function to reply to contact message
exports.replyToContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { replySubject, replyMessage } = req.body;
    
    if (!replySubject || !replyMessage) {
      return res.status(400).json({
        success: false,
        message: 'Reply subject and message are required'
      });
    }
    
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    // Send reply email
    await sendReplyEmail(contact.email, replySubject, replyMessage, 'contact');
    
    // Update contact with reply info and mark as resolved
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { 
        status: 'resolved',
        repliedAt: new Date(),
        replySubject,
        replyMessage,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Reply sent successfully',
      contact: updatedContact
    });
  } catch (error) {
    console.error('Reply to contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply: ' + error.message
    });
  }
};