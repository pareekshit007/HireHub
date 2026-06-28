const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal server error';

  if (err.name === 'CastError') {
    message    = 'Resource not found — invalid ID';
    statusCode = 404;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message    = `Duplicate value for ${field}. Please use a different value.`;
    statusCode = 409;
  }

  if (err.name === 'ValidationError') {
    message    = Object.values(err.errors).map((e) => e.message).join(', ');
    statusCode = 400;
  }

  if (err.name === 'JsonWebTokenError') {
    message    = 'Invalid token';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message    = 'Token expired';
    statusCode = 401;
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    message    = 'File size too large';
    statusCode = 400;
  }

  console.error(`❌ [${req.method}] ${req.originalUrl} → ${statusCode}: ${err.message}`);
  if (statusCode === 500) console.error(err.stack);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;