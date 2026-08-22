const errorHandler = (err, req, res, next) => {
  let statusCode = err.status || err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = statusCode >= 500 ? 'Internal server error' : err.message;

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === 'SQLITE_CONSTRAINT') {
    statusCode = 400;
    message = 'Duplicate field value entered.';
  }

  if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
    statusCode = 400;
    message = 'Invalid field value.';
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    statusCode = 400;
    message = 'Referenced record does not exist.';
  }

  if (statusCode >= 500) {
    console.error('Unhandled error:', err);
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
