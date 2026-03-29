const jwt = require('jsonwebtoken');

function signToken(user) {
  return jwt.sign({
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
  }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { signToken };
