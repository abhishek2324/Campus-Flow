const jwt = require("jsonwebtoken");



function verifyToken(req, res, next) {
  const authHeader = req.header("Authorization");
  const token =
    req.cookies?.token ||
    (authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : null);

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(401).json({ message: "Token is not valid" });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}

module.exports = {
  verifyToken,
  authorizeRoles,
  isAdmin: authorizeRoles("admin"),
  isStudent: authorizeRoles("student"),
  isProfessor: authorizeRoles("professor"),
  isHod: authorizeRoles("hod"),
};



