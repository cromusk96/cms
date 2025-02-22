import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export default function verifyJwt(req, res, next) {
  const token = req.cookies.access;

  //Set username and id on a request object
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      //invalid token
      return res.redirect(307, `/cms/refresh?originalUrl=${req.originalUrl}`);
    }
    req.db = decoded.db;
    req.user = decoded.username;
    req.userId = decoded.userId;
    next();
  });
}
