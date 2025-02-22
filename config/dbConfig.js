import mysql from "mysql2";
let pools = {};

const getPool = (db) => {
  if (!pools[db])
    pools[db] = mysql.createPool({
      connectionLimit: 20,
      host: "127.0.0.1",
      user: "denis",
      password: "oM36303690!",
      database: db,
    });
  return pools[db];
};

export default { getPool };
