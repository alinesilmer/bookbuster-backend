export const errorHandler = (err, req, res, _next) => {
  console.error("Error:", err);
  if (err?.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  res.status(err?.status || 500).json({
    error: err?.message || "Internal server error",
  });
};
