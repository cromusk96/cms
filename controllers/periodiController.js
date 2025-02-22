import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";

const getPeriodi = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (
    !(await functionsBackend.checkPriviledges(
      req.db,
      req.userId,
      req.headers.kampid
    ))
  )
    return res.sendStatus(403);
  const sql = `SELECT * FROM periodi WHERE kampId=${req.headers.kampid} AND deleted IS NOT TRUE;`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const savePeriod = async (req, res) => {
  let newPeriod = req.body;
  if (!validatePeriod(newPeriod)) return res.sendStatus(400);
  if (
    !(await functionsBackend.checkPriviledges(
      req.db,
      req.userId,
      newPeriod.kampId
    ))
  )
    return res.sendStatus(403);

  newPeriod = preparePeriod(newPeriod);

  if (!newPeriod.uid) {
    const sql = `INSERT INTO periodi (
          kampId, tip, minDanRez, 
          aktivan, datumOd, datumDo, 
          ponDolazak, 
          utoDolazak, sriDolazak, cetDolazak, 
          petDolazak, subDolazak, nedDolazak, 
          ponOdlazak, 
          utoOdlazak, sriOdlazak, cetOdlazak, 
          petOdlazak, subOdlazak, nedOdlazak
        ) VALUES (
          ${newPeriod.kampId}, '${newPeriod.tip}', ${newPeriod.minDanRez}, 
          ${newPeriod.aktivan}, '${newPeriod.datumOd}', '${newPeriod.datumDo}', 
          ${newPeriod.ponDolazak}, 
          ${newPeriod.utoDolazak}, ${newPeriod.sriDolazak}, ${newPeriod.cetDolazak}, 
          ${newPeriod.petDolazak}, ${newPeriod.subDolazak}, ${newPeriod.nedDolazak}, 
          ${newPeriod.ponOdlazak}, 
          ${newPeriod.utoOdlazak}, ${newPeriod.sriOdlazak}, ${newPeriod.cetOdlazak}, 
          ${newPeriod.petOdlazak}, ${newPeriod.subOdlazak}, ${newPeriod.nedOdlazak}
        );`;
    db.getPool(req.db).query(sql, (err, results) => {
      if (err) throw err;
      res.sendStatus(201);
    });
  } else {
    const sql = `UPDATE periodi SET
          kampId=${newPeriod.kampId}, tip='${newPeriod.tip}', minDanRez=${newPeriod.minDanRez}, 
          aktivan=${newPeriod.aktivan}, datumOd='${newPeriod.datumOd}', datumDo='${newPeriod.datumDo}', 
          ponDolazak=${newPeriod.ponDolazak}, 
          utoDolazak=${newPeriod.utoDolazak}, sriDolazak=${newPeriod.sriDolazak}, cetDolazak=${newPeriod.cetDolazak}, 
          petDolazak=${newPeriod.petDolazak}, subDolazak=${newPeriod.subDolazak}, nedDolazak=${newPeriod.nedDolazak}, 
          ponOdlazak=${newPeriod.ponOdlazak}, 
          utoOdlazak=${newPeriod.utoOdlazak}, sriOdlazak=${newPeriod.sriOdlazak}, cetOdlazak=${newPeriod.cetOdlazak}, 
          petOdlazak=${newPeriod.petOdlazak}, subOdlazak=${newPeriod.subOdlazak}, nedOdlazak=${newPeriod.nedOdlazak}
        WHERE uid=${newPeriod.uid};`;
    db.getPool(req.db).query(sql, (err, results) => {
      if (err) throw err;
      res.sendStatus(202);
    });
  }
};

const deletePeriod = async (req, res) => {
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
  const sql = `UPDATE periodi SET deleted=TRUE WHERE uid=${req.params.uid} AND kampId=${req.headers.kampid};`;
  db.getPool(req.db).query(sql, (err, result) => {
    if (err) throw err;
    return res.sendStatus(202);
  });
};

function validatePeriod(period) {
  if (!period || !period.tip || !period.datumOd || !period.datumDo || !period.kampId)
    return false;
  if (period.tip != "P" && period.tip != "M") return false;
  if (period.datumOd.localeCompare(period.datumDo) > 0) return false;

  return true;
}

function preparePeriod(period) {
  if (!period.aktivan && !period.aktivan === false && !period.aktivan === 0)
    period.aktivan = true;

  if (!period.minDanRez) period.minDanRez = 0;

  if (!period.ponDolazak) period.ponDolazak = false;
  if (!period.utoDolazak) period.utoDolazak = false;
  if (!period.sriDolazak) period.sriDolazak = false;
  if (!period.cetDolazak) period.cetDolazak = false;
  if (!period.petDolazak) period.petDolazak = false;
  if (!period.subDolazak) period.subDolazak = false;
  if (!period.nedDolazak) period.nedDolazak = false;

  if (!period.ponOdlazak) period.ponOdlazak = false;
  if (!period.utoOdlazak) period.utoOdlazak = false;
  if (!period.sriOdlazak) period.sriOdlazak = false;
  if (!period.cetOdlazak) period.cetOdlazak = false;
  if (!period.petOdlazak) period.petOdlazak = false;
  if (!period.subOdlazak) period.subOdlazak = false;
  if (!period.nedOdlazak) period.nedOdlazak = false;

  return period;
}

export default {
  getPeriodi,
  savePeriod,
  deletePeriod,
};
