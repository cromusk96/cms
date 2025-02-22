import db from "../config/dbConfig.js";

const getAll = (req, res) => {
  const sql = "SELECT * FROM podloga WHERE deleted IS NOT TRUE;";
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const update = async (req, res) => {
  let newDbRow = prepare(req.body);
  if (!(await validate(newDbRow, req.db))) return res.sendStatus(400);
  const sql = newDbRow.uid
    ? "UPDATE podloga SET naziv = ? WHERE uid = ?;"
    : "INSERT INTO podloga(naziv) VALUES (?);";
  const vars = newDbRow.uid
    ? [newDbRow.naziv, newDbRow.uid]
    : [newDbRow.naziv];
  const status = newDbRow.uid ? 202 : 201;
  db.getPool(req.db).execute(sql, vars, (err, result) => {
    if (err) throw err;
    res.sendStatus(status);
  });
};

const markDeleted = (req, res) => {
  const sql = "UPDATE podloga SET deleted = TRUE WHERE uid = ?;";
  const vars = [req.params.uid];
  db.getPool(req.db).execute(sql, vars, (err, result) => {
    if (err) throw err;
    res.sendStatus(202);
  });
};

async function validate(newDbRow, database) {
  if (!newDbRow.naziv) return false;

  return true;
}

function prepare(newDbRow) {
  //nothing to do
  return newDbRow;
}

export default { getAll, update, markDeleted };
