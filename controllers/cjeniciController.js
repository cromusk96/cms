import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";

const getAllCjenici = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (
    !(await functionsBackend.checkPriviledges(
      req.db,
      req.userId,
      req.headers.kampid
    ))
  )
    return res.sendStatus(403);
  const sql =
    "SELECT cjenici.uid, godina, vrstaSjId, phobsCjenik " +
    "FROM cjenici JOIN vrstaSJ ON cjenici.vrstaSjId = vrstaSJ.uid " +
    "WHERE kampId = ? AND deleted IS NOT TRUE;"; //MOZDA dodati cjenici.deleted
  const vars = [req.headers.kampid];
  db.getPool(req.db).execute(sql, vars, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const insertOrUpdateCjenik = async (req, res) => {
  let newCjenik = req.body;
  if (!(await validateCjenik(newCjenik, req.db))) return res.sendStatus(400);
  let kampId;
  await new Promise((resolve, reject) => {
    const sql = "SELECT kampId FROM vrstaSJ WHERE uid = ? ;";
    const vars = [newCjenik.vrstaSjId];
    db.getPool(req.db).execute(sql, vars, (err, result) => {
      if (err) throw err;
      kampId = result[0].kampId;
      resolve();
    });
  });
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, kampId)))
    return res.sendStatus(403);

  await saveCjenik(newCjenik, req.db);

  return res.sendStatus(202);
};

async function validateCjenik(newCjenik, database) {
  if (!newCjenik.godina || !newCjenik.vrstaSjId) return false;

  let valid = true;
  //vrstaSjId mora postojati
  await new Promise((resolve, reject) => {
    const sql =
      "SELECT EXISTS(SELECT * FROM vrstaSJ WHERE uid = ? AND deleted IS NOT TRUE) AS value;";
    const vars = [newCjenik.vrstaSjId];
    db.getPool(database).execute(sql, vars, (err, result) => {
      if (err) throw err;
      if (!result[0].value) valid = false;
      resolve();
    });
  });

  return valid;
}

async function saveCjenik(newCjenik, database) {
  newCjenik = await prepareNewCjenik(newCjenik, database);
  if (!newCjenik.uid) {
    const sql =
      "INSERT INTO cjenici(godina,vrstaSjId,phobsCjenik) VALUES (?,?,?);";
    const vars = [newCjenik.godina, newCjenik.vrstaSjId, newCjenik.phobsCjenik];
    db.getPool(database).execute(sql, vars, (err, result) => {
      if (err) throw err;
    });
  } else {
    const sql = "UPDATE cjenici SET phobsCjenik = ? WHERE uid = ?;";
    const vars = [newCjenik.phobsCjenik, newCjenik.uid];
    db.getPool(database).execute(sql, vars, (err, result) => {
      if (err) throw err;
    });
  }
}

async function prepareNewCjenik(newCjenik, database) {
  if (!newCjenik.uid)
    await new Promise((resolve, reject) => {
      const sql = "SELECT uid FROM cjenici WHERE vrstaSjId = ? AND godina = ?;";
      const vars = [newCjenik.vrstaSjId, newCjenik.godina];
      db.getPool(database).execute(sql, vars, (err, result) => {
        if (err) throw err;
        newCjenik.uid = result[0]?.uid;
        resolve();
      });
    });
  if (!newCjenik.phobsCjenik) newCjenik.phobsCjenik = null;
  return newCjenik;
}

export default { getAllCjenici, insertOrUpdateCjenik };
