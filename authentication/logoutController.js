import db from "../config/dbConfig.js";

const handleLogout = (req, res) => {
  //Read the request
  const cookies = req.cookies;
  if (!cookies?.refresh || !req.db) return res.sendStatus(204);
  const refreshToken = cookies.refresh;

  //Search for a user
  const sql1 = `SELECT refreshTokens.refreshTokenJson, users.* 
  FROM refreshTokens JOIN users ON refreshTokens.userId = users.uid 
  WHERE refreshTokens.refreshTokenJson = ?;`;
  const vars = [JSON.stringify(refreshToken)];
  db.getPool(req.db).execute(sql1, vars, (err, foundUsers) => {
    if (err) {
      throw err;
    }
    if (foundUsers.length > 0) {
      const foundUser = foundUsers[0];
      //Remove refresh token from the database
      const sql2 = `DELETE FROM refreshTokens WHERE refreshTokenJson = ?;`;
      //vars are good from last time and stringify is kind-of an expensive operation
      db.getPool(req.db).execute(sql2, vars, (err, result) => {
        if (err) {
          throw err;
        }
      });
    }
    res.clearCookie("refresh", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    res.clearCookie("access", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    return res.redirect("/cms/public/login");
  });
};

export default { handleLogout };
