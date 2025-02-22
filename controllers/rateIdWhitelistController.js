import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";

const getAll = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql = "SELECT * FROM rateIdWhitelist " + "WHERE kampId = ? AND deleted IS NOT TRUE;";
  const vars = [req.headers.kampid];
  db.getPool(req.db).execute(sql, vars, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const insertOrUpdate = async (req, res) => {
  let newDbRow = req.body;
  if (!(await validate(newDbRow, req.db))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, newDbRow.kampId))) return res.sendStatus(403);

  await save(newDbRow, req.db);

  return res.sendStatus(202);
};

const markDeleted = async (req, res) => {
  if (!req.headers.kampid || !req.params.uid || isNaN(parseInt(req.params.uid)))
    return res.sendStatus(400);
  if (
    !(await functionsBackend.checkPriviledges(
      req.db,
      req.userId,
      req.headers.kampid
    ))
  )
    return res.sendStatus(403);
  const sql = `UPDATE rateIdWhitelist SET deleted=TRUE WHERE uid=${req.params.uid} AND kampId=${req.headers.kampid};`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    return res.sendStatus(202);
  });
};

async function validate(newDbRow, database) {
  if (!newDbRow.rateId || !newDbRow.kampId) return false;

  return true;
}

async function save(newDbRow, database) {
  newDbRow = await prepare(newDbRow, database);
  if (!newDbRow.uid) {
    const sql = "INSERT INTO rateIdWhitelist(rateId,kampId,include) VALUES (?,?,?);";
    const vars = [newDbRow.rateId, newDbRow.kampId, newDbRow.include];
    db.getPool(database).execute(sql, vars, (err, result) => {
      if (err) throw err;
    });
  } else {
    const sql = "UPDATE rateIdWhitelist SET rateId = ?, kampId = ?, include = ? WHERE uid = ?;";
    const vars = [newDbRow.rateId, newDbRow.kampId, newDbRow.include, newDbRow.uid];
    db.getPool(database).execute(sql, vars, (err, result) => {
      if (err) throw err;
    });
  }
}

async function prepare(newDbRow, database) {
  if (!newDbRow.include && newDbRow.include !== false && newDbRow.include !== 0) newDbRow.include = true;
  return newDbRow;
}

export default { getAll, insertOrUpdate, markDeleted };
