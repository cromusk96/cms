import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";
const kraticeDana = ["ned", "pon", "uto", "sri", "cet", "pet", "sub"];

const getObjekti = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql = `SELECT * FROM objekti WHERE kampId = ? AND deleted IS NOT TRUE;`;
  const vars = [req.headers.kampid];
  db.getPool(req.db).execute(sql, vars, (err, objekti) => {
    if (err) throw err;
    const sql =
      "SELECT neradniPeriodi.uid, objektId, datumOd, datumDo " +
      "FROM neradniPeriodi JOIN objekti ON neradniPeriodi.objektId = objekti.uid " +
      "WHERE kampId = ? AND deleted IS NOT TRUE;"; //vars je dobar od prije
    //MOZDA to napraviti s jednim pozivom na bazu. SELECT * FROM objekti JOIN periodi... pa presložiti
    db.getPool(req.db).execute(sql, vars, (err, periodi) => {
      if (err) throw err;
      let periodiDict = {};
      objekti.forEach((o) => (periodiDict[o.uid] = [])); //init
      periodi.forEach((p) => periodiDict[p.objektId].push(p)); //build
      objekti.forEach((o) => (o.neradniPeriodi = periodiDict[o.uid])); //assign
      res.send(objekti);
    });
  });
};

const getAllObjekti = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId))) return res.sendStatus(403);
  const sql = "SELECT * FROM objekti WHERE deleted IS NOT TRUE;";
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
    //Neradni periodi netrebaju zasad
  });
};

const insertObjekt = async (req, res) => {
  let newObjekt = req.body; //MOZDA refactorat insertove da nemoram validate-at objekt prije checkPriviledges
  if (!(await validateObjekt(newObjekt, req.db))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, newObjekt.kampId))) return res.sendStatus(403);
  newObjekt = prepareNewObjekt(newObjekt);

  let sql;
  let vars = [
    newObjekt.kampId,
    newObjekt.vrstaObjektaUid,
    newObjekt.mapaId,
    newObjekt.naziv,
    newObjekt.podnaziv,
    newObjekt.telefon,
    newObjekt.mail,
    newObjekt.adresa,
    newObjekt.www,
    newObjekt.cjenikUrl,
    newObjekt.mjesto,
    newObjekt.drzava,
    newObjekt.radno_vrijeme,
    newObjekt.cjenikText,
    newObjekt.urlText,
    newObjekt.noclick,
    newObjekt.openModal,
    newObjekt.noteHeader,
    newObjekt.overheadText,
    newObjekt.recommended,
    newObjekt.resort,
    newObjekt.camp,
    newObjekt.slika,
    newObjekt.slika1,
    newObjekt.slika2,
    newObjekt.slika3,
    newObjekt.slika4,
    newObjekt.slika5,
    newObjekt.slika6,
    newObjekt.slika7,
    newObjekt.slika8,
    newObjekt.napomena_hr,
    newObjekt.napomena_en,
    newObjekt.napomena_de,
    newObjekt.napomena_it,
    newObjekt.napomena_nl,
    newObjekt.napomena_ru,
    newObjekt.napomena_si,
    newObjekt.napomena_pl,
    newObjekt.sink,
    newObjekt.shower,
    newObjekt.childrenToilet,
    newObjekt.chemicalToilet,
    newObjekt.disabledToilet,
    newObjekt.privateToilet,
    newObjekt.clothingWash,
    newObjekt.dishWash,
    newObjekt.laundry,
    newObjekt.dryer,
    newObjekt.dogShower,
    newObjekt.refrigerator,
    newObjekt.ambulanta,
    newObjekt.bar,
    newObjekt.restaurant,
    newObjekt.wellness,
    newObjekt.hairdresser,
    newObjekt.fitness,
    newObjekt.kiosk,

    newObjekt.ponOd1,
    newObjekt.ponDo1,
    newObjekt.ponOd2,
    newObjekt.ponDo2,

    newObjekt.utoOd1,
    newObjekt.utoDo1,
    newObjekt.utoOd2,
    newObjekt.utoDo2,

    newObjekt.sriOd1,
    newObjekt.sriDo1,
    newObjekt.sriOd2,
    newObjekt.sriDo2,

    newObjekt.cetOd1,
    newObjekt.cetDo1,
    newObjekt.cetOd2,
    newObjekt.cetDo2,

    newObjekt.petOd1,
    newObjekt.petDo1,
    newObjekt.petOd2,
    newObjekt.petDo2,

    newObjekt.subOd1,
    newObjekt.subDo1,
    newObjekt.subOd2,
    newObjekt.subDo2,

    newObjekt.nedOd1,
    newObjekt.nedDo1,
    newObjekt.nedOd2,
    newObjekt.nedDo2,
  ];
  let status = 400;
  //MOZDA refactorat ovo da radi sa template-om kao u bt_senzorima
  if (!newObjekt.uid) {
    sql = `INSERT INTO objekti(
        kampId, vrstaObjektaUid, mapaId,
        naziv, podnaziv, telefon, 
        mail, adresa, www, cjenikUrl,
        mjesto, drzava, radno_vrijeme, 
        cjenikText, urlText,
        noclick, openModal, noteHeader, overheadText, recommended,
        resort, camp,
        slika,
        slika1, slika2, slika3, 
        slika4, slika5, slika6,  
        slika7, slika8,
        napomena_hr, napomena_en, napomena_de, 
        napomena_it, napomena_nl, napomena_ru, 
        napomena_si, napomena_pl, 
        sink, shower, childrenToilet, 
        chemicalToilet, disabledToilet, privateToilet, 
        clothingWash, dishWash, laundry,  
        dryer, dogShower, refrigerator,
        ambulanta, bar, restaurant, 
        wellness, hairdresser, fitness, 
        kiosk,
        ponOd1, ponDo1, ponOd2, ponDo2, 
        utoOd1, utoDo1, utoOd2, utoDo2, 
        sriOd1, sriDo1, sriOd2, sriDo2, 
        cetOd1, cetDo1, cetOd2, cetDo2, 
        petOd1, petDo1, petOd2, petDo2, 
        subOd1, subDo1, subOd2, subDo2, 
        nedOd1, nedDo1, nedOd2, nedDo2
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, 
        ?, ?, ?, ?,
        ?, ?, ?, 
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?,
        ?,
        ?, ?, ?, 
        ?, ?, ?,  
        ?, ?,
        ?, ?, ?, 
        ?, ?, ?, 
        ?, ?, 
        ?, ?, ?, 
        ?, ?, ?, 
        ?, ?, ?,  
        ?, ?, ?,
        ?, ?, ?, 
        ?, ?, ?, 
        ?,
        ?, ?, ?, ?, 
        ?, ?, ?, ?, 
        ?, ?, ?, ?, 
        ?, ?, ?, ?, 
        ?, ?, ?, ?, 
        ?, ?, ?, ?, 
        ?, ?, ?, ?
      );`;
    status = 201;
  } else {
    sql = `UPDATE objekti SET
    kampId = ?, vrstaObjektaUid = ?, mapaId = ?,
    naziv = ?, podnaziv = ?, telefon = ?, 
    mail = ?, adresa = ?, www = ?, cjenikUrl = ?,
    mjesto = ?, drzava = ?, radno_vrijeme = ?, 
    cjenikText = ?, urlText = ?,
    noclick = ?, openModal = ?, noteHeader = ?, overheadText = ?, recommended = ?,
    resort = ?, camp = ?,
    slika = ?,
    slika1 = ?, slika2 = ?, slika3 = ?, 
    slika4 = ?, slika5 = ?, slika6 = ?,  
    slika7 = ?, slika8 = ?,
    napomena_hr = ?, napomena_en = ?, napomena_de = ?, 
    napomena_it = ?, napomena_nl = ?, napomena_ru = ?, 
    napomena_si = ?, napomena_pl = ?, 
    sink = ?, shower = ?, childrenToilet = ?, 
    chemicalToilet = ?, disabledToilet = ?, privateToilet = ?, 
    clothingWash = ?, dishWash = ?, laundry = ?,  
    dryer = ?, dogShower = ?, refrigerator = ?,
    ambulanta = ?, bar = ?, restaurant = ?, 
    wellness = ?, hairdresser = ?, fitness = ?, 
    kiosk = ?,
    ponOd1 = ?, ponDo1 = ?, ponOd2 = ?, ponDo2 = ?, 
    utoOd1 = ?, utoDo1 = ?, utoOd2 = ?, utoDo2 = ?, 
    sriOd1 = ?, sriDo1 = ?, sriOd2 = ?, sriDo2 = ?, 
    cetOd1 = ?, cetDo1 = ?, cetOd2 = ?, cetDo2 = ?, 
    petOd1 = ?, petDo1 = ?, petOd2 = ?, petDo2 = ?, 
    subOd1 = ?, subDo1 = ?, subOd2 = ?, subDo2 = ?, 
    nedOd1 = ?, nedDo1 = ?, nedOd2 = ?, nedDo2 = ?
      WHERE uid = ?;`;
    vars.push(newObjekt.uid);
    status = 202;
  }
  db.getPool(req.db).getConnection((err, con) => {
    if (err) throw err;
    con.execute(sql, vars, (err, result) => {
      if (err) {
        con.release();
        throw err;
      }
      if (!newObjekt.uid) newObjekt.uid = result.insertId;
      const sql = "DELETE FROM neradniPeriodi WHERE objektId = ?;";
      const vars = [newObjekt.uid];
      con.execute(sql, vars, async (err, result) => {
        if (err) {
          con.release();
          throw err;
        }
        const sql = "INSERT INTO neradniPeriodi (objektId, datumOd, datumDo) VALUES (?,?,?);";
        for (let i = 0; i < newObjekt.neradniPeriodi?.length; i++) {
          const vars = [newObjekt.uid, newObjekt.neradniPeriodi[i].datumOd, newObjekt.neradniPeriodi[i].datumDo];
          await new Promise((resolve, reject) => {
            con.execute(sql, vars, (err, result) => {
              if (err) {
                con.release();
                throw err;
              }
              resolve();
            });
          });
        }
        con.release();
        return res.sendStatus(status);
      });
    });
  });
};

const deleteObjekt = async (req, res) => {
  if (!req.headers.kampid || !req.params.uid || isNaN(parseInt(req.params.uid))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql = `UPDATE objekti SET deleted=TRUE WHERE uid=${req.params.uid} AND kampId=${req.headers.kampid};`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    return res.sendStatus(202);
  });
};

const getVrsteObjekata = (req, res) => {
  const sql = `SELECT * FROM vrsteObjekata WHERE deleted IS NOT TRUE;`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const getObjektVlasnik = async (req, res) => {
  if (!(await functionsBackend.isAdmin(req.db, req.userId))) return res.sendStatus(403);
  const sql = "SELECT * FROM objektVlasnik;";
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const getOwnedObjects = async (req, res) => {
  if (!(await functionsBackend.isVlasnikObjekta(req.db, req.userId))) return res.sendStatus(403);
  const sql =
    "SELECT * FROM objektVlasnik JOIN objekti ON objektVlasnik.objektId = objekti.uid " +
    "WHERE vlasnikId = ? AND deleted IS NOT TRUE;";
  const vars = [req.userId];
  db.getPool(req.db).execute(sql, vars, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const getRadnoVrijeme = async (req, res) => {
  //pročitat request
  const dbName = "ca_" + req.query.dbName;
  const id = Number(req.query.objektId);
  const datumOd = new Date(req.query.datumOd);
  const datumDo = new Date(req.query.datumDo);
  if (dbName == "ca_undefined" || !id || isNaN(datumOd) || isNaN(datumDo)) return res.sendStatus(400);
  //dohvatit radno vrijeme i neradne periode
  let objekt = {};
  let neradniPeriodi = [];
  let promises = [];
  promises.push(
    new Promise((resolve, reject) => {
      const sql = "SELECT * FROM objekti WHERE uid = ? AND deleted IS NOT TRUE;";
      const vars = [id];
      db.getPool(dbName).execute(sql, vars, (err, result) => {
        if (err) throw err;
        objekt = result[0];
        resolve();
      });
    })
  );
  promises.push(
    new Promise((resolve, reject) => {
      const sql = "SELECT * FROM neradniPeriodi WHERE objektId = ?;";
      const vars = [id];
      db.getPool(dbName).execute(sql, vars, (err, results) => {
        if (err) throw err;
        neradniPeriodi = results;
        resolve();
      });
    })
  );
  await Promise.all(promises);
  //izgradit response
  let responseArray = [];
  let tempDate = new Date(datumOd);
  while (tempDate <= datumDo) {
    let dayWorkingHours = [kraticeDana[tempDate.getDay()]];
    if (!isNeradniDan(tempDate, neradniPeriodi)) {
      dayWorkingHours = optionalPush(
        objekt[kraticeDana[tempDate.getDay()] + "Od1"]?.replace(":", "."),
        dayWorkingHours
      );
      dayWorkingHours = optionalPush(
        objekt[kraticeDana[tempDate.getDay()] + "Do1"]?.replace(":", "."),
        dayWorkingHours
      );
      dayWorkingHours = optionalPush(
        objekt[kraticeDana[tempDate.getDay()] + "Od2"]?.replace(":", "."),
        dayWorkingHours
      );
      dayWorkingHours = optionalPush(
        objekt[kraticeDana[tempDate.getDay()] + "Do2"]?.replace(":", "."),
        dayWorkingHours
      );
    }
    responseArray.push(dayWorkingHours);
    tempDate.setDate(tempDate.getDate() + 1);
  }
  //poslat response
  return res.send(responseArray);
};

function isNeradniDan(date, neradniPeriodi) {
  for (let i = 0; i < neradniPeriodi.length; i++) {
    if (isSameDate(date, new Date(neradniPeriodi[i].datumOd))) return true;
    if (
      date > new Date(neradniPeriodi[i].datumOd) &&
      neradniPeriodi[i].datumDo &&
      date < new Date(neradniPeriodi[i].datumDo)
    )
      return true;
    if (neradniPeriodi[i].datumDo && isSameDate(date, new Date(neradniPeriodi[i].datumDo))) return true;
  }
  return false;
}

function isSameDate(d1, d2) {
  if (!(d1 instanceof Date) || !(d2 instanceof Date)) return false;
  return d1.getDate() == d2.getDate() && d1.getMonth() == d2.getMonth() && d1.getFullYear() == d2.getFullYear();
}

function optionalPush(e, array) {
  if (e) array.push(Number(e));
  return array;
}

async function validateObjekt(newObjekt, database) {
  if (
    !newObjekt ||
    !newObjekt.kampId ||
    !newObjekt.naziv ||
    !newObjekt.vrstaObjektaUid ||
    !validateNeradniPeriodi(newObjekt.neradniPeriodi)
  )
    return false;
  return new Promise((resolve, reject) => {
    const sql = `SELECT EXISTS(SELECT * FROM vrsteObjekata WHERE uid=${newObjekt.vrstaObjektaUid} AND deleted IS NOT TRUE) AS value;`;
    db.getPool(database).query(sql, (err, result) => {
      if (err) throw err;
      resolve(!!result[0].value);
    });
  });
}

function validateNeradniPeriodi(periodi) {
  for (let i = 0; i < periodi?.length; i++) {
    if (!periodi[i].datumOd || (periodi[i].datumDo && periodi[i].datumOd > periodi[i].datumDo)) return false;
  }
  return true;
}

function prepareNewObjekt(newObjekt) {
  //uid ostavljam kakav je

  if (!newObjekt.mapaId) newObjekt.mapaId = null;

  if (!newObjekt.podnaziv) newObjekt.podnaziv = null;
  if (!newObjekt.mail) newObjekt.mail = null;
  if (!newObjekt.www) newObjekt.www = null;
  if (!newObjekt.cjenikUrl) newObjekt.cjenikUrl = null;
  if (!newObjekt.adresa) newObjekt.adresa = null;
  if (!newObjekt.mjesto) newObjekt.mjesto = null;
  if (!newObjekt.drzava) newObjekt.drzava = null;
  if (!newObjekt.radno_vrijeme) newObjekt.radno_vrijeme = null;
  if (!newObjekt.cjenikText) newObjekt.cjenikText = null;
  if (!newObjekt.urlText) newObjekt.urlText = null;

  if (!newObjekt.noclick) newObjekt.noclick = false;

  if (!newObjekt.openModal && !(newObjekt.openModal === false) && !(newObjekt.openModal === 0))
    newObjekt.openModal = true;

  if (!newObjekt.noteHeader) newObjekt.noteHeader = false;
  if (!newObjekt.overheadText) newObjekt.overheadText = false;
  if (!newObjekt.recommended) newObjekt.recommended = false;

  if (!newObjekt.resort && !(newObjekt.resort === false) && !(newObjekt.resort === 0)) newObjekt.resort = true;
  if (!newObjekt.camp && !(newObjekt.camp === false) && !(newObjekt.camp === 0)) newObjekt.camp = true;

  if (!newObjekt.slika) newObjekt.slika = null;
  if (!newObjekt.slika1) newObjekt.slika1 = null;
  if (!newObjekt.slika2) newObjekt.slika2 = null;
  if (!newObjekt.slika3) newObjekt.slika3 = null;
  if (!newObjekt.slika4) newObjekt.slika4 = null;
  if (!newObjekt.slika5) newObjekt.slika5 = null;
  if (!newObjekt.slika6) newObjekt.slika6 = null;
  if (!newObjekt.slika7) newObjekt.slika7 = null;
  if (!newObjekt.slika8) newObjekt.slika8 = null;

  if (!newObjekt.napomena_hr) newObjekt.napomena_hr = null;
  if (!newObjekt.napomena_en) newObjekt.napomena_en = null;
  if (!newObjekt.napomena_de) newObjekt.napomena_de = null;
  if (!newObjekt.napomena_it) newObjekt.napomena_it = null;
  if (!newObjekt.napomena_nl) newObjekt.napomena_nl = null;
  if (!newObjekt.napomena_ru) newObjekt.napomena_ru = null;
  if (!newObjekt.napomena_si) newObjekt.napomena_si = null;
  if (!newObjekt.napomena_pl) newObjekt.napomena_pl = null;

  if (!newObjekt.sink) newObjekt.sink = false;
  if (!newObjekt.shower) newObjekt.shower = false;
  if (!newObjekt.childrenToilet) newObjekt.childrenToilet = false;
  if (!newObjekt.chemicalToilet) newObjekt.chemicalToilet = false;
  if (!newObjekt.disabledToilet) newObjekt.disabledToilet = false;
  if (!newObjekt.privateToilet) newObjekt.privateToilet = false;
  if (!newObjekt.clothingWash) newObjekt.clothingWash = false;
  if (!newObjekt.dishWash) newObjekt.dishWash = false;
  if (!newObjekt.laundry) newObjekt.laundry = false;
  if (!newObjekt.dryer) newObjekt.dryer = false;
  if (!newObjekt.dogShower) newObjekt.dogShower = false;
  if (!newObjekt.refrigerator) newObjekt.refrigerator = false;

  if (!newObjekt.ambulanta) newObjekt.ambulanta = false;
  if (!newObjekt.bar) newObjekt.bar = false;
  if (!newObjekt.restaurant) newObjekt.restaurant = false;
  if (!newObjekt.wellness) newObjekt.wellness = false;
  if (!newObjekt.hairdresser) newObjekt.hairdresser = false;
  if (!newObjekt.fitness) newObjekt.fitness = false;
  if (!newObjekt.kiosk) newObjekt.kiosk = false;

  for (let i = 0; i < kraticeDana.length; i++) {
    if (!newObjekt[kraticeDana[i] + "Od1"]) newObjekt[kraticeDana[i] + "Od1"] = null;
    if (!newObjekt[kraticeDana[i] + "Do1"]) newObjekt[kraticeDana[i] + "Do1"] = null;
    if (!newObjekt[kraticeDana[i] + "Od2"]) newObjekt[kraticeDana[i] + "Od2"] = null;
    if (!newObjekt[kraticeDana[i] + "Do2"]) newObjekt[kraticeDana[i] + "Do2"] = null;
  }
  for (let i = 0; i < kraticeDana.length; i++) {
    if (newObjekt[kraticeDana[i] + "Od1"] && !newObjekt[kraticeDana[i] + "Do1"])
      newObjekt[kraticeDana[i] + "Do1"] = "23:59";
    if (newObjekt[kraticeDana[i] + "Od2"] && !newObjekt[kraticeDana[i] + "Do2"])
      newObjekt[kraticeDana[i] + "Do2"] = "23:59";
  }

  newObjekt.neradniPeriodi = prepareNeradniPeriodi(newObjekt.neradniPeriodi);

  return newObjekt;
}

function prepareNeradniPeriodi(periodi) {
  if (!periodi) periodi = [];
  periodi.forEach((p) => {
    if (!p.datumDo) p.datumDo = null;
  });
  return periodi;
}

export default {
  getAllObjekti,
  getObjekti,
  insertObjekt,
  deleteObjekt,
  getVrsteObjekata,
  getRadnoVrijeme,
  getObjektVlasnik,
  getOwnedObjects,
};
