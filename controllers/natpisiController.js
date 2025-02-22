import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";

const getAllNatpisi = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql = `SELECT * FROM natpisi WHERE kampId = ? AND deleted IS NOT TRUE;`;
  db.getPool(req.db).execute(sql, [req.headers.kampid], (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const insertNatpis = async (req, res) => {
  let newNatpis = req.body; //MOZDA refactorat insertove da nemoram validate-at objekt prije checkPriviledges
  if (!validateNatpis(newNatpis)) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, newNatpis.kampId))) return res.sendStatus(403);
  newNatpis = prepareNewNatpis(newNatpis);

  let sql;
  let status = 400;
  let vars = [
    newNatpis.kampId,
    newNatpis.mapId,
    newNatpis.text,

    newNatpis.latitude,
    newNatpis.longitude,
    newNatpis.rotation,

    newNatpis.color,
    newNatpis.halo,
    newNatpis.halowidth,

    newNatpis.fontMin,
    newNatpis.fontMax,
    newNatpis.active,
    newNatpis.poravnaj,
    newNatpis.textRotationAlignment,
  ];
  if (!newNatpis.uid) {
    sql = `INSERT INTO natpisi(
        kampId, mapId, text, 
        latitude, longitude, rotation, 
        color, halo, halowidth, 
        fontMin, fontMax, 
        active, poravnaj, textRotationAlignment
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, 
        ?, ?, ?, 
        ?, ?, 
        ?, ?, ?
      );`;
    status = 201;
  } else {
    sql = `UPDATE natpisi SET
        kampId = ? , mapId = ? , text = ? ,
        latitude = ? , longitude = ? , rotation = ? , 
        color = ? , halo = ? , halowidth = ? , 
        fontMin = ? , fontMax = ? ,
        active = ? , poravnaj = ? ,
        textRotationAlignment = ? 
      WHERE uid = ? ;`;
    vars.push(newNatpis.uid);
    status = 202;
  }
  db.getPool(req.db).execute(sql, vars, (err, results) => {
    if (err) throw err;
    return res.sendStatus(status);
  });
};

const deleteNatpis = async (req, res) => {
  if (!req.headers.kampid || !req.params.uid || isNaN(parseInt(req.params.uid))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql = `UPDATE natpisi SET deleted=TRUE WHERE uid = ? AND kampId = ? ;`;
  const vars = [req.params.uid, req.headers.kampid];
  db.getPool(req.db).execute(sql, vars, (err, results) => {
    if (err) throw err;
    return res.sendStatus(202);
  });
};

function validateNatpis(newNatpis) {
  if (!newNatpis || !newNatpis.kampId) return false;
  //Font Max mora biti veći od font min ako su oboje uneseni
  if (newNatpis.fontMin && newNatpis.fontMax && Number(newNatpis.fontMin) > Number(newNatpis.fontMax)) return false;

  if (newNatpis.textRotationAlignment && !["auto", "viewport", "map"].includes(newNatpis.textRotationAlignment))
    return false;

  return true;
}

function prepareNewNatpis(newNatpis) {
  //uid ostavljam kakav je

  if (!newNatpis.mapId) newNatpis.mapId = null;
  if (!newNatpis.text) newNatpis.text = null;

  if (!newNatpis.latitude) newNatpis.latitude = null;
  if (!newNatpis.longitude) newNatpis.longitude = null;
  if (!newNatpis.rotation) newNatpis.rotation = null;

  if (!newNatpis.color) newNatpis.color = null;
  if (!newNatpis.halo) newNatpis.halo = null;

  if (!newNatpis.halowidth) newNatpis.halowidth = 0;

  if (!newNatpis.fontMin) newNatpis.fontMin = null;
  if (!newNatpis.fontMax) newNatpis.fontMax = null;

  if (!newNatpis.active && !newNatpis.active === false && !newNatpis.active === 0) newNatpis.active = true;

  if (!newNatpis.poravnaj) newNatpis.poravnaj = false;

  if (!newNatpis.textRotationAlignment) newNatpis.textRotationAlignment = "auto";

  return newNatpis;
}

export default {
  getAllNatpisi,
  insertNatpis,
  deleteNatpis,
};
