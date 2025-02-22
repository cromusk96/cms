import db from "../config/dbConfig.js";

const getAll = (req, res) => {
  const sql = "SELECT * FROM prijevodiCms;";
  db.getPool("kamp_cms_prijevodi").query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

export default { getAll };
