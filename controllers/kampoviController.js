import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";
import path from "path";
import fs from "fs";
import functions from "../functionsBackend.js";
const __dirname = path.resolve();

const getAllKampovi = async (req, res) => {
  let sql;
  if (await functionsBackend.isAdmin(req.db, req.userId)) sql = "SELECT * FROM kampovi WHERE deleted IS NOT TRUE;";
  else
    sql = `SELECT * FROM kampovi WHERE deleted IS NOT TRUE 
  AND uid IN (SELECT kampId FROM userkamp WHERE userId='${req.userId}');`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const getKamp = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql = `SELECT * FROM kampovi WHERE uid=${req.headers.kampid} AND deleted IS NOT TRUE;`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.send(results[0]);
  });
};

const insertKamp = async (req, res) => {
  let newKamp = req.body;
  if (!(await validateKamp(newKamp, req.db))) return res.sendStatus(400);
  newKamp = prepareNewKamp(newKamp);

  let sql;
  let status = 400;
  if (!newKamp.uid) {
    if (!(await functionsBackend.isAdmin(req.db, req.userId))) return res.sendStatus(403);
    sql = `INSERT INTO kampovi(
        naziv, dodatniNaziv, logo, 
        defaultSlika, adresa, mjesto, 
        drzava, telefon, mail,
        www, latitude, longitude, 
        otvorenOd, otvorenDo, 
        minDanRez, minDanRezMobilke, cuvanjeRezMinuta, 
        rezParcelaStartDate, rezMobilkaStartDate,
        brojOsoba, brojDjece,
        brojOsobaMh, brojDjeceMh,
        phobsIdParcele, phobsIdMobilke,
        bookingModul, zatvoriBooking, 
        panomiframe, sortFilterRb,
        upitVidljivo, nazivHeader, maintenanceMode,
        imaParcele, imaMh, navigacija,
        showDistances, paymentGateway, 
        filterAsButton, loyalty, popunjavanjeRupa,
        phobs_username, phobs_password,
        phobs_siteid, propertyid, 
        pmsApiKey, pmsToken, 
        defaultRateId, rateIdParcele,
        mapboxToken, geojsonFile,
        hr, en, de, it, 
        nl, ru, si, pl
      ) VALUES (
        '${newKamp.naziv}', '${newKamp.dodatniNaziv}', '${newKamp.logo}', 
        '${newKamp.defaultSlika}', '${newKamp.adresa}', '${newKamp.mjesto}', 
        '${newKamp.drzava}', '${newKamp.telefon}', '${newKamp.mail}',
        '${newKamp.www}', ${newKamp.latitude}, ${newKamp.longitude},
        '${newKamp.otvorenOd}', '${newKamp.otvorenDo}', 
        ${newKamp.minDanRez}, ${newKamp.minDanRezMobilke}, ${newKamp.cuvanjeRezMinuta}, 
        '${newKamp.rezParcelaStartDate}', '${newKamp.rezMobilkaStartDate}', 
        ${newKamp.brojOsoba}, ${newKamp.brojDjece}, 
        ${newKamp.brojOsobaMh}, ${newKamp.brojDjeceMh}, 
        '${newKamp.phobsIdParcele}', '${newKamp.phobsIdMobilke}',
        ${newKamp.bookingModul}, ${newKamp.zatvoriBooking}, 
        ${newKamp.panomiframe}, ${newKamp.sortFilterRb},
        ${newKamp.upitVidljivo}, ${newKamp.nazivHeader}, ${newKamp.maintenanceMode},
        ${newKamp.imaParcele}, ${newKamp.imaMh}, ${newKamp.navigacija},
        ${newKamp.showDistances}, ${newKamp.paymentGateway}, 
        ${newKamp.filterAsButton}, ${newKamp.loyalty}, ${newKamp.popunjavanjeRupa}, 
        '${newKamp.phobs_username}', '${newKamp.phobs_password}',
        '${newKamp.phobs_siteid}', '${newKamp.propertyid}',
        '${newKamp.pmsApiKey}', '${newKamp.pmsToken}', 
        '${newKamp.defaultRateId}', '${newKamp.rateIdParcele}' ,
        '${newKamp.mapboxToken}' , '${newKamp.geojsonFile}' ,
        ${newKamp.hr}, ${newKamp.en}, ${newKamp.de}, ${newKamp.it}, 
        ${newKamp.nl}, ${newKamp.ru}, ${newKamp.si}, ${newKamp.pl}
      );`;
    status = 201;
    db.getPool(req.db).getConnection((err, con) => {
      if (err) throw err;
      con.query(sql, (err, results) => {
        if (err) throw err;
        sql = `INSERT INTO userkamp (userId, kampId) VALUES ('${req.userId}', LAST_INSERT_ID());`;
        con.query(sql, (err, results) => {
          con.release();
          if (err) throw err;
          return res.sendStatus(status);
        });
      });
    });
  } else {
    sql = `UPDATE kampovi SET
        naziv='${newKamp.naziv}', dodatniNaziv='${newKamp.dodatniNaziv}', 
        logo='${newKamp.logo}', defaultSlika='${newKamp.defaultSlika}', 
        adresa='${newKamp.adresa}', mjesto='${newKamp.mjesto}', drzava='${newKamp.drzava}', 
        telefon='${newKamp.telefon}', mail='${newKamp.mail}',  www='${newKamp.www}', 
        latitude=${newKamp.latitude}, longitude=${newKamp.longitude}, 
        otvorenOd='${newKamp.otvorenOd}', otvorenDo='${newKamp.otvorenDo}', 
        minDanRez=${newKamp.minDanRez}, minDanRezMobilke=${newKamp.minDanRezMobilke}, 
        cuvanjeRezMinuta=${newKamp.cuvanjeRezMinuta}, 
        rezParcelaStartDate='${newKamp.rezParcelaStartDate}', 
        rezMobilkaStartDate='${newKamp.rezMobilkaStartDate}',
        brojOsoba=${newKamp.brojOsoba}, brojDjece=${newKamp.brojDjece}, 
        brojOsobaMh=${newKamp.brojOsobaMh}, brojDjeceMh=${newKamp.brojDjeceMh}, 
        phobsIdParcele='${newKamp.phobsIdParcele}', phobsIdMobilke='${newKamp.phobsIdMobilke}', 
        bookingModul=${newKamp.bookingModul}, zatvoriBooking=${newKamp.zatvoriBooking}, 
        panomiframe=${newKamp.panomiframe}, sortFilterRb=${newKamp.sortFilterRb}, 
        upitVidljivo=${newKamp.upitVidljivo}, nazivHeader=${newKamp.nazivHeader}, 
        maintenanceMode=${newKamp.maintenanceMode}, 
        imaParcele=${newKamp.imaParcele}, imaMh=${newKamp.imaMh}, 
        navigacija=${newKamp.navigacija}, showDistances=${newKamp.showDistances}, 
        paymentGateway=${newKamp.paymentGateway}, filterAsButton=${newKamp.filterAsButton},
        loyalty=${newKamp.loyalty}, popunjavanjeRupa=${newKamp.popunjavanjeRupa}, 
        phobs_username='${newKamp.phobs_username}', phobs_password='${newKamp.phobs_password}',
        phobs_siteid='${newKamp.phobs_siteid}', propertyid='${newKamp.propertyid}', 
        pmsApiKey='${newKamp.pmsApiKey}', pmsToken='${newKamp.pmsToken}', 
        defaultRateId='${newKamp.defaultRateId}', rateIdParcele='${newKamp.rateIdParcele}',
        mapboxToken='${newKamp.mapboxToken}', geojsonFile='${newKamp.geojsonFile}',
        hr=${newKamp.hr}, en=${newKamp.en}, de=${newKamp.de}, it=${newKamp.it}, 
        nl=${newKamp.nl}, ru=${newKamp.ru}, si=${newKamp.si}, pl=${newKamp.pl}
      WHERE uid = ${newKamp.uid};`;
    status = 202;
    db.getPool(req.db).query(sql, (err, results) => {
      if (err) throw err;
      return res.sendStatus(status);
    });
  }
};

const deleteKamp = async (req, res) => {
  if (!req.params.uid || isNaN(parseInt(req.params.uid))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.params.uid))) return res.sendStatus(403);
  const sql = `UPDATE kampovi SET deleted=TRUE WHERE uid=${req.params.uid};`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    const sql2 = `UPDATE periodi SET deleted=TRUE WHERE kampId=${req.params.uid};`;
    db.getPool(req.db).query(sql2, (err, results) => {
      if (err) throw err;
      return res.sendStatus(202);
    });
  });
};

const getDefaultKamp = async (req, res) => {
  let sql;
  if (await functionsBackend.isAdmin(req.db, req.userId))
    sql = "SELECT uid, naziv FROM kampovi WHERE deleted IS NOT TRUE LIMIT 1;";
  else
    sql = `SELECT uid, naziv FROM kampovi WHERE deleted IS NOT TRUE 
      AND uid IN (SELECT kampId FROM userkamp WHERE userId=${req.userId}) LIMIT 1;`;
  db.getPool(req.db).query(sql, (err, result) => {
    if (err) throw err;
    if (result.length == 0) return res.send({});
    return res.send(result[0]);
  });
};

const getKampoviList = (req, res) => {
  if (!req.params.grupacija) return res.sendStatus(400);
  const sql = "SELECT uid, naziv, logo FROM kampovi WHERE deleted IS NOT TRUE;";
  db.getPool("ca_" + String(req.params.grupacija).toLowerCase()).query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.sendStatus(500);
    }
    res.send(results);
  });
};

const recieveGeojsonFile = (req, res) => {
  //TODO napraviti folder za svaki kamp?
  //TODO path-ovi do geojson-a bi trebali biti u .env file-u
  if (!req.headers.kampid) return res.sendStatus(400);

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  Object.keys(req.files).forEach((key) => {
    const pathToFile = path.join(__dirname, "..", "app", "kamp", "assets", "gj", req.files[key].name);
    const pathToBackup = path.join(
      __dirname,
      "..",
      "app",
      "kamp",
      "assets",
      "gj",
      req.files[key].name.replace(".", "_backup.")
    );

    try {
      if (fs.existsSync(pathToFile)) fs.copyFileSync(pathToFile, pathToBackup);
    } catch (err) {
      console.error(err);
      return res.sendStatus(500);
    }

    req.files[key].mv(pathToFile, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err.toString());
      }
      const error =  await functions.updateGeojson(pathToFile, req.db, req.headers.kampid);
      if (error) return res.status(500).send(error.toString());
      return res.sendStatus(201);
    });
  });
};

const revertToBackupGeojson = async (req, res) => {
  if (!req.headers.kampid && !req.body.kampId) return res.sendStatus(400);

  const kampId = req.headers.kampid || req.body.kampId;

  let filename;
  await new Promise((resolve, reject) => {
    const sql = "SELECT geojsonFile FROM kampovi WHERE uid=? AND deleted IS NOT TRUE;";
    const vars = [kampId];
    db.getPool(req.db).execute(sql, vars, (err, result) => {
      if (err) throw err;
      filename = result[0]?.geojsonFile;
      resolve();
    });
  });
  if (!filename) return res.sendStatus(404);
  const pathToFile = path.join(__dirname, "..", "app", "kamp", "assets", "gj", filename);
  const pathToBackup = path.join(__dirname, "..", "app", "kamp", "assets", "gj", filename.replace(".", "_backup."));

  if (!fs.existsSync(pathToBackup)) return res.sendStatus(404);
  fs.copyFileSync(pathToBackup, pathToFile);
  return res.sendStatus(200);
};

async function validateKamp(newKamp, database) {
  if (!newKamp || !newKamp.naziv || !newKamp.phobsIdParcele || !newKamp.phobsIdMobilke) return false;

  //barem jedan jezik mora biti označen
  if (
    (newKamp.hr === false || newKamp.hr === 0) &&
    (newKamp.en === false || newKamp.en === 0) &&
    (newKamp.de === false || newKamp.de === 0) &&
    (newKamp.it === false || newKamp.it === 0) &&
    (newKamp.nl === false || newKamp.nl === 0) &&
    (newKamp.ru === false || newKamp.ru === 0) &&
    (newKamp.si === false || newKamp.si === 0) &&
    (newKamp.pl === false || newKamp.pl === 0)
  )
    return false;

  if (!newKamp.uid) newKamp.uid = null;
  let returnValue = true;
  let promises = [];
  //PHOBS ID-jevi moraju biti unique
  promises.push(
    new Promise((resolve, reject) => {
      const sql = `SELECT EXISTS(SELECT * FROM kampovi WHERE 
      phobsIdParcele='${newKamp.phobsIdParcele}' AND NOT uid<=>${newKamp.uid} 
      AND deleted IS NOT TRUE) as value;`; //Ne provjerava kampId, valjda je to ok
      db.getPool(database).query(sql, (err, result) => {
        if (err) throw err;
        if (result[0].value) returnValue = false;
        resolve();
      });
    })
  );
  promises.push(
    new Promise((resolve, reject) => {
      const sql = `SELECT EXISTS(SELECT * FROM kampovi WHERE 
      phobsIdMobilke='${newKamp.phobsIdMobilke}' AND NOT uid<=>${newKamp.uid} 
      AND deleted IS NOT TRUE) as value;`; //Ne provjerava kampId, valjda je to ok
      db.getPool(database).query(sql, (err, result) => {
        if (err) throw err;
        if (result[0].value) returnValue = false;
        resolve();
      });
    })
  );
  //Popunjavanje rupa mora biti false ako nisu platili
  promises.push(
    new Promise(async (resolve, reject) => {
      if (!(await functionsBackend.isPaid(database, "popunjavanje_rupa"))) newKamp.popunjavanjeRupa = false;
      resolve();
    })
  );
  await Promise.all(promises);
  return returnValue;
}

function prepareNewKamp(newKamp) {
  //uid ostavljam kakav je

  if (!newKamp.dodatniNaziv) newKamp.dodatniNaziv = "";
  if (!newKamp.logo) newKamp.logo = "";
  if (!newKamp.defaultSlika) newKamp.defaultSlika = "";

  if (!newKamp.adresa) newKamp.adresa = "";
  if (!newKamp.mjesto) newKamp.mjesto = "";
  if (!newKamp.drzava) newKamp.drzava = "";

  if (!newKamp.telefon) newKamp.telefon = "";
  if (!newKamp.mail) newKamp.mail = "";

  if (!newKamp.www) newKamp.www = "";

  if (!newKamp.latitude) newKamp.latitude = null;
  if (!newKamp.longitude) newKamp.longitude = null;

  if (!newKamp.otvorenOd) newKamp.otvorenOd = "";
  if (!newKamp.otvorenDo) newKamp.otvorenDo = "";

  if (!newKamp.minDanRez) newKamp.minDanRez = 0;
  if (!newKamp.minDanRezMobilke) newKamp.minDanRezMobilke = 0;
  if (!newKamp.cuvanjeRezMinuta) newKamp.cuvanjeRezMinuta = null;

  if (!newKamp.rezParcelaStartDate) newKamp.rezParcelaStartDate = "";
  if (!newKamp.rezMobilkaStartDate) newKamp.rezMobilkaStartDate = "";

  if (!newKamp.brojOsoba) newKamp.brojOsoba = null;
  if (!newKamp.brojDjece) newKamp.brojDjece = null;
  if (!newKamp.brojOsobaMh) newKamp.brojOsobaMh = null;
  if (!newKamp.brojDjeceMh) newKamp.brojDjeceMh = null;

  if (!newKamp.phobsIdParcele) newKamp.phobsIdParcele = null;
  if (!newKamp.phobsIdMobilke) newKamp.phobsIdMobilke = null;

  if (!newKamp.bookingModul) newKamp.bookingModul = false;
  if (!newKamp.zatvoriBooking) newKamp.zatvoriBooking = false;
  if (!newKamp.panomiframe) newKamp.panomiframe = false;
  if (!newKamp.sortFilterRb) newKamp.sortFilterRb = false;
  if (!newKamp.upitVidljivo) newKamp.upitVidljivo = false;
  if (!newKamp.nazivHeader) newKamp.nazivHeader = false;
  if (!newKamp.maintenanceMode) newKamp.maintenanceMode = false;
  if (!newKamp.showDistances) newKamp.showDistances = false;
  if (!newKamp.paymentGateway) newKamp.paymentGateway = false;
  if (!newKamp.filterAsButton) newKamp.filterAsButton = false;
  if (!newKamp.loyalty) newKamp.loyalty = false;
  if (!newKamp.popunjavanjeRupa) newKamp.popunjavanjeRupa = false;

  if (!newKamp.imaParcele && !(newKamp.imaParcele === false) && !(newKamp.imaParcele === 0)) newKamp.imaParcele = true;
  if (!newKamp.imaMh && !(newKamp.imaMh === false) && !(newKamp.imaMh === 0)) newKamp.imaMh = true;
  if (!newKamp.navigacija && newKamp.navigacija !== false && newKamp.navigacija !== 0) newKamp.navigacija = true;

  if (!newKamp.phobs_username) newKamp.phobs_username = "";
  if (!newKamp.phobs_password) newKamp.phobs_password = "";
  if (!newKamp.phobs_siteid) newKamp.phobs_siteid = "";
  if (!newKamp.propertyid) newKamp.propertyid = "";
  if (!newKamp.pmsApiKey) newKamp.pmsApiKey = "";
  if (!newKamp.pmsToken) newKamp.pmsToken = "";
  if (!newKamp.defaultRateId) newKamp.defaultRateId = "";
  if (!newKamp.rateIdParcele) newKamp.rateIdParcele = "";
  if (!newKamp.mapboxToken) newKamp.mapboxToken = "";
  if (!newKamp.geojsonFile) newKamp.geojsonFile = "";

  if (!newKamp.hr && !(newKamp.hr === false) && !(newKamp.hr === 0)) newKamp.hr = true;
  if (!newKamp.en && !(newKamp.en === false) && !(newKamp.en === 0)) newKamp.en = true;
  if (!newKamp.de && !(newKamp.de === false) && !(newKamp.de === 0)) newKamp.de = true;
  if (!newKamp.it && !(newKamp.it === false) && !(newKamp.it === 0)) newKamp.it = true;
  if (!newKamp.nl && !(newKamp.nl === false) && !(newKamp.nl === 0)) newKamp.nl = true;
  if (!newKamp.ru && !(newKamp.ru === false) && !(newKamp.ru === 0)) newKamp.ru = true;
  if (!newKamp.si && !(newKamp.si === false) && !(newKamp.si === 0)) newKamp.si = true;
  if (!newKamp.pl && !(newKamp.pl === false) && !(newKamp.pl === 0)) newKamp.pl = true;

  return newKamp;
}

export default {
  getAllKampovi,
  getKamp,
  insertKamp,
  deleteKamp,
  getDefaultKamp,
  getKampoviList,
  recieveGeojsonFile,
  revertToBackupGeojson,
};
