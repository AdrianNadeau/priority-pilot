// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    // Handle specific errors
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: err.errors.map(e => e.message)
      });
    }
  
    res.status(500).json({
      success: false,
      error: err.message || 'Internal Server Error'
    });
  };
  
  module.exports = errorHandler;