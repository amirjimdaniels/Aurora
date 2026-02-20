/**
 * Validation middleware factory
 * Creates Express middleware from Zod schemas
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validate request body against schema
      const validated = schema.parse(req.body);

      // Replace req.body with validated & sanitized data
      req.body = validated;

      next();
    } catch (error) {
      // Zod validation error
      if (error.errors) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages
        });
      }

      // Other errors
      return res.status(400).json({
        success: false,
        message: 'Invalid request data'
      });
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error.errors) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters'
      });
    }
  };
};

/**
 * Validate route parameters
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error.errors) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid route parameters'
      });
    }
  };
};
