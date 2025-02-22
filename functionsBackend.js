import db from "./config/dbConfig.js";
import path from "path";
import fs from "fs";
const __dirname = path.resolve();

const checkPriviledges = async (dbName, userId, kampId) => {
  let returnValue = false;
  if (await isAdmin(dbName, userId)) return true;
  if (!kampId) return false;
  const promise = new Promise((resolve, reject) => {
    const sql = `SELECT EXISTS(SELECT * FROM userkamp 
    WHERE userId=${userId} AND kampId=${kampId}) as value;`;
    db.getPool(dbName).query(sql, (err, result) => {
      if (err) throw err;
      returnValue = !!result[0].value;
      resolve();
    });
  });
  await promise;
  return returnValue;
};

const isAdmin = async (dbName, userId) => {
  let returnValue = false;
  await new Promise((resolve, reject) => {
    const sql = `SELECT isAdmin FROM users WHERE uid = ?;`;
    const vars = [userId];
    db.getPool(dbName).execute(sql, vars, (err, result) => {
      if (err) throw err;
      returnValue = !!result[0]?.isAdmin;
      resolve();
    });
  });
  return returnValue;
};

const isVlasnikObjekta = async (dbName, userId) => {
  let returnValue = false;
  await new Promise((resolve, reject) => {
    const sql = `SELECT isVlasnikObjekta FROM users WHERE uid = ?;`;
    const vars = [userId];
    db.getPool(dbName).query(sql, vars, (err, result) => {
      if (err) throw err;
      returnValue = !!result[0]?.isVlasnikObjekta;
      resolve();
    });
  });
  return returnValue;
};

const isTrue = (value) => {
  return !["ne", "0", "", "false", "null", "undefined"].includes(String(value).trim().toLowerCase());
};

const shouldTextBeNull = (value) => {
  return String(value).trim().toLowerCase() == "null";
};

const isPaid = async (database, packageName) => {
  if (!packageName) return false;
  packageName = packageName.toLocaleLowerCase();
  let isPaid = false;
  await new Promise((resolve, reject) => {
    const sql = "SELECT * FROM paidPackages;";
    db.getPool(database).query(sql, (err, results) => {
      if (err) throw err;
      isPaid = !!results.find((paidPackage) => paidPackage.packageName.toLocaleLowerCase() == packageName)?.paid;
      resolve();
    });
  });
  return isPaid;
};

const updateGeojsonFromDb = async (database, propertyId) => {
  let geojsonFilename = null;
  await new Promise((resolve, reject) => {
    const sql = "SELECT geojsonFile FROM kampovi WHERE uid = ? AND deleted IS NOT TRUE;";
    const vars = [propertyId];
    db.getPool(database).execute(sql, vars, (err, result) => {
      if (err) throw err;
      geojsonFilename = result[0].geojsonFile;
      resolve();
    });
  });
  if (!geojsonFilename) return new Error("File not found!");
  const pathToGeojson = path.join(__dirname, "..", "app", "kamp", "assets", "gj", geojsonFilename);
  return await updateGeojson(pathToGeojson, database, propertyId);
};

const updateGeojson = async (pathToGeojson, database, propertyId) => {
  let sjByMapId = {};
  await new Promise((resolve, reject) => {
    const sql =
      "SELECT brojSJ.mapaId AS mapId, brojSJ.broj AS number, vrstaSJ.oznaka AS mark, vrstaSJ.tip AS type FROM brojSJ JOIN vrstaSJ ON brojSJ.vrstaSj = vrstaSJ.uid WHERE brojSJ.kampId = ? AND brojSJ.deleted IS NOT TRUE;";
    const vars = [propertyId];
    db.getPool(database).execute(sql, vars, (err, brojeviSj) => {
      if (err) throw err;
      sjByMapId = brojeviSj.reduce((accumulator, sj) => {
        if (sj.mapId) accumulator[sj.mapId] = { number: sj.number, mark: sj.mark, type: sj.type };
        return accumulator;
      }, {});
      resolve();
    });
  });
  try {
    const geojson = JSON.parse(fs.readFileSync(pathToGeojson.toString()));
    geojson.features.forEach((feature) => {
      if (!feature.properties.id || feature.properties.id == "null") return;
      const sj = sjByMapId[feature.properties.id];
      if (!sj || sj.type == "A") return;
      if (feature.properties.terrace == "true") feature.properties.class = sj.mark;
      else if (feature.properties.number && feature.properties.number != "null" && feature.properties.number != "0") {
        if(feature.properties.class !== "patio"){
          feature.properties.class = sj.mark;
        }
        feature.properties.number = sj.number;
      }
    });
    fs.writeFileSync(pathToGeojson, JSON.stringify(geojson));
  } catch (error) {
    console.error("Error editing geojson file:", error);
    return error;
  }
  return null;
};

export default {
  checkPriviledges,
  isAdmin,
  isTrue,
  shouldTextBeNull,
  isVlasnikObjekta,
  isPaid,
  updateGeojson,
  updateGeojsonFromDb,
};
