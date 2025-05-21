const express = require('express');
const { submitApplication } = require('../controllers/applicationController');
const router = express.Router();

router.post('/', submitApplication);

module.exports = router;
