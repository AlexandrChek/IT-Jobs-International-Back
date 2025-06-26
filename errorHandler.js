const errorHandler = (err, res) => {
  let statusCode = 500;

  let errObj = {
    name: err.name || 'Error',
    message: err.message || 'Internal server error',
    stack: err.stack || undefined,
  };

  if (err.http_code) {
    errObj.name = 'CloudinaryError';
    errObj.message = err.message || err.error?.message || err.error?.details;
    statusCode = err.http_code;
  }

  res.status(statusCode).json(errObj);
};

export default errorHandler;
