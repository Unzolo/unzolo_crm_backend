const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');

const register = async (req, res) => {
  try {
    const data = await authService.register(req.body);
    return success(res, data, 'Registration successful', 201);
  } catch (err) {
    // If it's a known error (like duplicate email), we might want to handle status code differently
    // For simplicity, passing 400 for bad request if it's a validation-like error from service
    // But since validation middleware handles structure, service errors are usually logic conflicts
    if (err.message === 'Email already exists') {
        return error(res, err.message, 409);
    }
    return error(res, err.message, 500); 
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    return success(res, data, 'Login successful');
  } catch (err) {
    if (err.message === 'Invalid email or password') {
        return error(res, err.message, 401);
    }
    if (err.message === 'Your account has been blocked. Please contact admin.') {
        return error(res, err.message, 403);
    }
    return error(res, err.message, 500);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const data = await authService.verifyOtp(email, otp);
    return success(res, data, 'Account verified successfully');
  } catch (err) {
    if (err.message === 'User not found' || err.message === 'Invalid OTP' || err.message === 'OTP expired' || err.message === 'User already verified') {
      return error(res, err.message, 400); 
    }
    if (err.message === 'Your account has been blocked. Please contact admin.') {
      return error(res, err.message, 403);
    }
    return error(res, err.message, 500);
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const data = await authService.resendOtp(email);
    return success(res, data, 'OTP resent successfully');
  } catch (err) {
    if (err.message === 'User not found' || err.message === 'User already verified') {
      return error(res, err.message, 400);
    }
    return error(res, err.message, 500);
  }
};

const getProfile = async (req, res) => {
  try {
    const partner = await authService.getProfile(req.user.id);
    // User requested "company name (partnername), email and phone number"
    // We return the whole object, frontend can pick. Or we can structure strictly.
    // Let's return the full profile for flexibility.
    return success(res, partner);
  } catch (err) {
    return error(res, err.message, 404);
  }
};



const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
    return success(res, result);
  } catch (err) {
    if (err.message === 'Incorrect old password') {
        return error(res, err.message, 400);
    }
    return error(res, err.message, 500);
  }
};

const logout = async (req, res) => {
    // Since we are using JWT (stateless), the server doesn't need to do much.
    // The client should remove the token.
    // Optionally, we could blacklist the token here if we had a blacklist mechanism.
    return success(res, null, 'Logged out successfully');
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return success(res, result, 'Reset email sent');
  } catch (err) {
    if (err.message === 'User not found') {
      return error(res, err.message, 404);
    }
    if (err.message === 'Your account has been blocked. Please contact admin.') {
      return error(res, err.message, 403);
    }
    return error(res, err.message, 500);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    return success(res, result, 'Password reset successful');
  } catch (err) {
    if (err.message === 'Invalid or expired token') {
      return error(res, err.message, 400);
    }
    return error(res, err.message, 500);
  }
};

module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp,
  getProfile,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
};
