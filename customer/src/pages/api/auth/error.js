export default function handler(req, res) {
  const { error } = req.query;
  
  if (error) {
    return res.status(200).json({ 
      error: error,
      message: decodeURIComponent(error),
      statusCode: 200
    });
  }
  
  return res.status(200).json({
    error: "Unknown error",
    message: "An unknown authentication error occurred",
    statusCode: 200
  });
} 