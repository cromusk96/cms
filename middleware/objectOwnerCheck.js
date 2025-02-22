import db from "../config/dbConfig.js";

export default function objectOwnerCheck(req, res, next) {
  const sql =
    "SELECT isVlasnikObjekta FROM users WHERE uid = ? AND deleted IS NOT TRUE;";
  const vars = [req.userId];
  db.getPool(req.db).execute(sql, vars, (err, result) => {
    if (err) throw err;
    if (!result.length) return res.sendStatus(400); //This shouldn't happen
    if (result[0].isVlasnikObjekta)
      return res.redirect(303, "/cms/objektiVlasnik");
    else next();
  });
}

//MOZDA bi trebao napraviti posebni api za vlasnike objekata pa samo njega izložiti prije ove provjere
