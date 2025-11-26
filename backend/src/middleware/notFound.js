/**
 * 404 Not Found middleware
 */
export const notFound = (req, res, next) => {
    res.status(404).json({
      success: false,
      error: `Route not found: ${req.method} ${req.url}`
    });
  };
  