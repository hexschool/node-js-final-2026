module.exports = {
  jwtSecret: process.env.JWT_SECRET || "winterNode2026",
  jwtExpiresDay: process.env.JWT_EXPIRES_DAY || "30d",
};