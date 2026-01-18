/**
 * Middleware to parse specific fields from JSON strings to objects/arrays
 * This is needed because multipart/form-data sends everything as strings
 */
const parseMultipartBody = (req, res, next) => {
  try {
    // Parse 'members' if it exists and is a string
    if (req.body.members && typeof req.body.members === 'string') {
      req.body.members = JSON.parse(req.body.members);
    }

    // You can add other fields here if needed e.g. location objects
    
    // Clean up tripId if it accidentally has quotes or whitespace
    if (req.body.tripId && typeof req.body.tripId === 'string') {
        req.body.tripId = req.body.tripId.trim().replace(/^"|"$/g, '');
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format in form-data fields',
      error: error.message
    });
  }
};

module.exports = parseMultipartBody;
