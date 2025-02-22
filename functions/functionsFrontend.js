function getIndexByUid(uid, array) {
  for (let i = 0; i < array.length; i++) if (array[i].uid == uid) return i;
}

function getDisplayValue(value) {
  if (!value || String(value).toLowerCase() == "null" || value == "undefined")
    return "";
  return value;
}

function daIliNe(value) {
  if (value) return `<i class="material-icons green-text small">check</i>`;
  return `<i class="material-icons red-text small">close</i>`;
}

async function provjeriKamp() {
  if (!window.sessionStorage.getItem("kampId")) {
    const result = await httpGet("/cms/api/v1/kampovi/default");
    if (!result || jQuery.isEmptyObject(result)) {
      addNewKamp();
      return;
    }
    window.sessionStorage.setItem("kampId", result.uid);
    window.sessionStorage.setItem("kampName", result.naziv);
    M.toast({
      html:
        (prijevodi["Odabran je kamp:"]?.[window.sessionStorage.getItem("language")] || "Odabran je kamp:") +
        " " +
        result.naziv,
      classes: "rounded",
    });
  }
}

async function showLink() {
  await httpGet("/cms/api/v1/isAdmin").then((result) => {
    if (result) $(".showToAdmin").removeClass("hide");
  });
}

function addNewKamp() {
  window.sessionStorage.setItem("kampId", "");
  window.sessionStorage.setItem("kampName", "Stvaranje novog kampa");
  window.location.href = "/cms/postavke";
}

function pasteCoordinates(parking) {
  const beginningString = parking ? "#parkingL" : "#l";
  navigator.clipboard
    .readText()
    .then((text) => {
      $(beginningString + "atitudeInput").val(JSON.parse(text).lng);
      $(beginningString + "ongitudeInput").val(JSON.parse(text).lat);
    })
    .catch((err) => {
      M.toast({
        html:
          prijevodi["Neuspješno čitanje clipboard-a"]?.[window.sessionStorage.getItem("language")] ||
          "Neuspješno čitanje clipboard-a",
        classes: "rounded",
      });
      console.error("Failed to read clipboard contents: ", err);
    });
}

let prijevodi;
async function translateNow() {
  //pročitaj jezik
  const language = window.sessionStorage.getItem("language");
  if (!language) return;
  //dohvati prijevode
  if (!prijevodi) {
    prijevodi = {};
    await new Promise((resolve, reject) => {
      httpGet("/cms/api/getCmsPrijevodi").then((results) => {
        results.forEach((p) => (prijevodi[p.text_string] = p));
        resolve();
      });
    });
  }
  //prevedi
  document.querySelectorAll("[localization-key]").forEach((e) => {
    const key = e.getAttribute("localization-key");
    const prijevod = prijevodi[key]
      ? prijevodi[key]
      : prijevodi[key.toUpperCase()]; //prijevodi za gumbe su u bazi u caps-lock-u
    if (!prijevod?.[language]) return; //Ako nemam prijevod ništa
    if (e.innerText) e.innerText = prijevod[language]; //prevedi textove
    if (e.getAttribute("data-error"))
      e.setAttribute("data-error", prijevod[language]); //i prevedi data-errore
    //MOZDA izmislit drugo ime za localization-key koji prevodi data-errore
  });
  //refreshaj selectove da se sigurno prevedu vrijednosti
  $("select").formSelect();
}
$(document).ready(function () {
  if (!window.sessionStorage.getItem("language"))
    window.sessionStorage.setItem("language", "hr");
  translateNow();
});
