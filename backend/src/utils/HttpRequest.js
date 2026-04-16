export const HttpRequest = (res, status, error, message, data = []) => {
  res.status(status).json({
    error: error,
    message: message,
    data: data,
  });
};
