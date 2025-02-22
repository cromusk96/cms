import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";
import fs from "fs";
import csv from "csvtojson";
import createCsvWriter from "csv-writer";
import path from "path";
const __dirname = path.resolve();

const getAllVrstaSJ = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql = `SELECT * FROM vrstaSJ WHERE kampId = ? AND deleted IS NOT TRUE ORDER BY displayIndex ASC;`;
  const vars = [req.headers.kampid];
  db.getPool(req.db).execute(sql, vars, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const insertVrstaSJ = async (req, res) => {
  let newVrstaSj = req.body;
  if (!(await validateVrstaSJ(newVrstaSj, req.db))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, newVrstaSj.kampId))) return res.sendStatus(403);
  await saveVrstaSj(newVrstaSj, req.db);
  return res.sendStatus(202);
};

const deleteVrstaSJ = async (req, res) => {
  if (!req.headers.kampid || !req.params.uid || isNaN(parseInt(req.params.uid))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql = `UPDATE vrstaSJ SET deleted=TRUE WHERE uid= ? AND kampId= ? ;`;
  const vars = [req.params.uid, req.headers.kampid];
  db.getPool(req.db).execute(sql, vars, (err, results) => {
    if (err) throw err;
    return res.sendStatus(202);
  });
};

const getAllVrstaSJOznake = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql = `SELECT oznaka, naziv, oznakaMish, oznakaPhobs FROM vrstaSJ WHERE kampId= ? AND deleted IS NOT TRUE;`;
  const vars = [req.headers.kampid];
  db.getPool(req.db).execute(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const fromCsv = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);

  let invalidObjects = [];
  let validObjects = [];

  for (const fileKey of Object.keys(req.files)) {
    const jsonObjects = await csv({
      noheader: false,
      delimiter: ";",
      headers: [
        "uid",
        "kampId",
        "oznaka",
        "tip",
        "naziv",
        "oznakaMish",
        "oznakaPhobs",
        "brojOsoba",
        "brojDjece",
        "color",
        "lineColor",
        "slika",
        "slika1",
        "slika2",
        "slika3",
        "slika4",
        "slika5",
        "slika6",
        "slika7",
        "slika8",
        "nofilter",
        "deleted",
        "pmsId",
        "phobsId",
        "bookTocnogBroja",
        "prikaziSveDostupno",
        "pitajBrojTip",
        "nePrikazujBroj",
        "porukaZaBooking",
      ],
    }).fromFile(req.files[fileKey].tempFilePath);

    //obrišem tempFile kad sam gotov s njim
    fs.unlink(req.files[fileKey].tempFilePath, (err) => {
      if (err) console.error(err);
    });

    for (let obj of jsonObjects) {
      obj.kampId = req.headers.kampid;
      if (!obj.uid && obj.oznaka) {
        await new Promise((resolve, reject) => {
          const sql = "SELECT uid FROM vrstaSJ WHERE oznaka = ? AND kampId = ? AND deleted IS NOT TRUE;";
          const vars = [obj.oznaka, obj.kampId];
          db.getPool(req.db).execute(sql, vars, (err, result) => {
            if (result[0]?.uid) {
              obj.uid = result[0].uid;
            }
            resolve();
          });
        });
      }

      if (obj.tip) {
        obj.tip = String(obj.tip).substring(0, 1).toUpperCase();
        if (obj.tip === "G") obj.tip = "M";
      }

      obj.nofilter = functionsBackend.isTrue(obj.nofilter);
      obj.bookTocnogBroja = functionsBackend.isTrue(obj.bookTocnogBroja);
      obj.prikaziSveDostupno = functionsBackend.isTrue(obj.prikaziSveDostupno);
      obj.pitajBrojTip = functionsBackend.isTrue(obj.pitajBrojTip);
      obj.nePrikazujBroj = functionsBackend.isTrue(obj.nePrikazujBroj);

      Object.keys(obj).forEach((key) => {
        if (functionsBackend.shouldTextBeNull(obj[key])) obj[key] = null;
      });

      if (await validateVrstaSJ(obj, req.db)) {
        validObjects.push(obj);
      } else {
        invalidObjects.push(obj);
      }
    }
  }
  if (invalidObjects.length) return res.status(400).json({ invalidObjects });

  let promises = [];
  validObjects.forEach((obj) => {
    promises.push(saveVrstaSj(obj, req.db));
  });
  await Promise.all(promises);
  return res.sendStatus(202);
};

const exportToCsv = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);

  //Create ./tmp folder if it's not there
  if (!fs.existsSync(path.join(__dirname, "tmp"))) {
    fs.mkdirSync(path.join(__dirname, "tmp"));
  }

  const pathToCsv = path.join(__dirname, "tmp", "vrstaSJ.csv");
  const csvWriter = createCsvWriter.createObjectCsvWriter({
    path: pathToCsv,
    fieldDelimiter: ";",
    header: [
      { id: "uid", title: "ID u bazi" },
      { id: "kampId", title: "ID kampa u bazi" },
      { id: "oznaka", title: "Oznaka" },
      { id: "tip", title: "Tip (P-Parcela ili M-Mobilka/Glamping)" },
      { id: "naziv", title: "Naziv" },
      { id: "oznakaMish", title: "Oznaka PMS" },
      { id: "oznakaPhobs", title: "Oznaka PHOBS" },
      { id: "brojOsoba", title: "Max. broj odraslih" },
      { id: "brojDjece", title: "Max. broj djece" },
      { id: "color", title: "Boja" },
      { id: "lineColor", title: "Boja linije" },
      { id: "slika", title: "Panorama" },
      { id: "slika1", title: "slika1" },
      { id: "slika2", title: "slika2" },
      { id: "slika3", title: "slika3" },
      { id: "slika4", title: "slika4" },
      { id: "slika5", title: "slika5" },
      { id: "slika6", title: "slika6" },
      { id: "slika7", title: "slika7" },
      { id: "slika8", title: "slika8" },
      { id: "nofilter", title: "Ne ide u filtere" },
      { id: "deleted", title: "obrisana" },
      { id: "pmsId", title: "PMS ID" },
      { id: "phobsId", title: "PHOBS ID" },
      { id: "bookTocnogBroja", title: "Book točnog broja" },
      {
        id: "prikaziSveDostupno",
        title: "Prikaži sve dostupno ako nije book na točan broj",
      },
      { id: "pitajBrojTip", title: "Pitaj gosta da li želi broj ili samo tip" },
      { id: "nePrikazujBroj", title: "Ne prikazuj broj na mapi" },
      { id: "porukaZaBooking", title: "Poruka za booking" },
    ],
  });
  const sql = `SELECT * FROM vrstaSJ WHERE kampId = ? AND deleted IS NOT TRUE;`;
  const vars = [req.headers.kampid];
  db.getPool(req.db).execute(sql, vars, (err, results) => {
    if (err) throw err;
    csvWriter.writeRecords(results).then(() => {
      res.download(pathToCsv, (err) => {
        if (err) {
          console.error.log(err);
        }
        //obrišem tempFile kad sam gotov s njim
        fs.unlink(pathToCsv, (err) => {
          if (err) console.error(err);
        });
      });
    });
  });
};

const reorderVrstaSj = async (req, res) => {
  const orderedListOfIds = req.body?.orderedListOfIds;
  const kampId = req.body?.kampId;
  if (!(await validateReorderList(orderedListOfIds, kampId, req.db))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, kampId))) return res.sendStatus(403);

  await updateVrstaSjOrder(orderedListOfIds, req.db);
  return res.sendStatus(202);
};

async function validateReorderList(orderedListOfIds, kampId, database) {
  if (!kampId || !Array.isArray(orderedListOfIds)) return false;
  return orderedListOfIds.every((id) => Number.isSafeInteger(Number(id)) && String(Number(id)) == String(id));
}

async function updateVrstaSjOrder(orderedListOfIds, database) {
  await Promise.all(
    orderedListOfIds.map(
      (id, index) =>
        new Promise((resolve, reject) => {
          const sql = "UPDATE vrstaSJ SET displayIndex = ? WHERE uid = ? AND deleted IS NOT TRUE;";
          const vars = [index, id];
          db.getPool(database).query(sql, vars, (err, result) => {
            if (err) throw err;
            resolve();
          });
        })
    )
  );
}

function saveVrstaSj(newVrstaSj, database) {
  newVrstaSj = prepareNewVrstaSJ(newVrstaSj);

  let sql;
  if (!newVrstaSj.uid) {
    sql = `INSERT INTO vrstaSJ(
          kampId, oznaka, tip,
          naziv, oznakaMish, oznakaPhobs, 
          brojOsoba, brojDjece,
          color, lineColor, 
          minRupa, maxRupa,
          slika, virtualTour,
          slika1, slika2, slika3, 
          slika4, slika5, slika6, 
          slika7, slika8, 
          nofilter, pmsId, phobsId,
          bookTocnogBroja, prikaziSveDostupno,
          pitajBrojTip, nePrikazujBroj,
          porukaZaBooking,
          distanceToSea, distanceToShop,
          distanceToWc, distanceToRestaurant
      ) VALUES (
          ${newVrstaSj.kampId}, '${newVrstaSj.oznaka}', '${newVrstaSj.tip}',
          '${newVrstaSj.naziv}', '${newVrstaSj.oznakaMish}', '${newVrstaSj.oznakaPhobs}', 
          ${newVrstaSj.brojOsoba}, ${newVrstaSj.brojDjece}, 
          '${newVrstaSj.color}', '${newVrstaSj.lineColor}',
          ${newVrstaSj.minRupa}, ${newVrstaSj.maxRupa},
          '${newVrstaSj.slika}', '${newVrstaSj.virtualTour}', 
          '${newVrstaSj.slika1}', '${newVrstaSj.slika2}', '${newVrstaSj.slika3}', 
          '${newVrstaSj.slika4}', '${newVrstaSj.slika5}', '${newVrstaSj.slika6}', 
          '${newVrstaSj.slika7}', '${newVrstaSj.slika8}', 
          ${newVrstaSj.nofilter}, '${newVrstaSj.pmsId}', '${newVrstaSj.phobsId}',
          ${newVrstaSj.bookTocnogBroja}, ${newVrstaSj.prikaziSveDostupno},
          ${newVrstaSj.pitajBrojTip}, ${newVrstaSj.nePrikazujBroj},
          '${newVrstaSj.porukaZaBooking}',
          ${newVrstaSj.distanceToSea}, ${newVrstaSj.distanceToShop},
          ${newVrstaSj.distanceToWc}, ${newVrstaSj.distanceToRestaurant}
      );`;
  } else {
    sql = `UPDATE vrstaSJ SET
          kampId=${newVrstaSj.kampId}, oznaka='${newVrstaSj.oznaka}',
          tip='${newVrstaSj.tip}', naziv='${newVrstaSj.naziv}', 
          oznakaMish='${newVrstaSj.oznakaMish}', oznakaPhobs='${newVrstaSj.oznakaPhobs}', 
          brojOsoba=${newVrstaSj.brojOsoba}, brojDjece=${newVrstaSj.brojDjece}, 
          color='${newVrstaSj.color}', lineColor='${newVrstaSj.lineColor}', 
          minRupa=${newVrstaSj.minRupa}, maxRupa=${newVrstaSj.maxRupa}, 
          slika='${newVrstaSj.slika}', virtualTour='${newVrstaSj.virtualTour}', 
          slika1='${newVrstaSj.slika1}', slika2='${newVrstaSj.slika2}', 
          slika3='${newVrstaSj.slika3}', slika4='${newVrstaSj.slika4}', 
          slika5='${newVrstaSj.slika5}', slika6='${newVrstaSj.slika6}',
          slika7='${newVrstaSj.slika7}', slika8='${newVrstaSj.slika8}', 
          nofilter=${newVrstaSj.nofilter},
          pmsId='${newVrstaSj.pmsId}', phobsId='${newVrstaSj.phobsId}',
          bookTocnogBroja=${newVrstaSj.bookTocnogBroja},
          prikaziSveDostupno=${newVrstaSj.prikaziSveDostupno},
          pitajBrojTip=${newVrstaSj.pitajBrojTip},
          nePrikazujBroj=${newVrstaSj.nePrikazujBroj},
          porukaZaBooking='${newVrstaSj.porukaZaBooking}',
          distanceToSea=${newVrstaSj.distanceToSea}, distanceToShop=${newVrstaSj.distanceToShop},
          distanceToWc=${newVrstaSj.distanceToWc}, distanceToRestaurant=${newVrstaSj.distanceToRestaurant}
      WHERE uid = ${newVrstaSj.uid};`;
  }

  return new Promise((resolve, reject) => {
    db.getPool(database).query(sql, (err, result) => {
      if (err) throw err;
      const vrstaSjId = newVrstaSj.uid ? newVrstaSj.uid : result.insertId;
      const currentYear = new Date().getFullYear();
      const sql = "SELECT uid FROM cjenici WHERE godina = ? AND vrstaSjId = ?;";
      const vars = [currentYear, vrstaSjId];
      db.getPool(database).execute(sql, vars, (err, results) => {
        if (err) throw err;
        let sql, vars;
        if (results[0]?.uid) {
          sql = "UPDATE cjenici SET phobsCjenik = ? WHERE uid = ?;";
          vars = [newVrstaSj.phobsCjenik, results[0].uid];
        } else {
          sql = "INSERT INTO cjenici(godina,vrstaSjId,phobsCjenik) VALUES (?,?,?);";
          vars = [currentYear, vrstaSjId, newVrstaSj.phobsCjenik];
        }
        db.getPool(database).execute(sql, vars, (err, result) => {
          if (err) throw err;
          resolve();
        });
      });
    });
  });
}

async function validateVrstaSJ(newVrstaSj, database) {
  if (
    !newVrstaSj ||
    !newVrstaSj.tip ||
    !newVrstaSj.oznaka ||
    !newVrstaSj.naziv ||
    !newVrstaSj.oznakaMish ||
    !newVrstaSj.oznakaPhobs
  )
    return false;
  if (newVrstaSj.tip != "P" && newVrstaSj.tip != "M" && newVrstaSj.tip != "A") return false;

  if (!newVrstaSj.uid) newVrstaSj.uid = null;
  let returnValue = true;
  let promises = [];
  //oznaka mora biti jedinstvena:
  promises.push(
    new Promise((resolve, reject) => {
      const sql = `SELECT EXISTS(SELECT * FROM vrstaSJ WHERE oznaka='${newVrstaSj.oznaka}' 
    AND kampId=${newVrstaSj.kampId} AND NOT uid<=>${newVrstaSj.uid} AND deleted IS NOT TRUE) as value;`;
      db.getPool(database).query(sql, (err, result) => {
        if (err) throw err;
        if (result[0].value === 1) returnValue = false;
        resolve();
      });
    })
  );
  //oznakaMish mora biti jedinstvena:
  promises.push(
    new Promise((resolve, reject) => {
      const sql = `SELECT EXISTS(SELECT * FROM vrstaSJ WHERE oznakaMish='${newVrstaSj.oznakaMish}' 
    AND kampId=${newVrstaSj.kampId} AND NOT uid<=>${newVrstaSj.uid} AND deleted IS NOT TRUE) as value;`;
      db.getPool(database).query(sql, (err, result) => {
        if (err) throw err;
        if (result[0].value === 1) returnValue = false;
        resolve();
      });
    })
  );
  await Promise.all(promises);
  return returnValue;
}

function prepareNewVrstaSJ(newVrstaSj) {
  //uid ostavljam kakav je

  if (!newVrstaSj.brojOsoba) newVrstaSj.brojOsoba = null;
  if (!newVrstaSj.brojDjece) newVrstaSj.brojDjece = null;

  if (!newVrstaSj.minRupa && newVrstaSj.minRupa !== 0) newVrstaSj.minRupa = null;
  if (!newVrstaSj.maxRupa && newVrstaSj.maxRupa !== 0) newVrstaSj.maxRupa = null;

  if (!newVrstaSj.color) newVrstaSj.color = "";
  if (!newVrstaSj.lineColor) newVrstaSj.lineColor = "";

  if (!newVrstaSj.slika) newVrstaSj.slika = "";
  if (!newVrstaSj.virtualTour) newVrstaSj.virtualTour = "";
  if (!newVrstaSj.slika1) newVrstaSj.slika1 = "";
  if (!newVrstaSj.slika2) newVrstaSj.slika2 = "";
  if (!newVrstaSj.slika3) newVrstaSj.slika3 = "";
  if (!newVrstaSj.slika4) newVrstaSj.slika4 = "";
  if (!newVrstaSj.slika5) newVrstaSj.slika5 = "";
  if (!newVrstaSj.slika6) newVrstaSj.slika6 = "";
  if (!newVrstaSj.slika7) newVrstaSj.slika7 = "";
  if (!newVrstaSj.slika8) newVrstaSj.slika8 = "";

  if (!newVrstaSj.nofilter) newVrstaSj.nofilter = false;

  if (!newVrstaSj.pmsId) newVrstaSj.pmsId = "";
  if (!newVrstaSj.phobsId) newVrstaSj.phobsId = "";
  if (!newVrstaSj.phobsCjenik) newVrstaSj.phobsCjenik = null; //this one is on the other table

  if (!newVrstaSj.bookTocnogBroja && newVrstaSj.bookTocnogBroja !== false && newVrstaSj.bookTocnogBroja !== 0)
    newVrstaSj.bookTocnogBroja = true;
  if (!newVrstaSj.prikaziSveDostupno) newVrstaSj.prikaziSveDostupno = false;
  if (!newVrstaSj.pitajBrojTip) newVrstaSj.pitajBrojTip = false;
  if (!newVrstaSj.nePrikazujBroj) newVrstaSj.nePrikazujBroj = false;
  if (!newVrstaSj.porukaZaBooking) newVrstaSj.porukaZaBooking = "";

  if (!newVrstaSj.distanceToSea && newVrstaSj.distanceToSea !== false && newVrstaSj.distanceToSea !== 0)
    newVrstaSj.distanceToSea = true;

  if (!newVrstaSj.distanceToShop) newVrstaSj.distanceToShop = false;
  if (!newVrstaSj.distanceToWc) newVrstaSj.distanceToWc = false;
  if (!newVrstaSj.distanceToRestaurant) newVrstaSj.distanceToRestaurant = false;

  return newVrstaSj;
}

export default {
  getAllVrstaSJ,
  insertVrstaSJ,
  deleteVrstaSJ,
  getAllVrstaSJOznake,
  fromCsv,
  exportToCsv,
  reorderVrstaSj,
};
