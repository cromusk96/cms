import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";

const getStopBookings = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  const sql = `SELECT * FROM zatvorenerez WHERE kampId=${req.headers.kampid} AND deleted IS NOT TRUE;`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const getStopBookingsPublic = async (req, res) => {
  if (!req.query.kampId || !req.query.group) return res.sendStatus(400);
  const sql = `SELECT * FROM zatvorenerez WHERE kampId=? AND deleted IS NOT TRUE;`;
  const vars = [req.query.kampId];
  db.getPool("ca_" + req.query.group).execute(sql, vars, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const saveStopBooking = async (req, res) => {
  let newStopBooking = req.body;
  if (!(await validateStopBooking(newStopBooking, req.db)))
    return res.sendStatus(400);
  if (
    !(await functionsBackend.checkPriviledges(
      req.db,
      req.userId,
      newStopBooking.kampId
    ))
  )
    return res.sendStatus(403);

  newStopBooking = prepareStopBooking(newStopBooking);

  if (!newStopBooking.uid) {
    const sql = `INSERT INTO zatvorenerez (
          kampId, vrsta, oznaka, 
          datumOd, datumDo, aktivna
        ) VALUES (
          ${newStopBooking.kampId}, '${newStopBooking.vrsta}', '${newStopBooking.oznaka}', 
          '${newStopBooking.datumOd}', '${newStopBooking.datumDo}', ${newStopBooking.aktivna}
        );`;
    db.getPool(req.db).query(sql, (err, results) => {
      if (err) throw err;
      res.sendStatus(201);
    });
  } else {
    const sql = `UPDATE zatvorenerez SET
          kampId=${newStopBooking.kampId}, vrsta='${newStopBooking.vrsta}', oznaka='${newStopBooking.oznaka}', 
          datumOd='${newStopBooking.datumOd}', datumDo='${newStopBooking.datumDo}', aktivna=${newStopBooking.aktivna} 
        WHERE uid=${newStopBooking.uid};`;
    //MOZDA nebi trebao update-at kampId. Tu i svuda.
    db.getPool(req.db).query(sql, (err, results) => {
      if (err) throw err;
      res.sendStatus(202);
    });
  }
};

const deleteStopBooking = async (req, res) => {
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
  const sql = `UPDATE zatvorenerez SET deleted=TRUE WHERE uid=${req.params.uid} AND kampId=${req.headers.kampid};`;
  db.getPool(req.db).query(sql, (err, result) => {
    if (err) throw err;
    return res.sendStatus(202);
  });
};

async function validateStopBooking(stopBooking, database) {
  if (
    !stopBooking.vrsta ||
    !stopBooking.datumOd ||
    !stopBooking.datumDo ||
    !stopBooking.kampId
  )
    return false;

  stopBooking.vrsta = String(stopBooking.vrsta).toUpperCase();
  if (
    stopBooking.vrsta != "V" &&
    stopBooking.vrsta != "S" &&
    stopBooking.vrsta != "P" &&
    stopBooking.vrsta != "M"
  )
    return false;

  if (
    (stopBooking.vrsta == "V" || stopBooking.vrsta == "S") &&
    !stopBooking.oznaka
  )
    return false;

  if (stopBooking.datumOd.localeCompare(stopBooking.datumDo) > 0) return false;

  let returnValue = true;
  let promises = [];
  if (stopBooking.vrsta == "V")
    promises.push(
      new Promise((resolve, reject) => {
        const sql = `SELECT EXISTS(SELECT * FROM vrstaSJ WHERE oznakaMish='${stopBooking.oznaka}' AND deleted IS NOT TRUE) AS value;`;
        db.getPool(database).query(sql, (err, result) => {
          if (err) throw err;
          if (!result[0].value) returnValue = false;
          resolve();
        });
      })
    );
  if (stopBooking.vrsta == "S")
    promises.push(
      new Promise((resolve, reject) => {
        const sql = `SELECT EXISTS(SELECT * FROM brojSJ WHERE brojMish='${stopBooking.oznaka}' AND deleted IS NOT TRUE) AS value;`;
        db.getPool(database).query(sql, (err, result) => {
          if (err) throw err;
          if (!result[0].value) returnValue = false;
          resolve();
        });
      })
    );
  await Promise.all(promises);

  return returnValue;
}

function prepareStopBooking(stopBooking) {
  if (
    !stopBooking.aktivna &&
    !stopBooking.aktivna === false &&
    !stopBooking.aktivna === 0
  )
    stopBooking.aktivna = true;

  return stopBooking;
}

export default {
  getStopBookings,
  saveStopBooking,
  deleteStopBooking,
  getStopBookingsPublic,
};
