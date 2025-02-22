import db from "../config/dbConfig.js";
import bcrypt from "bcrypt";
import functionsBackend from "../functionsBackend.js";

const getAllUsers = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId)))
    return res.sendStatus(403);
  const sql =
    "SELECT uid, username, isAdmin, isVlasnikObjekta, isRecepcioner, isCallcentar " +
    "FROM users WHERE deleted IS NOT TRUE;";
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};
//MOZDA to refactorati da čitam id iz result-a a ne diram bazu opet za LAST_INSERT_ID
const saveUser = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId)))
    return res.sendStatus(403);
  let newUser = req.body;
  if (!(await validateUser(newUser, req.db))) return res.sendStatus(400);

  newUser = await prepareNewUser(newUser, req.db);

  if (!newUser.uid) {
    const sql =
      "INSERT INTO users (username, password, " +
      "isAdmin, isVlasnikObjekta, isRecepcioner, isCallcentar) " +
      "VALUES (?,?,?,?,?,?);";
    const vars = [
      newUser.username,
      newUser.password,
      newUser.isAdmin,
      newUser.isVlasnikObjekta,
      newUser.isRecepcioner,
      newUser.isCallcentar,
    ];
    db.getPool(req.db).getConnection((err, con) => {
      if (err) throw err;
      con.execute(sql, vars, (err, result) => {
        if (err) {
          con.release();
          throw err;
        }
        con.query("SELECT LAST_INSERT_ID() as value;", async (err, result) => {
          if (err) {
            con.release();
            throw err;
          }
          await updateUserKamp(result[0].value, newUser.kampovi, con);
          newUser.uid = result[0].value;
          await saveOwnedObjekti(newUser, con);
          con.release();
          res.sendStatus(201);
        });
      });
    });
  } else {
    let sql = `UPDATE users SET username = ? , `;
    let vars = [newUser.username];
    if (newUser.password) {
      sql += `password = ? , `;
      vars.push(newUser.password);
    }
    sql +=
      "isAdmin = ?, isVlasnikObjekta = ?, isRecepcioner = ?, isCallcentar = ? " +
      "WHERE uid = ? ;";
    vars.push(
      newUser.isAdmin,
      newUser.isVlasnikObjekta,
      newUser.isRecepcioner,
      newUser.isCallcentar,
      newUser.uid
    );
    db.getPool(req.db).getConnection((err, con) => {
      if (err) throw err;
      con.execute(sql, vars, async (err, result) => {
        if (err) {
          con.release();
          throw err;
        }
        await updateUserKamp(newUser.uid, newUser.kampovi, con);
        await saveOwnedObjekti(newUser, con);
        con.release();
        res.sendStatus(202);
      });
    });
  }
};

const deleteUser = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId)))
    return res.sendStatus(403);
  if (!req.params.uid || isNaN(parseInt(req.params.uid)))
    return res.sendStatus(400);
  //zadnjeg admina se nemože obrisati
  const sql =
    "SELECT EXISTS(SELECT * FROM users WHERE " +
    "isAdmin IS TRUE AND deleted IS NOT TRUE AND NOT uid = ?) AS value;";
  const vars = [req.params.uid];
  db.getPool(req.db).execute(sql, vars, (err, result) => {
    if (err) throw err;
    if (!result[0].value) return res.sendStatus(400);
    const sql = `UPDATE users SET deleted=TRUE WHERE uid = ? ;`; //Old vars are ok
    db.getPool(req.db).execute(sql, vars, (err, result) => {
      if (err) throw err;
      return res.sendStatus(202);
    });
  });
};

const isAdmin = async (req, res) => {
  return res.json(await functionsBackend.isAdmin(req.db, req.userId));
};

async function updateUserKamp(userId, kampovi, connection) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM userkamp WHERE userId = ? ;`;
    const vars = [userId];
    connection.execute(sql, vars, async (err, result) => {
      if (err) {
        connection.release();
        throw err;
      }
      let promises = [];
      Object.keys(kampovi).forEach((kampId) => {
        if (kampovi[kampId])
          promises.push(
            new Promise((resolve, reject) => {
              const sql = `INSERT INTO userkamp(userId,kampId) VALUES (?,?);`;
              const vars = [userId, kampId];
              connection.execute(sql, vars, (err, result) => {
                if (err) {
                  connection.release();
                  throw err;
                }
                resolve();
              });
            })
          );
      });
      await Promise.all(promises);
      resolve();
    });
  });
}

const getUserKamp = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId)))
    return res.sendStatus(403);
  const sql = `SELECT * FROM userkamp WHERE deleted IS NOT TRUE;`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    return res.send(results);
  });
};

async function validateUser(newUser, database) {
  if (!newUser || !newUser.username || (!newUser.uid && !newUser.password))
    return false;

  if (!newUser.uid) newUser.uid = null;

  let returnValue = true;
  let promises = [];
  //username mora biti jedinstven
  promises.push(
    new Promise((resolve, reject) => {
      const sql = `SELECT EXISTS(SELECT * FROM users WHERE username = ? 
        AND NOT uid <=> ? AND deleted IS NOT TRUE) AS value;`;
      const vars = [newUser.username, newUser.uid];
      db.getPool(database).execute(sql, vars, (err, result) => {
        if (err) throw err;
        if (result[0].value) returnValue = false;
        resolve();
      });
    })
  );
  //zadnjem adminu se nemogu maknuti privilegije
  if (!newUser.isAdmin)
    promises.push(
      new Promise((resolve, reject) => {
        const sql = `SELECT EXISTS(SELECT * FROM users WHERE isAdmin IS TRUE 
        AND NOT uid <=> ? AND deleted IS NOT TRUE) AS value;`;
        const vars = [newUser.uid];
        db.getPool(database).execute(sql, vars, (err, result) => {
          if (err) throw err;
          if (!result[0].value) returnValue = false;
          resolve();
        });
      })
    );
  //svi kampId-ovi moraju postojati
  Object.keys(newUser.kampovi).forEach((kampId) => {
    if (newUser[kampId])
      promises.push(
        new Promise((resolve, reject) => {
          const sql = `SELECT EXISTS(SELECT * FROM kampovi WHERE 
            uid = ? AND deleted IS NOT TRUE) AS value;`;
          const vars = [kampId];
          db.getPool(database).execute(sql, vars, (err, result) => {
            if (err) throw err;
            resolve();
          });
        })
      );
  });
  await Promise.all(promises);
  return returnValue;
}

async function prepareNewUser(newUser, database) {
  if (!newUser.isAdmin) newUser.isAdmin = false;
  if (!newUser.isVlasnikObjekta) newUser.isVlasnikObjekta = false;
  if (!newUser.isRecepcioner) newUser.isRecepcioner = false;
  if (!newUser.isCallcentar) newUser.isCallcentar = false;

  if (newUser.password)
    newUser.password = await bcrypt.hash(newUser.password, 10);

  if (newUser.isAdmin) {
    await new Promise((resolve, reject) => {
      const sql = "SELECT uid FROM kampovi WHERE deleted IS NOT TRUE;";
      db.getPool(database).query(sql, (err, results) => {
        if (err) throw err;
        newUser.kampovi = {};
        results.forEach((r) => (newUser.kampovi[r.uid] = true));
        resolve();
      });
    });
  }

  return newUser;
}

async function saveOwnedObjekti(user, connection) {
  if (!user?.objekti || !user?.isVlasnikObjekta) return;
  await new Promise((resolve, reject) => {
    const sql = "DELETE FROM objektVlasnik WHERE vlasnikId = ?;";
    const vars = [user.uid];
    connection.execute(sql, vars, (err, result) => {
      if (err) {
        connection.release();
        throw err;
      }
      resolve();
    });
  });
  let promises = [];
  const sql = "INSERT INTO objektVlasnik (objektId, vlasnikId) VALUES (?,?);";
  for (let i = 0; i < user.objekti.length; i++) {
    promises.push(
      new Promise((resolve, reject) => {
        const vars = [user.objekti[i].uid, user.uid];
        connection.execute(sql, vars, (err, result) => {
          if (err) {
            connection.release();
            throw err;
          }
          resolve();
        });
      })
    );
  }
  await Promise.all(promises);
}

export default {
  getAllUsers,
  saveUser,
  deleteUser,
  isAdmin,
  getUserKamp,
};
