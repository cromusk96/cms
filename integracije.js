let objects;
let filteredObjects;
let smjestaji;
let objekti;
let tockeInteresa;
let kampovi;
//MOZDA stavit ta 4 objekta u dictionaries={s:smjestaji,o:objekti,itd.}
const vrstaNames = {
  s: "Smještaj",
  o: "Objekt",
  t: "Točka interesa",
  k: "Kamp",
};

$(document).ready(async function () {
  showLink();
  await provjeriKamp();
  $("#activeKampName").html(window.sessionStorage.getItem("kampName"));
  $(".modal").modal();
  $("#myNavBar").sidenav();
  $("select").formSelect();
  getData().then(displayData);
});

async function getData() {
  let backendCalls = [];
  backendCalls.push(
    httpGet("/cms/api/v1/integracije").then((results) => {
      objects = results;
      search();
    })
  );
  backendCalls.push(
    httpGet("/cms/api/v1/brojSjWithVrstaNames").then((results) => {
      smjestaji = {};
      results.forEach((r) => (smjestaji[r.oznakaVrste + " - " + r.broj] = r));
    })
  );
  backendCalls.push(
    httpGet("/cms/api/v1/objekti").then((results) => {
      objekti = {};
      results.forEach((r) => (objekti[r.naziv] = r));
    })
  );
  backendCalls.push(
    httpGet("/cms/api/v1/tockeInteresa").then((results) => {
      tockeInteresa = {};
      results.forEach((r) => (tockeInteresa[r.naziv] = r));
    })
  );
  backendCalls.push(
    httpGet("/cms/api/v1/kampovi").then((results) => {
      kampovi = {};
      results.forEach((r) => (kampovi[r.naziv] = r));
    })
  );
  await Promise.all(backendCalls);
}

function displayData() {
  let newhtml = `
    <thead>
        <tr>
          <th localization-key="ID">${
            prijevodi["ID"]?.[window.sessionStorage.getItem("language")] || "ID"
          }</th>
          <th localization-key="Vrsta">${
            prijevodi["Vrsta"]?.[window.sessionStorage.getItem("language")] ||
            "Vrsta"
          }</th>
          <th localization-key="Endpoint">${
            prijevodi["Endpoint"]?.[
              window.sessionStorage.getItem("language")
            ] || "Endpoint"
          }</th>
          <th localization-key="Funkcija">${
            prijevodi["Funkcija"]?.[
              window.sessionStorage.getItem("language")
            ] || "Funkcija"
          }</th>
            <th></th>
        </tr>
    </thead>
    <tbody>`;
  initPagination(filteredObjects.length);
  const pageNumber = window.sessionStorage.getItem("pageNumber");
  const itemsPerPage = window.sessionStorage.getItem("itemsPerPage");
  let displayList;
  if (itemsPerPage && itemsPerPage != "SVE") {
    displayList = filteredObjects.slice(
      (pageNumber - 1) * itemsPerPage,
      pageNumber * itemsPerPage
    );
  } else {
    displayList = filteredObjects;
  }
  displayList.forEach((object) => {
    newhtml += `
        <tr>
            <td>${getDisplayValue(object.id)}</td>
            <td>${
              prijevodi[vrstaNames[object.vrsta]]?.[
                window.sessionStorage.getItem("language")
              ] || vrstaNames[object.vrsta]
            }</td>
            <td>${getDisplayValue(object.endpoint)}</td>
            <td>${getDisplayValue(object.funkcija)}</td>
            <td>
                <button class="btn-floating blue" onClick="openModal(${
                  object.uid
                })">
                    <i class="large material-icons">edit</i>
                </button>
                <button class="btn-floating red" onClick="confirmDelete(${
                  object.uid
                })">
                    <i class="large material-icons">delete</i>
                </button>
            </td>
        </tr>`;
  });
  newhtml += "</tbody>";
  $("#objectTable").html(newhtml);
}

function openModal(uid) {
  clearValidities();
  const index = getIndexByUid(uid, filteredObjects);
  const object = filteredObjects[index];

  $("#endpointInput").val(object.endpoint);
  $("#funkcijaInput").val(object.funkcija);
  $("#vrstaSelect").val(object.vrsta);
  $("#vrstaSelect").formSelect();
  setupElementAutocomplete(object.foreignId);

  $("#idInput").val(object.id);
  $("#activeCheckbox").prop("checked", !!object.active);

  $("#napomenaInput").val(object.napomena);
  M.textareaAutoResize($("#napomenaInput"));

  $("#opisInput").val(object.opis);
  M.textareaAutoResize($("#opisInput"));

  $("#tipSelect").val(object.tip);
  $("#tipSelect").formSelect();

  $("#timeIntervalInput").val(object.timeInterval);
  $("#poljeInput").val(object.polje);

  $("#saveButton").attr("onclick", `saveButton(${index})`);
  $("#editObjectModal").modal("open");
}

function addNew() {
  clearValidities();

  $("#endpointInput").val("");
  $("#funkcijaInput").val("");
  $("#vrstaSelect").val("");
  $("#vrstaSelect").formSelect();
  setupElementAutocomplete(null);

  $("#idInput").val("");
  $("#activeCheckbox").prop("checked", true);

  $("#napomenaInput").val("");
  M.textareaAutoResize($("#napomenaInput"));

  $("#opisInput").val("");
  M.textareaAutoResize($("#opisInput"));

  $("#tipSelect").val("");
  $("#tipSelect").formSelect();

  $("#timeIntervalInput").val("");
  $("#poljeInput").val("");

  $("#saveButton").attr("onclick", `saveButton(null)`);
  $("#editObjectModal").modal("open");
}

function confirmDelete(uid) {
  const index = getIndexByUid(uid, filteredObjects);
  $("#confirmDeleteButton").attr("onClick", `deleteInDB(${index})`);
  $("#confirmDelete").modal("open");
}

function deleteInDB(index) {
  httpDelete("/cms/api/v1/integracije/" + filteredObjects[index].uid)
    .then(getData)
    .then(displayData);
}

function saveButton(index) {
  let object;
  if (index || index === 0) object = Object.assign({}, filteredObjects[index]);
  else object = { kampId: window.sessionStorage.getItem("kampId") };
  if (!validateInput(object.uid)) {
    M.toast({
      html:
        prijevodi["Nemože se spremiti jer podaci nisu dobro uneseni"]?.[
          window.sessionStorage.getItem("language")
        ] || "Nemože se spremiti jer podaci nisu dobro uneseni",
      classes: "rounded",
    });
    return;
  }

  object.opis = $("#opisInput").val();
  object.endpoint = $("#endpointInput").val();
  object.funkcija = $("#funkcijaInput").val();
  object.vrsta = $("#vrstaSelect").val();

  if (object.vrsta == "s")
    object.foreignId = smjestaji[$("#foreinIdInput").val()]?.uid;
  if (object.vrsta == "o")
    object.foreignId = objekti[$("#foreinIdInput").val()]?.uid;
  if (object.vrsta == "t")
    object.foreignId = tockeInteresa[$("#foreinIdInput").val()]?.uid;
  if (object.vrsta == "k")
    object.foreignId = kampovi[$("#foreinIdInput").val()]?.uid;

  object.id = $("#idInput").val();
  object.active = $("#activeCheckbox").is(":checked");
  object.napomena = $("#napomenaInput").val();

  object.tip = $("#tipSelect").val();
  object.timeInterval = $("#timeIntervalInput").val();
  object.polje = $("#poljeInput").val();

  httpPost("/cms/api/v1/integracije", object).then(getData).then(displayData);
  $("#editObjectModal").modal("close");
}

function setupElementAutocomplete(foreignId) {
  $("#foreinIdInput").val("");
  const selectedType = $("#vrstaSelect").val();

  if (!selectedType) $("#foreinIdInput").prop("disabled", true);
  else $("#foreinIdInput").prop("disabled", false);

  if (selectedType == "s") fillAutocompleteValues(smjestaji, foreignId);
  if (selectedType == "o") fillAutocompleteValues(objekti, foreignId);
  if (selectedType == "t") fillAutocompleteValues(tockeInteresa, foreignId);
  if (selectedType == "k") fillAutocompleteValues(kampovi, foreignId);
}

function fillAutocompleteValues(dictionary, foreignId) {
  let tempData = {};
  let value = "";
  Object.keys(dictionary).forEach((key) => {
    tempData[key] = null;
    if (dictionary[key].uid == foreignId) value = key;
  });
  $("#foreinIdInput").autocomplete({
    data: tempData,
    minLength: 0,
    onAutocomplete: () => setValidity($("#foreinIdInput"), true),
  });
  $("#foreinIdInput").val(value);
}

function search() {
  filteredObjects = [...objects];
  const filters = $("#search")
    .val()
    .split(" ") //each word is a separate filter
    .map((filter) => filter.trim()) //ignore whitespace at the ends
    .filter((filter) => !!filter) //ignore empty strings
    .map((filter) => filter.toLowerCase()); //ignore case

  filters.forEach((filter) => {
    filteredObjects = filteredObjects.filter(
      (object) =>
        (object.opis && String(object.opis).toLowerCase().includes(filter)) ||
        (object.endpoint &&
          String(object.endpoint).toLowerCase().includes(filter)) ||
        (object.napomena &&
          String(object.napomena).toLowerCase().includes(filter)) ||
        (object.vrsta &&
          prijevodi[vrstaNames[object.vrsta]]?.[
            window.sessionStorage.getItem("language")
          ]
            ?.toLowerCase()
            .includes(filter))
    );
  });
}

function applyFilters() {
  search();
  displayData();
}

function validateInput(uid) {
  clearValidities();
  result = true;
  //vrsta je obavezno polje
  if (!vrstaNames[$("#vrstaSelect").val()]) {
    result = false;
    setValidity($("#vrstaSelect").parent(), false);
  } else setValidity($("#vrstaSelect").parent(), true);
  //element mora postojati ili biti prazan
  let dictionary = {};
  if ($("#vrstaSelect").val() == "s") dictionary = smjestaji;
  if ($("#vrstaSelect").val() == "o") dictionary = objekti;
  if ($("#vrstaSelect").val() == "t") dictionary = tockeInteresa;
  if ($("#vrstaSelect").val() == "k") dictionary = kampovi;
  if ($("#foreinIdInput").val() && !dictionary[$("#foreinIdInput").val()]) {
    result = false;
    setValidity($("#foreinIdInput"), false);
  } else setValidity($("#foreinIdInput"), true);

  return result;
}
