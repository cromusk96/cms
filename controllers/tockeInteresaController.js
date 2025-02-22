import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";

const getAllTockeInteresa = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql = `SELECT * FROM tockeInteresa WHERE kampId=${req.headers.kampid} AND deleted IS NOT TRUE ORDER BY displayIndex ASC;`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const insertTockaInteresa = async (req, res) => {
  let newTockaInteresa = req.body;
  if (!(await validateTockaInteresa(newTockaInteresa, req.db))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, newTockaInteresa.kampId)))
    return res.sendStatus(403);
  newTockaInteresa = prepareNewTockaInteresa(newTockaInteresa);

  let sql;
  let vars;
  let status = 400;
  if (!newTockaInteresa.uid) {
    sql = `INSERT INTO tockeInteresa(
        kampId, mapaId, naziv,
        grupa, vrstaPoi,
        ikonica, latitude, longitude, 
        aktivna, noclick, openModal, nofilter, 
        navigation, panorama, resort, camp, redniBroj, 
        straniKljuc, wwwText, www, 
        opis, slika, slika1
    ) VALUES (
        ?, ?, ?,
        ?, ?, 
        ?, ?, ?, 
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, 
        ?, ?, ?
    );`;
    vars = [
      newTockaInteresa.kampId,
      newTockaInteresa.mapaId,
      newTockaInteresa.naziv,
      newTockaInteresa.grupa,
      newTockaInteresa.vrstaPoi,
      newTockaInteresa.ikonica,
      newTockaInteresa.latitude,
      newTockaInteresa.longitude,
      newTockaInteresa.aktivna,
      newTockaInteresa.noclick,
      newTockaInteresa.openModal,
      newTockaInteresa.nofilter,
      newTockaInteresa.navigation,
      newTockaInteresa.panorama,
      newTockaInteresa.resort,
      newTockaInteresa.camp,
      newTockaInteresa.redniBroj,
      newTockaInteresa.straniKljuc,
      newTockaInteresa.wwwText,
      newTockaInteresa.www,
      newTockaInteresa.opis,
      newTockaInteresa.slika,
      newTockaInteresa.slika1,
    ];
    status = 201;
  } else {
    sql = `UPDATE tockeInteresa SET
        kampId = ?, mapaId = ?,
        grupa = ?, vrstaPoi = ?, 
        naziv = ?, ikonica = ?, 
        latitude = ?, longitude = ?, 
        aktivna = ?, noclick = ?, openModal = ?,
        nofilter = ?, navigation = ?, 
        panorama = ?, 
        resort = ?, camp = ?, 
        straniKljuc = ?, wwwText = ?, 
        www = ?, 
        redniBroj = ?, opis = ?, 
        slika = ?, slika1 = ?
    WHERE uid =  ?;`;
    vars = [
      newTockaInteresa.kampId,
      newTockaInteresa.mapaId,
      newTockaInteresa.grupa,
      newTockaInteresa.vrstaPoi,
      newTockaInteresa.naziv,
      newTockaInteresa.ikonica,
      newTockaInteresa.latitude,
      newTockaInteresa.longitude,
      newTockaInteresa.aktivna,
      newTockaInteresa.noclick,
      newTockaInteresa.openModal,
      newTockaInteresa.nofilter,
      newTockaInteresa.navigation,
      newTockaInteresa.panorama,
      newTockaInteresa.resort,
      newTockaInteresa.camp,
      newTockaInteresa.straniKljuc,
      newTockaInteresa.wwwText,
      newTockaInteresa.www,
      newTockaInteresa.redniBroj,
      newTockaInteresa.opis,
      newTockaInteresa.slika,
      newTockaInteresa.slika1,
      newTockaInteresa.uid,
    ];
    status = 202;
  }
  db.getPool(req.db).execute(sql, vars, (err, results) => {
    if (err) throw err; //MOZDA umjesto throwanja vratiti status 500. Tu i svuda.
    return res.sendStatus(status);
  });
};

const deleteTockaInteresa = async (req, res) => {
  if (!req.headers.kampid || !req.params.uid || isNaN(parseInt(req.params.uid))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql = `UPDATE tockeInteresa SET deleted=TRUE WHERE uid=${req.params.uid} AND kampId=${req.headers.kampid};`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    return res.sendStatus(202);
  });
};

const setGroupToAll = async (req, res) => {
  if (!req.body.kampId || !req.body.ikonica) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.body.kampId))) return res.sendStatus(403);
  const grupa = !req.body.grupa || String(req.body.grupa).toLowerCase() == "null" ? null : req.body.grupa;
  if (!(await validateGroup(grupa, req.db))) return res.sendStatus(400);
  const sql = "UPDATE tockeInteresa SET grupa = ? WHERE kampId = ? AND ikonica = ? AND deleted IS NOT TRUE;";
  const vars = [grupa, req.body.kampId, req.body.ikonica];
  db.getPool(req.db).execute(sql, vars, (err, result) => {
    if (err) throw err;
    res.sendStatus(202);
  });
};

const getAllVrste = (req, res) => {
  const sql = "SELECT * FROM tockeOstalo;";
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const reorder = async (req, res) => {
  const orderedListOfIds = req.body?.orderedListOfIds;
  const kampId = req.body?.kampId;
  if (!(await validateReorderList(orderedListOfIds, kampId, req.db))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, kampId))) return res.sendStatus(403);

  await updateOrder(orderedListOfIds, req.db);
  return res.sendStatus(202);
};

async function validateReorderList(orderedListOfIds, kampId, database) {
  if (!kampId || !Array.isArray(orderedListOfIds)) return false;
  return orderedListOfIds.every((id) => Number.isSafeInteger(Number(id)) && String(Number(id)) == String(id));
}

async function updateOrder(orderedListOfIds, database) {
  await Promise.all(
    orderedListOfIds.map(
      (id, index) =>
        new Promise((resolve, reject) => {
          const sql = "UPDATE tockeInteresa SET displayIndex = ? WHERE uid = ? AND deleted IS NOT TRUE;";
          const vars = [index, id];
          db.getPool(database).query(sql, vars, (err, result) => {
            if (err) throw err;
            resolve();
          });
        })
    )
  );
}

async function validateTockaInteresa(newTockaInteresa, database) {
  if (
    !newTockaInteresa ||
    !newTockaInteresa.kampId ||
    !newTockaInteresa.naziv ||
    !newTockaInteresa.ikonica ||
    !newTockaInteresa.vrstaPoi
  )
    return false;

  if (!newTockaInteresa.uid) newTockaInteresa.uid = null;
  let returnValue = true;
  let promises = [];
  //naziv mora biti jedinstven:
  promises.push(
    new Promise((resolve, reject) => {
      const sql = `SELECT EXISTS(SELECT * FROM tockeInteresa WHERE naziv='${newTockaInteresa.naziv}' 
      AND kampId=${newTockaInteresa.kampId} AND NOT uid<=>${newTockaInteresa.uid} AND deleted IS NOT TRUE) as value;`;
      db.getPool(database).query(sql, (err, result) => {
        if (err) throw err;
        if (result[0].value === 1) returnValue = false;
        resolve();
      });
    })
  );
  //grupa mora postojati ili ne biti odabrana
  promises.push(validateGroup(newTockaInteresa.grupa, database));
  //vrstaPoi mora postojati
  promises.push(
    new Promise((resolve, reject) => {
      const sql = "SELECT EXISTS (SELECT * FROM tockeOstalo WHERE uid = ?) AS value;";
      const vars = [newTockaInteresa.vrstaPoi];
      db.getPool(database).execute(sql, vars, (err, result) => {
        if (err) throw err;
        if (!result[0].value) returnValue = false;
        resolve();
      });
    })
  );
  await Promise.all(promises);
  return returnValue;
}

async function validateGroup(groupId, database) {
  if (!groupId) return true;
  let valid = false;
  await new Promise((resolve, reject) => {
    const sql = "SELECT EXISTS (SELECT * FROM grupeTocki WHERE uid = ?) AS value;";
    const vars = [groupId];
    db.getPool(database).execute(sql, vars, (err, result) => {
      if (err) throw err;
      if (result[0].value) valid = true;
      resolve();
    });
  });
  return valid;
}

function prepareNewTockaInteresa(newTockaInteresa) {
  //uid ostavljam kakav je

  if (!newTockaInteresa.mapaId) newTockaInteresa.mapaId = null;
  if (!newTockaInteresa.grupa) newTockaInteresa.grupa = null;
  if (!newTockaInteresa.latitude) newTockaInteresa.latitude = null;
  if (!newTockaInteresa.longitude) newTockaInteresa.longitude = null;

  if (!newTockaInteresa.noclick) newTockaInteresa.noclick = false;
  if (!newTockaInteresa.openModal) newTockaInteresa.openModal = false;
  if (!newTockaInteresa.aktivna && !newTockaInteresa.aktivna === false && !newTockaInteresa.aktivna === 0)
    newTockaInteresa.aktivna = true;
  if (!newTockaInteresa.nofilter) newTockaInteresa.nofilter = false;
  if (!newTockaInteresa.navigation && !newTockaInteresa.navigation === false && !newTockaInteresa.navigation === 0)
    newTockaInteresa.navigation = true;
  if (!newTockaInteresa.panorama) newTockaInteresa.panorama = false;

  if (!newTockaInteresa.resort && !(newTockaInteresa.resort === false) && !(newTockaInteresa.resort === 0))
    newTockaInteresa.resort = true;
  if (!newTockaInteresa.camp && !(newTockaInteresa.camp === false) && !(newTockaInteresa.camp === 0))
    newTockaInteresa.camp = true;

  if (!newTockaInteresa.straniKljuc) newTockaInteresa.straniKljuc = null;
  if (!newTockaInteresa.redniBroj) newTockaInteresa.redniBroj = null;

  if (!newTockaInteresa.wwwText) newTockaInteresa.wwwText = "";
  if (!newTockaInteresa.www) newTockaInteresa.www = "";
  if (!newTockaInteresa.opis) newTockaInteresa.opis = "";

  if (!newTockaInteresa.slika) newTockaInteresa.slika = "";
  if (!newTockaInteresa.slika1) newTockaInteresa.slika1 = "";

  return newTockaInteresa;
}

export default {
  getAllTockeInteresa,
  insertTockaInteresa,
  deleteTockaInteresa,
  setGroupToAll,
  getAllVrste,
  reorder,
};
