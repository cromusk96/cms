import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";

const sendPaidPackages = async (req, res) => {
  const sql = `SELECT * FROM paidPackages;`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    let paidPackages = {};
    results.forEach(
      (row) => (paidPackages[row.packageName.toLocaleLowerCase()] = !!row.paid)
    );
    res.send(paidPackages);
  });
};

const isPaid = async (req, res) => {
  const packageName = req.params.packageName.toLocaleLowerCase();
  let result = {};
  result[packageName] = await functionsBackend.isPaid(req.db, packageName);
  res.json(result);
};

export default { sendPaidPackages, isPaid };
