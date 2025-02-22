import db from "../config/dbConfig.js";

const getAllTranslations = async (req, res) => {
  let generalTranslations = {};
  let translationOverrides = {};
  let promises = [];
  promises.push(
    new Promise((resolve, reject) => {
      const sql = "SELECT text_string, hr, en, it, de, nl, si, pl FROM translations WHERE deleted IS NOT TRUE;";
      db.getPool("campsabout").query(sql, (err, results) => {
        if (err) throw err;
        results.forEach((result) => (generalTranslations[result.text_string] = result));
        resolve();
      });
    })
  );
  promises.push(
    new Promise((resolve, reject) => {
      const sql = `SELECT * FROM prijevodi WHERE deleted IS NOT TRUE;`;
      db.getPool(req.db).query(sql, (err, results) => {
        if (err) return resolve();
        results.forEach((result) => (translationOverrides[result.text_string] = result));
        resolve();
      });
    })
  );
  await Promise.all(promises);

  res.send(Object.values(Object.assign(generalTranslations, translationOverrides)));
};

const insertTranslation = async (req, res) => {
  let newTranslation = req.body;
  if (!(await validateTranslation(newTranslation, req.db))) return res.sendStatus(400);
  newTranslation = prepareNewTranslation(newTranslation);

  let sql;
  let status = 400;
  if (!newTranslation.uid) {
    sql = `INSERT INTO prijevodi(
        text_string, 
        hr, en, de, 
        it, nl, ru, 
        si, pl,
        hr_m, en_m, de_m, 
        it_m, nl_m, ru_m, 
        si_m, pl_m
    ) VALUES (
        '${newTranslation.text_string}', 
        '${newTranslation.hr}', '${newTranslation.en}', '${newTranslation.de}', 
        '${newTranslation.it}', '${newTranslation.nl}', '${newTranslation.ru}', 
        '${newTranslation.si}', '${newTranslation.pl}',
        '${newTranslation.hr_m}', '${newTranslation.en_m}', '${newTranslation.de_m}', 
        '${newTranslation.it_m}', '${newTranslation.nl_m}', '${newTranslation.ru_m}', 
        '${newTranslation.si_m}', '${newTranslation.pl_m}'
    );`;
    status = 201;
  } else {
    sql = `UPDATE prijevodi SET
        text_string='${newTranslation.text_string}', 
        hr='${newTranslation.hr}', 
        en='${newTranslation.en}', de='${newTranslation.de}', 
        it='${newTranslation.it}', nl='${newTranslation.nl}', 
        ru='${newTranslation.ru}', si='${newTranslation.si}', 
        pl='${newTranslation.pl}', 
        hr_m='${newTranslation.hr_m}', 
        en_m='${newTranslation.en_m}', de_m='${newTranslation.de_m}', 
        it_m='${newTranslation.it_m}', nl_m='${newTranslation.nl_m}', 
        ru_m='${newTranslation.ru_m}', si_m='${newTranslation.si_m}', 
        pl_m='${newTranslation.pl_m}'
    WHERE uid = ${newTranslation.uid};`;
    status = 202;
  }
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    return res.sendStatus(status);
  });
};

const deleteTranslation = (req, res) => {
  if (!req.params.uid || isNaN(parseInt(req.params.uid))) return res.sendStatus(400);
  const sql = `UPDATE prijevodi SET deleted=TRUE WHERE uid=${req.params.uid};`;
  db.getPool(req.db).query(sql, (err, results) => {
    if (err) throw err;
    return res.sendStatus(202);
  });
};

async function validateTranslation(newTranslation, database) {
  if (!newTranslation || !newTranslation.text_string) return false;

  if (!newTranslation.uid) newTranslation.uid = null;
  let returnValue = true;

  //text_string mora biti jedinstven
  const promise = new Promise((resolve, reject) => {
    const sql = `SELECT EXISTS(SELECT * FROM prijevodi WHERE 
      text_string='${newTranslation.text_string}' AND NOT uid<=>${newTranslation.uid}
      AND deleted IS NOT TRUE) as value;`;
    db.getPool(database).query(sql, (err, result) => {
      if (err) throw err;
      if (result[0].value) returnValue = false;
      resolve();
    });
  });
  await promise;
  return returnValue;
}

function prepareNewTranslation(newTranslation) {
  //uid ostavljam kakav je

  if (!newTranslation.hr) newTranslation.hr = "";
  if (!newTranslation.en) newTranslation.en = "";
  if (!newTranslation.de) newTranslation.de = "";
  if (!newTranslation.it) newTranslation.it = "";
  if (!newTranslation.nl) newTranslation.nl = "";
  if (!newTranslation.ru) newTranslation.ru = "";
  if (!newTranslation.si) newTranslation.si = "";
  if (!newTranslation.pl) newTranslation.pl = "";

  if (!newTranslation.hr_m) newTranslation.hr_m = "";
  if (!newTranslation.en_m) newTranslation.en_m = "";
  if (!newTranslation.de_m) newTranslation.de_m = "";
  if (!newTranslation.it_m) newTranslation.it_m = "";
  if (!newTranslation.nl_m) newTranslation.nl_m = "";
  if (!newTranslation.ru_m) newTranslation.ru_m = "";
  if (!newTranslation.si_m) newTranslation.si_m = "";
  if (!newTranslation.pl_m) newTranslation.pl_m = "";

  return newTranslation;
}

export default {
  getAllTranslations,
  insertTranslation,
  deleteTranslation,
};
