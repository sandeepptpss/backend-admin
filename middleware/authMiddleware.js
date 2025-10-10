const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;
module.exports = (req, res, next) => {
  
  try {
    const authHeader = req.headers.authorization.split(' ')[1];
    if(!authHeader){
      return res.status(401).json({ error: "Unauthorized. No token provided" });
    }
  const decoded = jwt.verify(authHeader, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('JWT verify Error:', error);
  }
}
