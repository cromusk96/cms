import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";

const getPayGwPostavke = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId)))
    return res.sendStatus(403);
  if (!req.headers.kampid) return res.sendStatus(400);

  const sql = "SELECT * FROM payGwPostavke WHERE kampId=?;";
  const vars = [req.headers.kampid];
  db.getPool(req.db).query(sql, vars, (err, results) => {
    if (err) throw err;
    res.json(results[0] ? results[0] : {});
  });
};

const getAllPaymentGws = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId)))
    return res.sendStatus(403);

  const sql = "SELECT uid, naziv FROM paymentGws;";
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
};

const updatePayGwPostavke = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId)))
    return res.sendStatus(403);
  let newPayGwPostavke = req.body;
  if (!(await validatePayGwPostavke(newPayGwPostavke, req.db)))
    return res.sendStatus(400);
  newPayGwPostavke = preparePayGwPostavke(newPayGwPostavke);

  const isNew = await checkIsNew(newPayGwPostavke.kampId, req.db);
  const sql = isNew
    ? "INSERT INTO payGwPostavke(" +
      "gatewayId, shopID, shoppingCartIdPrefix, version, " +
      "returnUrl, cancelUrl, returnErrorURL, bankCard, bankTransaction, " +
      "finishTransactionRightAway, active" +
      "kampId)" +
      "VALUES (?,?,?,?, ?,?,?,?,?, ?,?, ?);"
    : "UPDATE payGwPostavke SET " +
      "gatewayId = ?, shopID = ?, shoppingCartIdPrefix = ?, version = ?, " +
      "returnUrl = ?, cancelUrl = ?, returnErrorURL = ?, bankCard = ?, bankTransaction = ?, " +
      "finishTransactionRightAway = ?, active = ? " +
      "WHERE kampId = ?;";
  const vars = [
    newPayGwPostavke.gatewayId,
    newPayGwPostavke.shopID,
    newPayGwPostavke.shoppingCartIdPrefix,
    newPayGwPostavke.version,
    newPayGwPostavke.returnUrl,
    newPayGwPostavke.cancelUrl,
    newPayGwPostavke.returnErrorURL,
    newPayGwPostavke.bankCard,
    newPayGwPostavke.bankTransaction,
    newPayGwPostavke.finishTransactionRightAway,
    newPayGwPostavke.active,
    newPayGwPostavke.kampId,
  ];
  db.getPool(req.db).query(sql, vars, (err, results) => {
    res.sendStatus(isNew ? 201 : 202);
  });
};

const getPrivatePayGwData = (req, res) => {
  if (
    req.ip != "::ffff:127.0.0.1" &&
    req.ip != "127.0.0.1" &&
    req.ip != "::1" &&
    req.ip != "localhost"
  )
    return res.sendStatus(403);
  if (!req.query.grupacija || !req.query.kampId) return res.sendStatus(400);

  const sql =
    "SELECT * FROM payGwPostavke JOIN paymentGws ON payGwPostavke.gatewayId = paymentGws.uid WHERE kampId = ?;";
  const vars = [req.query.kampId];
  db.getPool("ca_" + req.query.grupacija).query(sql, vars, (err, results) => {
    if (err) throw err;
    res.json(results[0] ? results[0] : {});
  });
};

async function checkIsNew(kampId, database) {
  let result;
  await new Promise((resolve, reject) => {
    const sql =
      "SELECT EXISTS(SELECT * FROM payGwPostavke WHERE kampId = ?) AS value;";
    const vars = [kampId];
    db.getPool(database).query(sql, vars, (err, results) => {
      if (err) throw err;
      result = !results[0].value;
      resolve();
    });
  });
  return result;
}

async function validatePayGwPostavke(newPayGwPostavke, database) {
  if (
    !newPayGwPostavke ||
    !newPayGwPostavke.kampId ||
    !newPayGwPostavke.gatewayId
  )
    return false;

  let result = true;

  let dbChecks = [];
  dbChecks.push(
    new Promise((resolve, reject) => {
      const sql =
        "SELECT EXISTS(SELECT * FROM paymentGws WHERE uid = ?) AS value;";
      const vars = [newPayGwPostavke.gatewayId];
      db.getPool(database).query(sql, vars, (err, results) => {
        if (err) throw err;
        if (!results[0].value) result = false;
        resolve();
      });
    })
  );
  //MOZDA provjeravati da li kampId postoji. Tu i svuda.
  await Promise.all(dbChecks);
  return result;
}

function preparePayGwPostavke(newPayGwPostavke) {
  if (!newPayGwPostavke.shopID) newPayGwPostavke.shopID = null;
  if (!newPayGwPostavke.shoppingCartIdPrefix)
    newPayGwPostavke.shoppingCartIdPrefix = null;
  if (!newPayGwPostavke.version) newPayGwPostavke.version = null;
  if (!newPayGwPostavke.returnUrl) newPayGwPostavke.returnUrl = null;
  if (!newPayGwPostavke.cancelUrl) newPayGwPostavke.cancelUrl = null;
  if (!newPayGwPostavke.returnErrorURL) newPayGwPostavke.returnErrorURL = null;

  if (!newPayGwPostavke.bankCard) newPayGwPostavke.bankCard = false;
  if (!newPayGwPostavke.bankTransaction)
    newPayGwPostavke.bankTransaction = false;
  if (!newPayGwPostavke.finishTransactionRightAway)
    newPayGwPostavke.finishTransactionRightAway = false;

  if (
    !newPayGwPostavke.active &&
    newPayGwPostavke.active !== false &&
    newPayGwPostavke.active !== 0
  )
    newPayGwPostavke.active = true;

  return newPayGwPostavke;
}

export default {
  getPayGwPostavke,
  getAllPaymentGws,
  updatePayGwPostavke,
  getPrivatePayGwData,
};
