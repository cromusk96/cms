import db from "../config/dbConfig.js";

const getAll = async (req, res) => {
  let generalTranslations = {};
  let translationOverrides = {};
  let promises = [];
  promises.push(
    new Promise((resolve, reject) => {
      const sql = "SELECT text_string, hr, en, it, de, nl, si, pl FROM translations WHERE deleted IS NOT TRUE;";
      db.getPool("campsabout").query(sql, (err, results) => {
        if (err) throw err;
        results.forEach((result) => (generalTranslations[result.text_string] = removeField("text_string", result)));
        resolve();
      });
    })
  );
  if (req.query.group) {
    promises.push(
      new Promise((resolve, reject) => {
        const sql = `SELECT mapaId, napomena_hr AS hr, napomena_en AS en, napomena_it AS it, napomena_de AS de, napomena_nl AS nl, napomena_si AS si, napomena_pl AS pl FROM objekti WHERE deleted IS NOT TRUE;`;
        db.getPool("ca_" + req.query.group).query(sql, (err, results) => {
          if (err) return resolve();
          results.forEach((result) => {
            if (!result.mapaId) return; //No key
            const row = removeField("mapaId", result);
            if (Object.values(row).every((value) => !value)) return; //no translations
            translationOverrides["note_" + result.mapaId] = row;
          });
          resolve();
        });
      })
    );
    promises.push(
      new Promise((resolve, reject) => {
        const sql = `SELECT mapaId, napomena_hr AS hr, napomena_en AS en, napomena_it AS it, napomena_de AS de, napomena_nl AS nl, napomena_si AS si, napomena_pl AS pl FROM brojSJ WHERE deleted IS NOT TRUE;`;
        db.getPool("ca_" + req.query.group).query(sql, (err, results) => {
          if (err) return resolve();
          results.forEach((result) => {
            if (!result.mapaId) return; //No key
            const row = removeField("mapaId", result);
            if (Object.values(row).every((value) => !value)) return; //no translations
            translationOverrides["note_" + result.mapaId] = row;
          });
          resolve();
        });
      })
    );
    promises.push(
      new Promise((resolve, reject) => {
        const sql = `SELECT text_string, hr, en, it, de, nl, si, pl FROM prijevodi WHERE deleted IS NOT TRUE;`;
        db.getPool("ca_" + req.query.group).query(sql, (err, results) => {
          if (err) return resolve();
          results.forEach((result) => (translationOverrides[result.text_string] = removeField("text_string", result)));
          resolve();
        });
      })
    );
  }
  await Promise.all(promises);

  res.send(Object.assign(generalTranslations, translationOverrides));
};

function removeField(fieldName, row) {
  const result = { ...row };
  delete result[fieldName];
  return result;
}

export default { getAll };
