import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
const saltRounds = 10;
import db from "../config/dbConfig.js";

const handleLogin = async (req, res) => {
  //Read the request
  const dbName = req.body.username.split("/")[0];
  const user = req.body.username.split("/")[1];
  const pwd = req.body.password;
  if (!user || !pwd || !dbName)
    return res
      .status(400)
      .json({ message: "Both username and password are required" })
      .send();
  //Search for a username
  const sql1 = `SELECT * FROM users WHERE username = ? AND deleted IS NOT TRUE;`;
  const vars = [user];
  try {
    db.getPool(dbName).execute(sql1, vars, async (err, foundUsers) => {
      if (err) {
        throw err;
      }
      if (foundUsers.length == 0) return res.sendStatus(401);

      //Check the password
      let foundUser = null;
      for (let i = 0; i < foundUsers.length; i++) {
        if (await bcrypt.compare(pwd, foundUsers[i].password)) {
          foundUser = foundUsers[i];
          break;
        }
      }
      if (!foundUser) return res.sendStatus(401);
      //If username and password are correct:

      //Create tokens:
      const accessToken = jwt.sign(
        { db: dbName, username: foundUser.username, userId: foundUser.uid },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "300s" }
      );
      const refreshToken = jwt.sign(
        { db: dbName, username: foundUser.username, userId: foundUser.uid },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
      );
      //Save refresh token
      const sql3 = `INSERT INTO refreshTokens (userId, refreshTokenJson, expires) VALUES (?,?,?);`;
      const vars3 = [
        foundUser.uid,
        JSON.stringify(refreshToken),
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      ];
      db.getPool(dbName).execute(sql3, vars3, (err, result) => {
        if (err) {
          throw err;
        }
      });
      //Send the response
      res.cookie("access", accessToken, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        maxAge: 300 * 1000,
      }); //Browsers no longer send authentication headers so this cookie gets set aswell
      res.cookie("refresh", refreshToken, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.json({ accessToken });
    });
  } catch (err) {
    return res.sendStatus(400);
  }
};

export default { handleLogin };
