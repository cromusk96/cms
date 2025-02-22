let objects;
let filteredObjects;
let ikonice;
let ikoniceByName = {};
let groups;
let vrstePoi;

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
  let promises = [];
  promises.push(
    httpGet("/cms/api/v1/tockeInteresa").then((results) => {
      objects = results;
      search();
    })
  );
  promises.push(
    httpGet("/cms/api/v1/grupeTocki").then((results) => {
      groups = results;
      let newHtml = `<option value="" selected localization-key="Nema grupe">${
        prijevodi["Nema grupe"]?.[window.sessionStorage.getItem("language")] ||
        "Nema grupe"
      }</option>`;
      groups.forEach((g) => {
        newHtml += `<option value="${g.uid}" localization-key="${g.naziv}">${
          prijevodi[g.naziv]?.[window.sessionStorage.getItem("language")] ||
          g.naziv
        }</option>`;
      });
      $("#grupaSelect").html(newHtml);
      $("#grupaSelect").formSelect();
    })
  );
  promises.push(
    httpGet("/cms/api/v1/vrsteTocki").then((results) => {
      vrstePoi = results;
      let newHtml = "";
      vrstePoi.forEach((v) => {
        newHtml += `<option value="${v.uid}" localization-key="${
          v.vrstaTocke
        }">${
          prijevodi[v.vrstaTocke]?.[
            window.sessionStorage.getItem("language")
          ] || v.vrstaTocke
        }</option>`;
      });
      $("#vrstaPoiSelect").html(newHtml);
      $("#vrstaPoiSelect").formSelect();
    })
  );
  promises.push(
    httpGet("/cms/api/v1/ikonice").then((results) => {
      ikonice = results;
      let tempData = {};
      ikonice.forEach((i) => {
        tempData[i.split("/")[1].split(".")[0]] = "/cms/sprite_images/" + i;
        ikoniceByName[i.split("/")[1].split(".")[0]] = i;
      });
      $("#ikonicaSelect").autocomplete({
        data: tempData,
        minLength: 0,
        onAutocomplete: () => {
          setValidity($("#ikonicaSelect"), true);
        },
      });
    })
  );
  await Promise.all(promises);
}

function displayData() {
  let newhtml = `<thead>
        <tr>
            <th localization-key="ID na mapi">${
              prijevodi["ID na mapi"]?.[
                window.sessionStorage.getItem("language")
              ] || "ID na mapi"
            }</th>
            <th localization-key="Naziv">${
              prijevodi["Naziv"]?.[window.sessionStorage.getItem("language")] ||
              "Naziv"
            }</th>
            <th localization-key="Ikonica">${
              prijevodi["Ikonica"]?.[
                window.sessionStorage.getItem("language")
              ] || "Ikonica"
            }</th>
            <th localization-key="Aktivna">${
              prijevodi["Aktivna"]?.[
                window.sessionStorage.getItem("language")
              ] || "Aktivna"
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
    newhtml += `<tr>
            <td>${getDisplayValue(object.mapaId)}</td>
            <td>${getDisplayValue(object.naziv)}</td>
            <td>${getDisplayValue(object.ikonica)}</td>
            <td>${daIliNe(object.aktivna)}</td>
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

  $("#mapaIdInput").val(object.mapaId);

  $("#nazivInput").val(object.naziv);

  $("#ikonicaSelect").val(object.ikonica);
  $("#grupaSelect").val(object.grupa);
  $("#grupaSelect").formSelect();

  $("#vrstaPoiSelect").val(object.vrstaPoi);
  $("#vrstaPoiSelect").formSelect();

  $("#latitudeInput").val(object.latitude);
  $("#longitudeInput").val(object.longitude);

  $("#aktivnaCheckbox").prop("checked", object.aktivna);
  $("#noclickCheckbox").prop("checked", object.noclick);
  $("#openModalCheckbox").prop("checked", object.openModal);
  $("#nofilterCheckbox").prop("checked", object.nofilter);
  $("#navigationCheckbox").prop("checked", object.navigation);
  $("#panoramaCheckbox").prop("checked", object.panorama);
  $("#resortCheckbox").prop("checked", object.resort);
  $("#campCheckbox").prop("checked", object.camp);

  $("#straniKljucInput").val(object.straniKljuc);
  $("#redniBrojInput").val(object.redniBroj);

  $("#wwwTextInput").val(object.wwwText);
  $("#wwwInput").val(object.www);
  $("#opisInput").val(object.opis);
  M.textareaAutoResize($("#opisInput"));

  $("#slikaInput").val(object.slika);
  $("#slika1Input").val(object.slika1);

  $("#saveButton").attr("onclick", `saveButton(${index})`);
  $("#editObjectModal").modal("open");
}

function addNew() {
  clearValidities();

  $("#mapaIdInput").val("");

  $("#nazivInput").val("");

  $("#ikonicaSelect").val("");
  $("#grupaSelect").val("");
  $("#grupaSelect").formSelect();

  $("#vrstaPoiSelect").val(1); //This counts on there being an id of 1
  $("#vrstaPoiSelect").formSelect();

  $("#latitudeInput").val("");
  $("#longitudeInput").val("");

  $("#aktivnaCheckbox").prop("checked", true);
  $("#noclickCheckbox").prop("checked", false);
  $("#openModalCheckbox").prop("checked", false);
  $("#nofilterCheckbox").prop("checked", false);
  $("#navigationCheckbox").prop("checked", true);
  $("#panoramaCheckbox").prop("checked", false);
  $("#resortCheckbox").prop("checked", true);
  $("#campCheckbox").prop("checked", true);

  $("#straniKljucInput").val("");
  $("#redniBrojInput").val("");

  $("#wwwTextInput").val("");
  $("#wwwInput").val("");
  $("#opisInput").val("");
  M.textareaAutoResize($("#opisInput"));
  //MOZDA kontrolirati da li je text predugačak. Tu i svuda.

  $("#slikaInput").val("");
  $("#slika1Input").val("");

  $("#saveButton").attr("onclick", `saveButton(null)`);
  $("#editObjectModal").modal("open");
}

function confirmDelete(uid) {
  const index = getIndexByUid(uid, filteredObjects);
  $("#confirmDeleteButton").attr("onClick", `deleteInDB(${index})`);
  $("#confirmDelete").modal("open");
}

function deleteInDB(index) {
  httpDelete("/cms/api/v1/tockaInteresa/" + filteredObjects[index].uid)
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

  object.mapaId = $("#mapaIdInput").val();

  object.naziv = $("#nazivInput").val();

  object.ikonica = $("#ikonicaSelect").val();
  object.grupa = $("#grupaSelect").val();
  object.vrstaPoi = $("#vrstaPoiSelect").val();

  object.latitude = $("#latitudeInput").val();
  object.longitude = $("#longitudeInput").val();

  object.aktivna = $("#aktivnaCheckbox").is(":checked");
  object.noclick = $("#noclickCheckbox").is(":checked");
  object.openModal = $("#openModalCheckbox").is(":checked");
  object.nofilter = $("#nofilterCheckbox").is(":checked");
  object.navigation = $("#navigationCheckbox").is(":checked");
  object.panorama = $("#panoramaCheckbox").is(":checked");
  object.resort = $("#resortCheckbox").is(":checked");
  object.camp = $("#campCheckbox").is(":checked");

  object.straniKljuc = $("#straniKljucInput").val();
  object.redniBroj = $("#redniBrojInput").val();

  object.wwwText = $("#wwwTextInput").val();
  object.www = $("#wwwInput").val();
  object.opis = $("#opisInput").val();

  object.slika = $("#slikaInput").val();
  object.slika1 = $("#slika1Input").val();

  httpPost("/cms/api/v1/tockeInteresa", object).then(getData).then(displayData);
  $("#editObjectModal").modal("close");
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
        (object.naziv && String(object.naziv).toLowerCase().includes(filter)) ||
        (object.mapaId &&
          String(object.mapaId).toLowerCase().includes(filter)) ||
        (object.ikonica &&
          String(object.ikonica).toLowerCase().includes(filter)) ||
        (object.www && String(object.www).toLowerCase().includes(filter)) ||
        (object.wwwText &&
          String(object.wwwText).toLowerCase().includes(filter))
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
  //naziv je obavezno polje i mora biti jedinstven
  if (checkForExistance($("#nazivInput").val(), objects, "naziv", uid)) {
    result = false;
    setValidity($("#nazivInput"), false);
  } else setValidity($("#nazivInput"), true);
  //ikonica mora biti jedna od opcija
  if (!ikoniceByName[$("#ikonicaSelect").val()]) {
    result = false;
    setValidity($("#ikonicaSelect"), false);
  } else setValidity($("#ikonicaSelect"), true);

  return result;
}

function setGroupForAllIcons() {
  httpPost("/cms/api/v1/setGroupForIcon", {
    kampId: window.sessionStorage.getItem("kampId"),
    ikonica: $("#ikonicaSelect").val(),
    grupa: $("#grupaSelect").val(),
  })
    .then(getData)
    .then(displayData)
    .then(() => $("#editObjectModal").modal("close"));
}
