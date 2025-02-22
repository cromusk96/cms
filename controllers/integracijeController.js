import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";

const getAll = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId)))
    return res.sendStatus(403);
  const sql = "SELECT * FROM integracije WHERE deleted IS NOT TRUE;";
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const update = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId)))
    return res.sendStatus(403);
  let newDbRow = req.body;
  if (!(await validate(newDbRow, req.db))) return res.sendStatus(400);

  newDbRow = await prepare(newDbRow);
  const vars = [
    newDbRow.opis,
    newDbRow.endpoint,
    newDbRow.funkcija,
    newDbRow.vrsta,
    newDbRow.foreignId,
    newDbRow.id,
    newDbRow.napomena,
    newDbRow.active,
    newDbRow.tip,
    newDbRow.timeInterval,
    newDbRow.polje,
  ];
  if (!newDbRow.uid) {
    const sql =
      "INSERT INTO integracije(opis, endpoint, funkcija, " +
      "vrsta, foreignId, id, napomena, active, tip, timeInterval, polje)" +
      " VALUES (?,?,?, ?,?,?,?,?,?,?,?);";
    db.getPool(req.db).execute(sql, vars, (err, result) => {
      if (err) throw err;
      return res.sendStatus(201);
    });
  } else {
    const sql =
      "UPDATE integracije SET opis = ?, endpoint = ?, funkcija = ?, vrsta = ?, " +
      "foreignId = ?, id = ?, napomena = ?, active = ?, tip = ?, timeInterval = ?, polje = ? " +
      "WHERE uid = ?;";
    vars.push(newDbRow.uid);
    db.getPool(req.db).execute(sql, vars, (err, result) => {
      if (err) throw err;
      return res.sendStatus(202);
    });
  }
};

const markDeleted = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId)))
    return res.sendStatus(403); //MOZDA napraviti adminOnly middleware i applyat ga u routeru. Tu i svuda.
  if (!req.params.uid || isNaN(parseInt(req.params.uid)))
    return res.sendStatus(400);
  const sql = "UPDATE integracije SET deleted = TRUE WHERE uid = ?;";
  const vars = [req.params.uid];
  db.getPool(req.db).execute(sql, vars, (err, result) => {
    if (err) throw err;
    res.sendStatus(202);
  });
};

async function validate(newDbRow, database) {
  if (!newDbRow.vrsta) return false;
  newDbRow.vrsta = String(newDbRow.vrsta).toLowerCase();
  if (
    newDbRow.vrsta !== "s" &&
    newDbRow.vrsta !== "o" &&
    newDbRow.vrsta !== "t" &&
    newDbRow.vrsta !== "k"
  )
    return false;

  return true;
}

async function prepare(newDbRow) {
  if (!newDbRow.opis) newDbRow.opis = null;
  if (!newDbRow.endpoint) newDbRow.endpoint = null;
  if (!newDbRow.funkcija) newDbRow.funkcija = null;
  if (!newDbRow.foreignId) newDbRow.foreignId = null;
  if (!newDbRow.id) newDbRow.id = null;
  if (!newDbRow.napomena) newDbRow.napomena = null;

  if (!newDbRow.active && newDbRow.active !== false && newDbRow.active !== 0)
    newDbRow.active = true;

  if (!newDbRow.tip) newDbRow.tip = null;
  if (!newDbRow.timeInterval) newDbRow.timeInterval = null;
  if (!newDbRow.polje) newDbRow.polje = null;

  return newDbRow;
}

export default { getAll, update, markDeleted };
