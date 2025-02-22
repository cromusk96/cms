import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";

const sendParametri = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId)))
    return res.sendStatus(403);
  if (!req.headers.kampid) return res.sendStatus(400);
  const sql = `SELECT * FROM parametri WHERE kampId = ? AND deleted IS NOT TRUE;`;
  const vars = [req.headers.kampid];
  db.getPool(req.db).execute(sql, vars, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const addParametar = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId)))
    return res.sendStatus(403);
  let newParametar = req.body;
  if (!validateParametar(newParametar)) return res.sendStatus(400);
  newParametar = prepareNewParametar(newParametar);

  let sql;
  let vars = [];
  let status = 400;
  if (!newParametar.uid) {
    //INSERT
    sql =
      "INSERT INTO parametri(kampId, nazivPolja, vrijednostPolja) VALUES (?, ?, ?);";
    vars = [
      newParametar.kampId,
      newParametar.nazivPolja,
      newParametar.vrijednostPolja,
    ];
    status = 201;
  } else {
    //UPDATE
    sql =
      "UPDATE parametri SET kampId = ?, nazivPolja = ?, vrijednostPolja = ? WHERE uid = ? ;";
    vars = [
      newParametar.kampId,
      newParametar.nazivPolja,
      newParametar.vrijednostPolja,
      newParametar.uid,
    ];
    status = 202;
  }
  db.getPool(req.db).execute(sql, vars, (err, result) => {
    if (err) throw err;
    return res.sendStatus(status);
  });
};

const deleteParametar = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId)))
    return res.sendStatus(403);
  if (!req.params.uid || isNaN(parseInt(req.params.uid)))
    return res.sendStatus(400);
  const sql = "UPDATE parametri SET deleted=TRUE WHERE uid = ?;";
  const vars = [req.params.uid];
  db.getPool(req.db).execute(sql, vars, (err, result) => {
    if (err) throw err;
    return res.sendStatus(202);
  });
};

const getUpdateUnitIdUrl = async (req, res) => {
  if (
    !(await functionsBackend.checkPriviledges(
      req.db,
      req.userId,
      req.headers.kampid
    ))
  )
    return res.sendStatus(403);
  const sql =
    "SELECT * FROM parametri WHERE kampId = ? AND" +
    " nazivPolja = 'updateUnitIdUrl' AND deleted IS NOT TRUE;";
  const vars = [req.headers.kampid];
  db.getPool(req.db).execute(sql, vars, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
};

function validateParametar(newParametar) {
  if (!newParametar || !newParametar.kampId || !newParametar.nazivPolja)
    return false;
  return true;
}

function prepareNewParametar(newParametar) {
  if (!newParametar.vrijednostPolja) newParametar.vrijednostPolja = null;

  return newParametar;
}

export default {
  sendParametri,
  addParametar,
  deleteParametar,
  getUpdateUnitIdUrl,
};
