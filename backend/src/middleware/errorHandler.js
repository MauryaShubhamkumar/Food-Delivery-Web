const errorHandler = (err, req, res, next) => {
  const reqId = req.requestId || 'N/A';
  console.error(`🔥 [RequestID: ${reqId}] Error:`, err.stack || err.message);

  const statusCode =
    err.statusCode ||
    err.status ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  const isProd = process.env.NODE_ENV === 'production';

  let clientMessage = err.message || 'An internal server error occurred.';
  if (isProd && statusCode === 500) {
    clientMessage = 'An internal server error occurred. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    requestId: reqId,
    message: clientMessage,
    ...(isProd ? {} : { stack: err.stack })
  });
};

export default errorHandler;
