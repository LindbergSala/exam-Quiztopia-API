export const json = (statusCode, data) => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(data),
});
