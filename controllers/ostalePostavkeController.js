import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";

const publicGet = async (req, res) => {
  if (!req.query.kampId || !req.query.grupacija) return res.sendStatus(400);
  const sql = `SELECT * FROM ostalePostavke WHERE kampId = ?;`;
  const vars = [req.query.kampId];
  db.getPool("ca_" + req.query.grupacija).execute(sql, vars, (err, results) => {
    if (err) throw err;
    res.json(results[0] ? results[0] : {});
  });
};

const getOne = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (
    !(await functionsBackend.checkPriviledges(
      req.db,
      req.userId,
      req.headers.kampid
    ))
  )
    return res.sendStatus(403);
  const sql = `SELECT * FROM ostalePostavke WHERE kampId = ?;`;
  const vars = [req.headers.kampid];
  db.getPool(req.db).execute(sql, vars, (err, results) => {
    if (err) throw err;
    res.json(results[0] ? results[0] : {});
  });
};

const insert = async (req, res) => {
  let newDbRow = req.body;
  if (!(await validateNewDbRow(newDbRow, req.db))) return res.sendStatus(400);
  newDbRow = prepareNewDbRow(newDbRow);

  const isNew = await checkIsNew(newDbRow.kampId, req.db);
  const sql = isNew
    ? "INSERT INTO ostalePostavke(" +
      "facebook, instagram, youtube, " +
      "iban, bic, oib, " +
      "prodajaMail, prodajaTelefon, " +
      "textZaGosta, cuvanjeRezDana, " +
      "pravilaPrivatnostiHr, pravilaPrivatnostiEn, " +
      "politikaKoristenjaHr, politikaKoristenjaEn, " +
      "kampId) VALUES (?,?,?, ?,?,?, ?,?, ?,?, ?,?, ?,?, ?);"
    : "UPDATE ostalePostavke SET " +
      "facebook = ?, instagram = ?, youtube = ?, " +
      "iban = ?, bic = ?, oib = ?, " +
      "prodajaMail = ?, prodajaTelefon = ?, " +
      "textZaGosta = ?, cuvanjeRezDana = ?, " +
      "pravilaPrivatnostiHr = ?, pravilaPrivatnostiEn = ?, " +
      "politikaKoristenjaHr = ?, politikaKoristenjaEn = ? " +
      "WHERE kampId = ?;";
  const vars = [
    newDbRow.facebook,
    newDbRow.instagram,
    newDbRow.youtube,

    newDbRow.iban,
    newDbRow.bic,
    newDbRow.oib,

    newDbRow.prodajaMail,
    newDbRow.prodajaTelefon,

    newDbRow.textZaGosta,
    newDbRow.cuvanjeRezDana,

    newDbRow.pravilaPrivatnostiHr,
    newDbRow.pravilaPrivatnostiEn,
    newDbRow.politikaKoristenjaHr,
    newDbRow.politikaKoristenjaEn,

    newDbRow.kampId,
  ];
  db.getPool(req.db).execute(sql, vars, (err, results) => {
    if (err) throw err;
    return res.sendStatus(isNew ? 201 : 202);
  });
};

async function checkIsNew(kampId, database) {
  let result;
  await new Promise((resolve, reject) => {
    const sql =
      "SELECT EXISTS(SELECT * FROM ostalePostavke WHERE kampId = ?) AS value;";
    const vars = [kampId];
    db.getPool(database).execute(sql, vars, (err, results) => {
      if (err) throw err;
      result = !results[0].value;
      resolve();
    });
  });
  return result;
}

async function validateNewDbRow(newDbRow, database) {
  if (!newDbRow || !newDbRow.kampId) return false;
  //Zasad ovdje nema ništa više
  return true;
}

function prepareNewDbRow(newDbRow) {
  if (!newDbRow.facebook) newDbRow.facebook = null;
  if (!newDbRow.instagram) newDbRow.instagram = null;
  if (!newDbRow.youtube) newDbRow.youtube = null;

  if (!newDbRow.iban) newDbRow.iban = null;
  if (!newDbRow.bic) newDbRow.bic = null;
  if (!newDbRow.oib) newDbRow.oib = null;

  if (!newDbRow.prodajaMail) newDbRow.prodajaMail = null;
  if (!newDbRow.prodajaTelefon) newDbRow.prodajaTelefon = null;
  if (!newDbRow.textZaGosta) newDbRow.textZaGosta = null;
  if (!newDbRow.cuvanjeRezDana) newDbRow.cuvanjeRezDana = null;

  if (!newDbRow.pravilaPrivatnostiHr) newDbRow.pravilaPrivatnostiHr = null;
  if (!newDbRow.pravilaPrivatnostiEn) newDbRow.pravilaPrivatnostiEn = null;
  if (!newDbRow.politikaKoristenjaHr) newDbRow.politikaKoristenjaHr = null;
  if (!newDbRow.politikaKoristenjaEn) newDbRow.politikaKoristenjaEn = null;

  return newDbRow;
}

export default { getOne, insert, publicGet };
