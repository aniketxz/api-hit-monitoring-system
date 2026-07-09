import config from "../config/index.js";
import logger from "../config/logger.js";
import ResponseFormatter from "../utils/responseFormatter.js";

const authorize =
  (allowedRoles = []) =>
  (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json(ResponseFormatter.error("Forbidden", 403));
      }

      if (allowedRoles.length === 0) {
        return next();
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res
          .status(403)
          .json(ResponseFormatter.error("Insufficient permission", 403));
      }

      return next();
    } catch (error) {
      next(error);
    }
  };

export { authorize };
