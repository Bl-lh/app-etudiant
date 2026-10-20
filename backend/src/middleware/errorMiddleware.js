/**
 * Gestionnaire pour routes non trouvées (404)
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Point de terminaison introuvable : ${req.method} ${req.originalUrl}`
  });
}

/**
 * Gestionnaire d'erreurs globales (500)
 */
function errorHandler(err, req, res, next) {
  console.error('[Internal Server Error]', err);

  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || 'Une erreur interne est survenue sur le serveur.'
  };

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  errorHandler
};
