import db from "../config/dbConfig.js";
import functionsBackend from "../functionsBackend.js";
import csv from "csvtojson";
import fs from "fs";
import createCsvWriter from "csv-writer";
import path from "path";
const __dirname = path.resolve();

const getAllBrojSJ = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql = `SELECT * FROM brojSJ WHERE kampId=${req.headers.kampid} AND deleted IS NOT TRUE;`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const getBrojSjByMapaId = async (req, res) => {
  if (!req.query.group || !req.query.kampId || !req.query.mapaId) return res.sendStatus(400);

  /* //MOZDA ovo bi bilo predivno ali zasad mi treba Denisov format
  const sql =
    "SELECT * FROM brojSJ WHERE kampId = ? AND mapaId = ? AND deleted IS NOT TRUE;";
  const vars = [req.query.kampId, req.query.mapaId];*/

  const sql =
    "SELECT vrstaMish AS tipMISH, brojMish AS brojMISH, petsNotAllowed AS dogsNotAllowed, petsAllowed AS dogsAllowed, brojSJ.slika AS panom," +
    " brojSJ.*, vrstaSJ.naziv AS vrstaName, osuncanost" +
    " FROM brojSJ LEFT JOIN vrstaSJ ON brojSJ.vrstaSJ = vrstaSJ.uid LEFT JOIN osuncanost ON brojSJ.osuncanostId = osuncanost.uid" +
    " WHERE brojSJ.kampId = ? AND mapaId = ? AND brojSJ.deleted IS NOT TRUE;";
  const vars = [req.query.kampId, req.query.mapaId];

  db.getPool("ca_" + req.query.group).execute(sql, vars, (err, results) => {
    if (err) throw err;
    results.forEach((r) => {
      r.images = [];
      for (let i = 1; i <= 8; i++) {
        if (r["slika" + i]) r.images.push(r["slika" + i]);
        delete r["slika" + i];
      }
    });
    res.send(results);
  });
};

const insertBrojSJ = async (req, res) => {
  let newBrojSj = req.body;
  if (!(await validateBrojSJ(newBrojSj, req.db))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, newBrojSj.kampId))) return res.sendStatus(403);

  await saveBrojSj(newBrojSj, req.db);

  return res.sendStatus(202);
};

const deleteBrojSJ = async (req, res) => {
  if (!req.headers.kampid || !req.params.uid || isNaN(parseInt(req.params.uid))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql = `UPDATE brojSJ SET deleted=TRUE WHERE uid=${req.params.uid} AND kampId=${req.headers.kampid};`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    return res.sendStatus(202);
  });
};

const getMishData = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql = `SELECT broj, brojMISH, vrstaMISH, duzina, sirina, povrsina, slika, 
  napomena_hr, napomena_en, napomena_de, 
  napomena_it, napomena_nl, napomena_ru, 
  napomena_si, napomena_pl
        FROM brojSJ WHERE brojMISH='${req.params.brojMISH}' AND deleted IS NOT TRUE;`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.send(results[0]);
  });
};

const getAllWithVrstaNames = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);
  const sql =
    "SELECT brojSJ.uid, brojSJ.broj, vrstaSJ.oznaka AS oznakaVrste, vrstaSJ.naziv AS nazivVrste" +
    " FROM brojSJ JOIN vrstaSJ ON brojSJ.vrstaSJ = vrstaSJ.uid" +
    " WHERE brojSJ.kampId = ? AND brojSJ.deleted IS NOT TRUE;";
  const vars = [req.headers.kampid];
  db.getPool(req.db).execute(sql, vars, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
};

const getAllInDenisFormat = async (req, res) => {
  if (!req.query.group || !req.query.kampId) res.sendStatus(400);
  const sql = `SELECT brojSJ.uid, brojSJ.mapaId, vrstaSJ.tip, vrstaSJ.oznakaMish AS oznakaMISH, 
  vrstaSJ.oznakaPhobs AS oznakaPHOBS, vrstaSJ.naziv AS tipNaziv, 
  vrstaSJ.propertyPhobs AS propertyPHOBS, vrstaSJ.pmsId AS pmsPropertyId, brojSJ.broj, 
  brojSJ.brojMish AS brojMISH, brojSJ.brojGps, brojSJ.pmsUnitId, brojSJ.dostupna, brojSJ.duzina, 
  brojSJ.sirina, brojSJ.povrsina, brojSJ.samoNaUpit 
  FROM brojSJ JOIN vrstaSJ ON vrstaSJ.uid = brojSJ.vrstaSJ AND vrstaSJ.kampId = brojSJ.kampId 
  WHERE brojSJ.deleted IS NOT TRUE AND vrstaSJ.kampId = ?;`;
  db.getPool("ca_" + req.query.group).execute(sql, [req.query.kampId], (err, results) => {
    if (err) throw err;
    results.forEach((r) => {
      r.canbook = "";
      r.pmsPropertyId = r.pmsPropertyId || "";
      Object.keys(r).forEach((key) => (r[key] = r[key] ? String(r[key]) : r[key]));
    });
    res.json(results);
  });
};

const fromCsv = async (req, res) => {
  if (!req.headers.kampid) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, req.headers.kampid))) return res.sendStatus(403);

  let getVrstaSjUid = {};
  let getOsuncanostId = {};
  let getpodlogaId = {};
  let promises = [];
  promises.push(
    new Promise((resolve, reject) => {
      const sql = "SELECT uid, oznaka FROM vrstaSJ WHERE kampId = ? AND deleted IS NOT TRUE;";
      const vars = [req.headers.kampid];
      db.getPool(req.db).execute(sql, vars, (err, results) => {
        if (err) throw err;
        results.forEach((r) => (getVrstaSjUid[r.oznaka.toLowerCase()] = r.uid));
        resolve();
      });
    })
  );
  promises.push(
    new Promise((resolve, reject) => {
      const sql = "SELECT * FROM osuncanost;";
      db.getPool(req.db).query(sql, (err, results) => {
        if (err) throw err;
        results.forEach((r) => (getOsuncanostId[r.osuncanost.toLowerCase()] = r.uid));
        resolve();
      });
    })
  );
  promises.push(
    new Promise((resolve, reject) => {
      const sql = "SELECT * FROM podloga;";
      db.getPool(req.db).query(sql, (err, results) => {
        if (err) throw err;
        results.forEach((r) => (getpodlogaId[r.naziv.toLowerCase()] = r.uid));
        resolve();
      });
    })
  );
  await Promise.all(promises);

  let invalidObjects = [];
  let validObjects = [];

  for (const fileKey of Object.keys(req.files)) {
    const jsonObjects = await csv({
      noheader: false,
      delimiter: ";",
      headers: [
        "uid",
        "kampId",
        "broj",
        "vrstaSJ",
        "duzina",
        "sirina",
        "velicina",
        "duzina2",
        "sirina3",
        "povrsina",
        "osuncanostId",
        "podlogaId",
        "slika",
        "brojMish",
        "vrstaMish",
        "pmsUnitId",
        "brojOsoba",
        "brojDjece",
        "nagib",
        "drvo",
        "dostupna",
        "samoNaUpit",
        "vanjski",
        "pausal",
        "noclick",
        "noteHeader",
        "nePrikazujBroj",
        "mapaId",
        "brojGps",
        "latitude",
        "longitude",
        "parkingLatitude",
        "parkingLongitude",
        "strujaId",
        "vodaId",
        "wifi",
        "parking",
        "struja16a",
        "struja10a",
        "struja6a",
        "voda",
        "kabelskaTv",
        "satelitskaTv",
        "odvodnja",
        "perilicaPosuda",
        "susilicaPosuda",
        "perilicaRublja",
        "susilicaRublja",
        "pegla",
        "klimaUredaj",
        "mikrovalna",
        "toster",
        "kuhaloZaVodu",
        "petsAllowed",
        "petsNotAllowed",
        "rostilj",
        "bazen",
        "jacuzzi",
        "lounger",
        "slika1",
        "slika2",
        "slika3",
        "slika4",
        "slika5",
        "slika6",
        "slika7",
        "slika8",
        "napomena_hr",
        "napomena_en",
        "napomena_de",
        "napomena_it",
        "napomena_nl",
        "napomena_ru",
        "napomena_si",
        "napomena_pl",
        "deleted",
      ],
    }).fromFile(req.files[fileKey].tempFilePath);

    //obrišem tempFile kad sam gotov s njim
    fs.unlink(req.files[fileKey].tempFilePath, (err) => {
      if (err) console.error(err);
    });

    for (let obj of jsonObjects) {
      //MOZDA paralelizirati ovo?
      obj.kampId = req.headers.kampid;
      if (!obj.uid && obj.brojMish) {
        await new Promise((resolve, reject) => {
          const sql = "SELECT uid FROM brojSJ WHERE brojMish = ? AND kampId = ? AND deleted IS NOT TRUE;";
          const vars = [obj.brojMish, obj.kampId];
          db.getPool(req.db).execute(sql, vars, (err, result) => {
            if (err) throw err;
            if (result[0]?.uid) {
              obj.uid = result[0].uid;
            }
            resolve();
          });
        });
      }

      //slučaj kad csv miče deleted flag
      if (obj.uid && !Number(obj.deleted)) {
        await new Promise((resolve, reject) => {
          const sql = "UPDATE brojSJ SET deleted = FALSE WHERE uid = ? ;";
          const vars = [obj.uid];
          db.getPool(req.db).execute(sql, vars, (err, result) => {
            if (err) throw err;
            resolve();
          });
        });
      }

      if (obj.vrstaSJ && Number.isNaN(obj.vrstaSJ)) obj.vrstaSJ = getVrstaSjUid[obj.vrstaSJ.toLowerCase()];
      if (obj.osuncanostId && Number.isNaN(obj.osuncanostId))
        obj.osuncanostId = getOsuncanostId[obj.osuncanostId.toLowerCase()];
      if (obj.podlogaId && Number.isNaN(obj.podlogaId)) obj.podlogaId = getpodlogaId[obj.podlogaId.toLowerCase()];

      obj.dostupna = functionsBackend.isTrue(obj.dostupna);
      obj.nagib = functionsBackend.isTrue(obj.nagib);
      obj.drvo = functionsBackend.isTrue(obj.drvo);
      obj.samoNaUpit = functionsBackend.isTrue(obj.samoNaUpit);
      obj.vanjski = functionsBackend.isTrue(obj.vanjski);
      obj.pausal = functionsBackend.isTrue(obj.pausal);
      obj.noclick = functionsBackend.isTrue(obj.noclick);
      obj.noteHeader = functionsBackend.isTrue(obj.noteHeader);
      obj.nePrikazujBroj = functionsBackend.isTrue(obj.nePrikazujBroj);

      obj.wifi = functionsBackend.isTrue(obj.wifi);
      obj.parking = functionsBackend.isTrue(obj.parking);
      obj.struja16a = functionsBackend.isTrue(obj.struja16a);
      obj.struja10a = functionsBackend.isTrue(obj.struja10a);
      obj.struja6a = functionsBackend.isTrue(obj.struja6a);
      obj.voda = functionsBackend.isTrue(obj.voda);
      obj.kabelskaTv = functionsBackend.isTrue(obj.kabelskaTv);
      obj.satelitskaTv = functionsBackend.isTrue(obj.satelitskaTv);
      obj.odvodnja = functionsBackend.isTrue(obj.odvodnja);
      obj.perilicaPosuda = functionsBackend.isTrue(obj.perilicaPosuda);
      obj.susilicaPosuda = functionsBackend.isTrue(obj.susilicaPosuda);
      obj.perilicaRublja = functionsBackend.isTrue(obj.perilicaRublja);
      obj.susilicaRublja = functionsBackend.isTrue(obj.susilicaRublja);
      obj.pegla = functionsBackend.isTrue(obj.pegla);
      obj.klimaUredaj = functionsBackend.isTrue(obj.klimaUredaj);
      obj.mikrovalna = functionsBackend.isTrue(obj.mikrovalna);
      obj.toster = functionsBackend.isTrue(obj.toster);
      obj.kuhaloZaVodu = functionsBackend.isTrue(obj.kuhaloZaVodu);
      obj.petsAllowed = functionsBackend.isTrue(obj.petsAllowed);
      obj.petsNotAllowed = functionsBackend.isTrue(obj.petsNotAllowed);
      obj.rostilj = functionsBackend.isTrue(obj.rostilj);
      obj.bazen = functionsBackend.isTrue(obj.bazen);
      obj.jacuzzi = functionsBackend.isTrue(obj.jacuzzi);
      obj.lounger = functionsBackend.isTrue(obj.lounger);

      Object.keys(obj).forEach((key) => {
        if (functionsBackend.shouldTextBeNull(obj[key])) obj[key] = null;
      });

      if (await validateBrojSJ(obj, req.db)) {
        validObjects.push(obj);
      } else {
        invalidObjects.push(obj);
      }
    }
  }
  if (invalidObjects.length) return res.status(400).json({ invalidObjects });
  //MOZDA poslati nešto malo više user-friendly

  promises = [];
  validObjects.forEach((obj) => {
    promises.push(saveBrojSj(obj, req.db));
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

  const pathToCsv = path.join(__dirname, "tmp", "brojSJ.csv");
  const csvWriter = createCsvWriter.createObjectCsvWriter({
    path: pathToCsv,
    fieldDelimiter: ";",
    header: [
      { id: "uid", title: "uid" },
      { id: "kampId", title: "kampId" },
      { id: "broj", title: "Broj Smještajne Jedinice" },
      { id: "vrstaSJ", title: "Vrsta Smještajne Jedinice" },
      { id: "duzina", title: "duzina" },
      { id: "sirina", title: "sirina" },
      { id: "velicina", title: "velicina" },
      { id: "duzina2", title: "duzina2" },
      { id: "sirina3", title: "sirina3" },
      { id: "povrsina", title: "povrsina" },
      { id: "osuncanostId", title: "osuncanost" },
      { id: "podlogaId", title: "podloga" },
      //MOZDA pretvoriti te id-jeve u text
      { id: "slika", title: "slika" },
      { id: "brojMish", title: "Broj PMS" },
      { id: "vrstaMish", title: "Vrsta PMS" },
      { id: "pmsUnitId", title: "pmsId" },
      { id: "brojOsoba", title: "brojOsoba" },
      { id: "brojDjece", title: "brojDjece" },
      { id: "nagib", title: "nagib" },
      { id: "drvo", title: "drvo" },
      { id: "dostupna", title: "dostupna" },
      { id: "samoNaUpit", title: "Samo na upit (1/0 ili DA/NE)" },
      { id: "vanjski", title: "vanjski" },
      { id: "pausal", title: "Paušal (1/0 ili DA/NE)" },
      { id: "noclick", title: "noclick" },
      { id: "noteHeader", title: "noteHeader" },
      { id: "nePrikazujBroj", title: "nePrikazujBroj" },
      { id: "mapaId", title: "mapaId" },
      { id: "brojGps", title: "brojGps" },
      { id: "latitude", title: "latitude" },
      { id: "longitude", title: "longitude" },
      { id: "parkingLatitude", title: "parkingLatitude" },
      { id: "parkingLongitude", title: "parkingLongitude" },
      { id: "strujaId", title: "strujaId" },
      { id: "vodaId", title: "vodaId" },
      { id: "wifi", title: "wifi" },
      { id: "parking", title: "Parking (1/0 ili DA/NE)" },
      { id: "struja16a", title: "Struja 16A (1/0 ili DA/NE)" },
      { id: "struja10a", title: "Struja 10A (1/0 ili DA/NE)" },
      { id: "struja6a", title: "Struja 6A (1/0 ili DA/NE)" },
      { id: "voda", title: "Voda (1/0 ili DA/NE)" },
      { id: "kabelskaTv", title: "Kabelska TV (1/0 ili DA/NE)" },
      { id: "satelitskaTv", title: "Satelitska TV (1/0 ili DA/NE)" },
      { id: "odvodnja", title: "Odvodnja (1/0 ili DA/NE)" },
      { id: "perilicaPosuda", title: "Perilica posuđa (1/0 ili DA/NE)" },
      { id: "susilicaPosuda", title: "Sušilica posuđa (1/0 ili DA/NE)" },
      { id: "perilicaRublja", title: "Perilica rublja (1/0 ili DA/NE)" },
      { id: "susilicaRublja", title: "Sušilica rublja (1/0 ili DA/NE)" },
      { id: "pegla", title: "Pegla (1/0 ili DA/NE)" },
      { id: "klimaUredaj", title: "Klima uređaj (1/0 ili DA/NE)" },
      { id: "mikrovalna", title: "Mikrovalna (1/0 ili DA/NE)" },
      { id: "toster", title: "Toster (1/0 ili DA/NE)" },
      { id: "kuhaloZaVodu", title: "Kuhalo za vodu (1/0 ili DA/NE)" },
      { id: "petsAllowed", title: "petsAllowed" },
      { id: "petsNotAllowed", title: "petsNotAllowed" },
      { id: "rostilj", title: "rostilj" },
      { id: "bazen", title: "bazen" },
      { id: "jacuzzi", title: "jacuzzi" },
      { id: "lounger", title: "lounger" },
      { id: "slika1", title: "slika1" },
      { id: "slika2", title: "slika2" },
      { id: "slika3", title: "slika3" },
      { id: "slika4", title: "slika4" },
      { id: "slika5", title: "slika5" },
      { id: "slika6", title: "slika6" },
      { id: "slika7", title: "slika7" },
      { id: "slika8", title: "slika8" },
      { id: "napomena_hr", title: "napomena_hr" },
      { id: "napomena_en", title: "napomena_en" },
      { id: "napomena_de", title: "napomena_de" },
      { id: "napomena_it", title: "napomena_it" },
      { id: "napomena_nl", title: "napomena_nl" },
      { id: "napomena_ru", title: "napomena_ru" },
      { id: "napomena_si", title: "napomena_si" },
      { id: "napomena_pl", title: "napomena_pl" },
      { id: "deleted", title: "deleted" },
    ],
  });
  const sql = `SELECT * FROM brojSJ WHERE kampId = ? AND deleted IS NOT TRUE;`;
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

async function saveBrojSj(newBrojSj, dbName) {
  newBrojSj = prepareNewBrojSJ(newBrojSj);

  let sql;
  let vars = [];
  if (!newBrojSj.uid) {
    sql = `INSERT INTO brojSJ(
        kampID, broj, vrstaSJ,
        duzina, sirina, velicina,
        duzina2, sirina3, povrsina,
        osuncanostId, podlogaId, 
        slika, virtualTour, brojMish, 
        vrstaMish, pmsUnitId, 
        brojOsoba, brojDjece, kapacitetLezajeva,
        nagib, drvo, 
        dostupna, samoNaUpit, 
        vanjski, pausal, noclick, openModal,
        noteHeader, nePrikazujBroj,
        wifi, parking, 
        struja16a, struja10a, struja6a, 
        voda, kabelskaTv, satelitskaTv,
        odvodnja, perilicaPosuda, susilicaPosuda, 
        perilicaRublja, susilicaRublja, pegla, 
        klimaUredaj, mikrovalna, toster, 
        kuhaloZaVodu, petsAllowed, petsNotAllowed, 
        rostilj, bazen, jacuzzi, lounger,
        slika1, slika2, slika3, 
        slika4, slika5, slika6, 
        slika7, slika8,
        napomena_hr, napomena_en, napomena_de, 
        napomena_it, napomena_nl, napomena_ru, 
        napomena_si, napomena_pl, 
        mapaId, brojGps, 
        latitude, longitude,
        parkingLatitude, parkingLongitude,
        strujaId, vodaId
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`;
    vars = [
      newBrojSj.kampId,
      newBrojSj.broj,
      newBrojSj.vrstaSJ,
      newBrojSj.duzina,
      newBrojSj.sirina,
      newBrojSj.velicina,
      newBrojSj.duzina2,
      newBrojSj.sirina3,
      newBrojSj.povrsina,
      newBrojSj.osuncanostId,
      newBrojSj.podlogaId,
      newBrojSj.slika,
      newBrojSj.virtualTour,
      newBrojSj.brojMish,
      newBrojSj.vrstaMish,
      newBrojSj.pmsUnitId,
      newBrojSj.brojOsoba,
      newBrojSj.brojDjece,
      newBrojSj.kapacitetLezajeva,
      newBrojSj.nagib,
      newBrojSj.drvo,
      newBrojSj.dostupna,
      newBrojSj.samoNaUpit,
      newBrojSj.vanjski,
      newBrojSj.pausal,
      newBrojSj.noclick,
      newBrojSj.openModal,
      newBrojSj.noteHeader,
      newBrojSj.nePrikazujBroj,
      newBrojSj.wifi,
      newBrojSj.parking,
      newBrojSj.struja16a,
      newBrojSj.struja10a,
      newBrojSj.struja6a,
      newBrojSj.voda,
      newBrojSj.kabelskaTv,
      newBrojSj.satelitskaTv,
      newBrojSj.odvodnja,
      newBrojSj.perilicaPosuda,
      newBrojSj.susilicaPosuda,
      newBrojSj.perilicaRublja,
      newBrojSj.susilicaRublja,
      newBrojSj.pegla,
      newBrojSj.klimaUredaj,
      newBrojSj.mikrovalna,
      newBrojSj.toster,
      newBrojSj.kuhaloZaVodu,
      newBrojSj.petsAllowed,
      newBrojSj.petsNotAllowed,
      newBrojSj.rostilj,
      newBrojSj.bazen,
      newBrojSj.jacuzzi,
      newBrojSj.lounger,
      newBrojSj.slika1,
      newBrojSj.slika2,
      newBrojSj.slika3,
      newBrojSj.slika4,
      newBrojSj.slika5,
      newBrojSj.slika6,
      newBrojSj.slika7,
      newBrojSj.slika8,
      newBrojSj.napomena_hr,
      newBrojSj.napomena_en,
      newBrojSj.napomena_de,
      newBrojSj.napomena_it,
      newBrojSj.napomena_nl,
      newBrojSj.napomena_ru,
      newBrojSj.napomena_si,
      newBrojSj.napomena_pl,
      newBrojSj.mapaId,
      newBrojSj.brojGps,
      newBrojSj.latitude,
      newBrojSj.longitude,
      newBrojSj.parkingLatitude,
      newBrojSj.parkingLongitude,
      newBrojSj.strujaId,
      newBrojSj.vodaId,
    ];
  } else {
    sql = `UPDATE brojSJ SET
        kampId = ?, broj = ?, 
        vrstaSJ = ?, duzina = ?,  
        sirina = ?, velicina = ?, 
        duzina2 = ?, sirina3 = ?, 
        povrsina = ?, 
        osuncanostId = ?, podlogaId = ?, 
        slika = ?, virtualTour = ?, brojMish = ?, 
        vrstaMish = ?, pmsUnitId = ?, 
        brojOsoba = ?, brojDjece = ?, 
        kapacitetLezajeva = ?,
        nagib = ?, drvo = ?, 
        dostupna = ?, samoNaUpit = ?, 
        vanjski = ?, pausal = ?, 
        noclick = ?, openModal = ?, noteHeader = ?, 
        nePrikazujBroj = ?, 
        wifi = ?, parking = ?, 
        struja16a = ?, struja10a = ?, 
        struja6a = ?, voda = ?, 
        kabelskaTv = ?, satelitskaTv = ?, 
        odvodnja = ?, perilicaPosuda = ?, 
        susilicaPosuda = ?, perilicaRublja = ?, 
        susilicaRublja = ?, pegla = ?, 
        klimaUredaj = ?, mikrovalna = ?, 
        toster = ?, kuhaloZaVodu = ?, 
        petsAllowed = ?, petsNotAllowed = ?, 
        rostilj = ?, bazen = ?, 
        jacuzzi = ?, lounger = ?,
        slika1 = ?, slika2 = ?,
        slika3 = ?, slika4 = ?, 
        slika5 = ?, slika6 = ?, 
        slika7 = ?, slika8 = ?, 
        napomena_hr = ?, 
        napomena_en = ?, napomena_de = ?, 
        napomena_it = ?, napomena_nl = ?, 
        napomena_ru = ?, napomena_si = ?, 
        napomena_pl = ?, mapaId = ?, 
        brojGps = ?,
        latitude = ?, longitude = ?,
        parkingLatitude = ?, parkingLongitude = ?,
        strujaId = ?, vodaId = ?
    WHERE uid = ?;`;
    vars = [
      newBrojSj.kampId,
      newBrojSj.broj,
      newBrojSj.vrstaSJ,
      newBrojSj.duzina,
      newBrojSj.sirina,
      newBrojSj.velicina,
      newBrojSj.duzina2,
      newBrojSj.sirina3,
      newBrojSj.povrsina,
      newBrojSj.osuncanostId,
      newBrojSj.podlogaId,
      newBrojSj.slika,
      newBrojSj.virtualTour,
      newBrojSj.brojMish,
      newBrojSj.vrstaMish,
      newBrojSj.pmsUnitId,
      newBrojSj.brojOsoba,
      newBrojSj.brojDjece,
      newBrojSj.kapacitetLezajeva,
      newBrojSj.nagib,
      newBrojSj.drvo,
      newBrojSj.dostupna,
      newBrojSj.samoNaUpit,
      newBrojSj.vanjski,
      newBrojSj.pausal,
      newBrojSj.noclick,
      newBrojSj.openModal,
      newBrojSj.noteHeader,
      newBrojSj.nePrikazujBroj,
      newBrojSj.wifi,
      newBrojSj.parking,
      newBrojSj.struja16a,
      newBrojSj.struja10a,
      newBrojSj.struja6a,
      newBrojSj.voda,
      newBrojSj.kabelskaTv,
      newBrojSj.satelitskaTv,
      newBrojSj.odvodnja,
      newBrojSj.perilicaPosuda,
      newBrojSj.susilicaPosuda,
      newBrojSj.perilicaRublja,
      newBrojSj.susilicaRublja,
      newBrojSj.pegla,
      newBrojSj.klimaUredaj,
      newBrojSj.mikrovalna,
      newBrojSj.toster,
      newBrojSj.kuhaloZaVodu,
      newBrojSj.petsAllowed,
      newBrojSj.petsNotAllowed,
      newBrojSj.rostilj,
      newBrojSj.bazen,
      newBrojSj.jacuzzi,
      newBrojSj.lounger,
      newBrojSj.slika1,
      newBrojSj.slika2,
      newBrojSj.slika3,
      newBrojSj.slika4,
      newBrojSj.slika5,
      newBrojSj.slika6,
      newBrojSj.slika7,
      newBrojSj.slika8,
      newBrojSj.napomena_hr,
      newBrojSj.napomena_en,
      newBrojSj.napomena_de,
      newBrojSj.napomena_it,
      newBrojSj.napomena_nl,
      newBrojSj.napomena_ru,
      newBrojSj.napomena_si,
      newBrojSj.napomena_pl,
      newBrojSj.mapaId,
      newBrojSj.brojGps,
      newBrojSj.latitude,
      newBrojSj.longitude,
      newBrojSj.parkingLatitude,
      newBrojSj.parkingLongitude,
      newBrojSj.strujaId,
      newBrojSj.vodaId,
      newBrojSj.uid,
    ];
  }

  return new Promise((resolve, reject) => {
    db.getPool(dbName).execute(sql, vars, async (err, results) => {
      if (err) throw err;
      functionsBackend.updateGeojsonFromDb(dbName, newBrojSj.kampId);
      resolve();
    });
  });
}

function prepareNewBrojSJ(newBrojSj) {
  //uid ostavljam kakav je
  if (!newBrojSj.broj) newBrojSj.broj = "";
  if (!newBrojSj.vrstaMish) newBrojSj.vrstaMish = "";

  if (!newBrojSj.duzina) newBrojSj.duzina = null;
  if (!newBrojSj.sirina) newBrojSj.sirina = null;
  if (!newBrojSj.velicina) newBrojSj.velicina = null;
  if (!newBrojSj.duzina2) newBrojSj.duzina2 = null;
  if (!newBrojSj.sirina3) newBrojSj.sirina3 = null;
  if (!newBrojSj.povrsina) newBrojSj.povrsina = null;

  if (!newBrojSj.osuncanostId) newBrojSj.osuncanostId = null;
  if (!newBrojSj.podlogaId) newBrojSj.podlogaId = null;

  if (!newBrojSj.pmsUnitId) newBrojSj.pmsUnitId = "";
  if (!newBrojSj.brojOsoba) newBrojSj.brojOsoba = null;
  if (!newBrojSj.brojDjece) newBrojSj.brojDjece = null;
  if (!newBrojSj.kapacitetLezajeva) newBrojSj.kapacitetLezajeva = "";

  if (!newBrojSj.slika) newBrojSj.slika = "";
  if (!newBrojSj.virtualTour) newBrojSj.virtualTour = "";
  if (!newBrojSj.slika1) newBrojSj.slika1 = "";
  if (!newBrojSj.slika2) newBrojSj.slika2 = "";
  if (!newBrojSj.slika3) newBrojSj.slika3 = "";
  if (!newBrojSj.slika4) newBrojSj.slika4 = "";
  if (!newBrojSj.slika5) newBrojSj.slika5 = "";
  if (!newBrojSj.slika6) newBrojSj.slika6 = "";
  if (!newBrojSj.slika7) newBrojSj.slika7 = "";
  if (!newBrojSj.slika8) newBrojSj.slika8 = "";

  if (!newBrojSj.napomena_hr) newBrojSj.napomena_hr = "";
  if (!newBrojSj.napomena_en) newBrojSj.napomena_en = "";
  if (!newBrojSj.napomena_de) newBrojSj.napomena_de = "";
  if (!newBrojSj.napomena_it) newBrojSj.napomena_it = "";
  if (!newBrojSj.napomena_nl) newBrojSj.napomena_nl = "";
  if (!newBrojSj.napomena_ru) newBrojSj.napomena_ru = "";
  if (!newBrojSj.napomena_si) newBrojSj.napomena_si = "";
  if (!newBrojSj.napomena_pl) newBrojSj.napomena_pl = "";

  if (!newBrojSj.dostupna && !(newBrojSj.dostupna === false) && !(newBrojSj.dostupna === 0)) newBrojSj.dostupna = true;

  if (!newBrojSj.nagib) newBrojSj.nagib = false;
  if (!newBrojSj.drvo) newBrojSj.drvo = false;
  if (!newBrojSj.noclick) newBrojSj.noclick = false;
  if (!newBrojSj.noteHeader) newBrojSj.noteHeader = false;
  if (!newBrojSj.nePrikazujBroj) newBrojSj.nePrikazujBroj = false;
  if (!newBrojSj.samoNaUpit) newBrojSj.samoNaUpit = false;
  if (!newBrojSj.vanjski) newBrojSj.vanjski = false;
  if (!newBrojSj.pausal) newBrojSj.pausal = false;

  if (!newBrojSj.openModal && !(newBrojSj.openModal === false) && !(newBrojSj.openModal === 0))
    newBrojSj.openModal = true;

  newBrojSj = prepareNewPogodnosti(newBrojSj);

  if (!newBrojSj.mapaId) newBrojSj.mapaId = null;
  if (!newBrojSj.brojGps) newBrojSj.brojGps = "";
  if (!newBrojSj.latitude) newBrojSj.latitude = null;
  if (!newBrojSj.longitude) newBrojSj.longitude = null;
  if (!newBrojSj.parkingLatitude) newBrojSj.parkingLatitude = null;
  if (!newBrojSj.parkingLongitude) newBrojSj.parkingLongitude = null;
  if (!newBrojSj.strujaId) newBrojSj.strujaId = null;
  if (!newBrojSj.vodaId) newBrojSj.vodaId = null;

  return newBrojSj;
}

function prepareNewPogodnosti(newPogodnosti) {
  if (!newPogodnosti.wifi) newPogodnosti.wifi = false;
  if (!newPogodnosti.parking) newPogodnosti.parking = false;
  if (!newPogodnosti.struja16a) newPogodnosti.struja16a = false;
  if (!newPogodnosti.struja10a) newPogodnosti.struja10a = false;
  if (!newPogodnosti.struja6a) newPogodnosti.struja6a = false;
  if (!newPogodnosti.voda) newPogodnosti.voda = false;
  if (!newPogodnosti.kabelskaTv) newPogodnosti.kabelskaTv = false;
  if (!newPogodnosti.satelitskaTv) newPogodnosti.satelitskaTv = false;

  if (!newPogodnosti.odvodnja) newPogodnosti.odvodnja = false;
  if (!newPogodnosti.perilicaPosuda) newPogodnosti.perilicaPosuda = false;
  if (!newPogodnosti.susilicaPosuda) newPogodnosti.susilicaPosuda = false;
  if (!newPogodnosti.perilicaRublja) newPogodnosti.perilicaRublja = false;
  if (!newPogodnosti.susilicaRublja) newPogodnosti.susilicaRublja = false;
  if (!newPogodnosti.pegla) newPogodnosti.pegla = false;
  if (!newPogodnosti.klimaUredaj) newPogodnosti.klimaUredaj = false;
  if (!newPogodnosti.mikrovalna) newPogodnosti.mikrovalna = false;
  if (!newPogodnosti.toster) newPogodnosti.toster = false;
  if (!newPogodnosti.kuhaloZaVodu) newPogodnosti.kuhaloZaVodu = false;

  if (!newPogodnosti.petsAllowed) newPogodnosti.petsAllowed = false;
  if (!newPogodnosti.petsNotAllowed) newPogodnosti.petsNotAllowed = false;

  if (!newPogodnosti.rostilj) newPogodnosti.rostilj = false;
  if (!newPogodnosti.bazen) newPogodnosti.bazen = false;
  if (!newPogodnosti.jacuzzi) newPogodnosti.jacuzzi = false;
  if (!newPogodnosti.lounger) newPogodnosti.lounger = false;

  return newPogodnosti;
}

const savePogodnostiForAllVrstaSJ = async (req, res) => {
  let newPogodnosti = req.body;
  if (!(await validatePogodnosti(newPogodnosti, req.db))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, newPogodnosti.kampId))) return res.sendStatus(403);
  newPogodnosti = prepareNewPogodnosti(newPogodnosti);

  const sql = `UPDATE brojSJ SET
      wifi=${newPogodnosti.wifi}, parking=${newPogodnosti.parking}, 
      struja16a=${newPogodnosti.struja16a}, struja10a=${newPogodnosti.struja10a}, 
      struja6a=${newPogodnosti.struja6a}, voda=${newPogodnosti.voda}, 
      kabelskaTv=${newPogodnosti.kabelskaTv}, satelitskaTv=${newPogodnosti.satelitskaTv}, 
      odvodnja=${newPogodnosti.odvodnja}, perilicaPosuda=${newPogodnosti.perilicaPosuda}, 
      susilicaPosuda=${newPogodnosti.susilicaPosuda}, perilicaRublja=${newPogodnosti.perilicaRublja}, 
      susilicaRublja=${newPogodnosti.susilicaRublja}, pegla=${newPogodnosti.pegla}, 
      klimaUredaj=${newPogodnosti.klimaUredaj}, mikrovalna=${newPogodnosti.mikrovalna}, 
      toster=${newPogodnosti.toster}, kuhaloZaVodu=${newPogodnosti.kuhaloZaVodu}, 
      petsAllowed=${newPogodnosti.petsAllowed}, petsNotAllowed=${newPogodnosti.petsNotAllowed},
      rostilj=${newPogodnosti.rostilj}, bazen=${newPogodnosti.bazen},
      jacuzzi=${newPogodnosti.jacuzzi}, lounger=${newPogodnosti.lounger}
  WHERE vrstaSJ = ${newPogodnosti.vrstaSJ};`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    res.sendStatus(202);
  });
};

const saveParkingForAllVrstaSj = async (req, res) => {
  let newParkingCoordinates = req.body;
  if (!(await validateParkingCoordinates(newParkingCoordinates, req.db))) return res.sendStatus(400);
  if (!(await functionsBackend.checkPriviledges(req.db, req.userId, newParkingCoordinates.kampId)))
    return res.sendStatus(403);
  newParkingCoordinates = prepareNewParkingCoordinates(newParkingCoordinates);
  const sql =
    "UPDATE brojSJ SET parkingLatitude = ?, parkingLongitude = ? WHERE vrstaSj = ? AND kampId = ? AND deleted IS NOT TRUE;";
  const vars = [
    newParkingCoordinates.parkingLatitude,
    newParkingCoordinates.parkingLongitude,
    newParkingCoordinates.vrstaSJ,
    newParkingCoordinates.kampId,
  ];

  db.getPool(req.db).execute(sql, vars, (err, result) => {
    if (err) throw err;
    res.sendStatus(202);
  });
};

async function validateParkingCoordinates(newParkingCoordinates, database) {
  if (!Number(newParkingCoordinates.kampId) || !Number(newParkingCoordinates.vrstaSJ)) return false;
  let returnValue = true;
  let promises = [];
  //vrstaSJ mora postojati:
  promises.push(
    new Promise((resolve, reject) => {
      const sql = `SELECT EXISTS(SELECT * FROM vrstaSJ WHERE uid<=>${newParkingCoordinates.vrstaSJ} 
        AND kampId=${newParkingCoordinates.kampId} AND deleted IS NOT TRUE) as value;`;
      db.getPool(database).query(sql, (err, result) => {
        if (err) throw err;
        if (result[0].value === 0) returnValue = false;
        resolve();
      });
    })
  );
  await Promise.all(promises);
  return returnValue;
}

function prepareNewParkingCoordinates(newParkingCoordinates) {
  if (!newParkingCoordinates.parkingLatitude) newParkingCoordinates.parkingLatitude = null;
  if (!newParkingCoordinates.parkingLongitude) newParkingCoordinates.parkingLongitude = null;
  return newParkingCoordinates;
}

async function validateBrojSJ(newBrojSj, database) {
  if (!newBrojSj || !newBrojSj.kampId || !newBrojSj.vrstaSJ || !newBrojSj.brojMish) return false;

  //MOZDA pozvati validate pogodnosti ovdje da nije dupli kod

  if (!newBrojSj.uid) newBrojSj.uid = null;
  let returnValue = true;
  let promises = [];
  //vrstaSJ mora postojati:
  promises.push(
    new Promise(async (resolve, reject) => {
      if (!(await validatePogodnosti(newBrojSj, database))) returnValue = false;
      resolve();
    })
  );
  //brojMish mora biti jedinstven:
  promises.push(
    new Promise((resolve, reject) => {
      const sql = `SELECT EXISTS(SELECT * FROM brojSJ WHERE brojMish='${newBrojSj.brojMish}' 
      AND NOT uid<=>${newBrojSj.uid} AND kampId=${newBrojSj.kampId} AND deleted IS NOT TRUE) as value;`;
      db.getPool(database).query(sql, (err, result) => {
        if (err) throw err;
        if (result[0].value === 1) returnValue = false;
        resolve();
      });
    })
  );
  await Promise.all(promises);
  //MOZDA prepisati ovo da sve bude samo jedan sql query na bazu. Tu i svuda.
  return returnValue;
}

async function validatePogodnosti(newPogodnosti, database) {
  if (!newPogodnosti || !newPogodnosti.kampId || !newPogodnosti.vrstaSJ) return false;
  let returnValue = true;
  let promises = [];
  //vrstaSJ mora postojati:
  promises.push(
    new Promise((resolve, reject) => {
      const sql = `SELECT EXISTS(SELECT * FROM vrstaSJ WHERE uid<=>${newPogodnosti.vrstaSJ} 
        AND kampId=${newPogodnosti.kampId} AND deleted IS NOT TRUE) as value;`;
      db.getPool(database).query(sql, (err, result) => {
        if (err) throw err;
        if (result[0].value === 0) returnValue = false;
        resolve();
      });
    })
  );
  await Promise.all(promises);
  return returnValue;
}

export default {
  getAllBrojSJ,
  insertBrojSJ,
  deleteBrojSJ,
  getMishData,
  savePogodnostiForAllVrstaSJ,
  fromCsv,
  exportToCsv,
  getAllWithVrstaNames,
  getBrojSjByMapaId,
  getAllInDenisFormat,
  saveParkingForAllVrstaSj,
};
