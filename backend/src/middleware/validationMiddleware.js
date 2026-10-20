const { validationResult } = require('express-validator');

/**
 * Middleware qui intercepte les résultats de validation express-validator
 * Renvoie un statut HTTP 400 clair avec la liste des champs invalides
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des données d\'entrée.',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
}

module.exports = {
  handleValidationErrors
};
