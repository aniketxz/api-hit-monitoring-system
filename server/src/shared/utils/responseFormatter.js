class ResponseFormatter {
  static success(data = null, message = "Success", statusCode = 200) {
    return {
      success: true,
      message,
      data,
      statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message = "Failed", statusCode = 500, error = null) {
    return {
      success: false,
      message,
      error,
      statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  static validationError(error = null) {
    return {
      success: false,
      message: "Validation failed",
      error,
      statusCode: 400,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated(data = null, page, limit, total, message = "Success", statusCode = 200) {
    return {
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      },
      statusCode,
      timestamp: new Date().toISOString(),
    };
  }
}

export default ResponseFormatter;
