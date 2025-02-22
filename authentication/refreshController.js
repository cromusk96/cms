import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import db from "../config/dbConfig.js";

const handleRefreshToken = (req, res) => {
  //Read the request
  const originalUrl = req.query.originalUrl;
  const cookies = req.cookies;
  if (!cookies?.refresh) return sendToLoginOr401(originalUrl, res);
  const refreshToken = cookies.refresh;

  //Check the token
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (!decoded.db) return sendToLoginOr401(originalUrl, res);
    //Search for a user
    const sql = `SELECT refreshTokens.refreshTokenJson, users.* 
    FROM refreshTokens JOIN users ON refreshTokens.userId = users.uid 
    WHERE refreshTokens.refreshTokenJson = ?;`;
    const vars = [JSON.stringify(refreshToken)];
    db.getPool(decoded.db).execute(sql, vars, async (err, foundUsers) => {
      if (err) {
        throw err;
      }
      if (foundUsers.length == 0) return sendToLoginOr401(originalUrl, res);
      const foundUser = foundUsers[0];
      if (err || decoded.username !== foundUser.username || decoded.userId !== foundUser.uid) {
        return sendToLoginOr401(originalUrl, res);
      }
      //If refresh token matches:
      //Create new access token:
      const accessToken = jwt.sign(
        { db: decoded.db, username: decoded.username, userId: decoded.userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "300s" }
      );
      res.cookie("access", accessToken, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        maxAge: 300 * 1000,
      }); //Browsers no longer send authentication headers so this cookie has to be here
      if (!originalUrl) res.redirect(303, "/cms"); //This line shouldn't be reached normally
      res.redirect(307, originalUrl);
    });
  });
};

function sendToLoginOr401(originalUrl, res) {
  if (originalUrl.includes("/api/")) return res.sendStatus(401);
  return res.redirect(303, "/cms/public/login");
}

export default { handleRefreshToken };
