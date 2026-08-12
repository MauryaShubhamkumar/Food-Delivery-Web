export const successResponse = (res, data = {}, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(typeof data === 'object' && !Array.isArray(data) && data !== null && Object.keys(data).length > 0 && !data.data ? data : { data })
  });
};

export const errorResponse = (res, message = "Error", statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {})
  });
};
