let objects;
let filteredObjects;
let vrsteSJ;
let findVrstaSjUid = {};
let osuncanostValues;
let podlogaValues;

$(document).ready(async function () {
  showLink();
  await provjeriKamp();
  $("#activeKampName").html(window.sessionStorage.getItem("kampName"));
  $(".modal").modal();
  $("#myNavBar").sidenav();
  $("select").formSelect();
  $(".tabs").tabs();
  $("#imageDisplayModal").modal({
    onCloseStart: () => {
      $("#editObjectModal").modal("open");
    },
  });
  getData().then(displayData);
});

async function getData() {
  let promises = [];
  promises.push(
    httpGet("/cms/api/v1/brojSJ").then((results) => {
      objects = results;
      filter();
      search();
    })
  );
  promises.push(
    httpGet("/cms/api/v1/vrstaSJ").then((results) => {
      vrsteSJ = {};
      let tempData = {};
      results.forEach((vrstaSJ) => {
        tempData[vrstaSJ.oznaka + " - " + vrstaSJ.naziv] = null;
        findVrstaSjUid[vrstaSJ.oznaka + " - " + vrstaSJ.naziv] = vrstaSJ.uid;
        vrsteSJ[vrstaSJ.uid] = vrstaSJ;
      });
      $("#vrstaSjInput").autocomplete({
        data: tempData,
        minLength: 0,
        onAutocomplete: () => {
          setValidity($("#vrstaSjInput"), true);
          $("#vrstaMishInput").val(vrsteSJ[findVrstaSjUid[$("#vrstaSjInput").val()]].oznakaMish);
        },
      });
      $("#vrstaSjSelect").autocomplete({
        data: tempData,
        minLength: 0,
        onAutocomplete: () => {
          applyFilters();
        },
      });
    })
  );
  promises.push(
    httpGet("/cms/api/v1/osuncanost").then((results) => {
      osuncanostValues = results;
      let newhtml = `<option value="" disabled selected localization-key="Odaberite">${
        prijevodi["Odaberite"]?.[window.sessionStorage.getItem("language")] || "Odaberite"
      }</option>`;
      osuncanostValues.forEach((osuncanost) => {
        newhtml += `<option value="${osuncanost.uid}" localization-key="${osuncanost.osuncanost}">${
          prijevodi[osuncanost.osuncanost]?.[window.sessionStorage.getItem("language")] || osuncanost.osuncanost
        }</option>`;
      });
      $("#osuncanostInput").html(newhtml);
      $("#osuncanostInput").formSelect();
    })
  );
  promises.push(
    httpGet("/cms/api/v1/podloga").then((results) => {
      podlogaValues = results;
      let newhtml = `<option value="" disabled selected localization-key="Odaberite">${
        prijevodi["Odaberite"]?.[window.sessionStorage.getItem("language")] || "Odaberite"
      }</option>`;
      podlogaValues.forEach((podloga) => {
        newhtml += `<option value="${podloga.uid}" localization-key="${podloga.naziv}">${
          prijevodi[podloga.naziv]?.[window.sessionStorage.getItem("language")] || podloga.naziv
        }</option>`;
      });
      $("#podlogaInput").html(newhtml);
      $("#podlogaInput").formSelect();
    })
  );
  await Promise.all(promises);
}

function displayData() {
  let newhtml = `<thead>
      <tr>
        <th localization-key="Broj">${prijevodi["Broj"]?.[window.sessionStorage.getItem("language")] || "Broj"}</th>
        <th localization-key="Vrsta">${prijevodi["Vrsta"]?.[window.sessionStorage.getItem("language")] || "Vrsta"}</th>
        <th localization-key="Površina">${
          prijevodi["Površina"]?.[window.sessionStorage.getItem("language")] || "Površina"
        }</th>
        <th class="hide-on-small-only" localization-key="Broj PMS" >${
          prijevodi["Broj PMS"]?.[window.sessionStorage.getItem("language")] || "Broj PMS"
        }</th>
        <th class="hide-on-small-only" localization-key="Vrsta PMS">${
          prijevodi["Vrsta PMS"]?.[window.sessionStorage.getItem("language")] || "Vrsta PMS"
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
    displayList = filteredObjects.slice((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage);
  } else {
    displayList = filteredObjects;
  }
  displayList.forEach((object) => {
    newhtml += `<tr>
            <td>${getDisplayValue(object.broj)}</td>
            <td>${
              getDisplayValue(vrsteSJ[object.vrstaSJ]?.oznaka) + " - " + getDisplayValue(vrsteSJ[object.vrstaSJ]?.naziv)
            }</td>
            <td>${getDisplayValue(object.povrsina)}</td>
            <td class="hide-on-small-only">${getDisplayValue(object.brojMish)}</td>
            <td class="hide-on-small-only">${getDisplayValue(object.vrstaMish)}</td>
            <td>
                <button class="btn-floating blue" onClick="openModal(${object.uid})">
                    <i class="large material-icons">edit</i>
                </button>
                <button class="btn-floating red" onClick="confirmDelete(${object.uid})">
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

  $("#brojInput").val(object.broj);

  $("#vrstaSjInput").val(vrsteSJ[object.vrstaSJ]?.oznaka + " - " + vrsteSJ[object.vrstaSJ]?.naziv);

  $("#pmsUnitIdInput").val(object.pmsUnitId);
  $("#brojOsobaInput").val(object.brojOsoba);
  $("#brojDjeceInput").val(object.brojDjece);
  $("#kapacitetLezajevaInput").val(object.kapacitetLezajeva);

  $("#duzinaInput").val(object.duzina);
  $("#sirinaInput").val(object.sirina);
  $("#velicinaInput").val(object.velicina);
  $("#duzina2Input").val(object.duzina2);
  $("#sirina3Input").val(object.sirina3);
  $("#povrsinaInput").val(object.povrsina);

  $("#osuncanostInput").val(object.osuncanostId);
  $("#osuncanostInput").formSelect();
  $("#podlogaInput").val(object.podlogaId);
  $("#podlogaInput").formSelect();

  $("#brojMishInput").val(object.brojMish);
  $("#vrstaMishInput").val(object.vrstaMish);

  $("#strujaIdInput").val(object.strujaId);
  $("#vodaIdInput").val(object.vodaId);

  $("#slikaInput").val(object.slika);
  $("#virtualTourInput").val(object.virtualTour);
  $("#slika1Input").val(object.slika1);
  $("#slika2Input").val(object.slika2);
  $("#slika3Input").val(object.slika3);
  $("#slika4Input").val(object.slika4);
  $("#slika5Input").val(object.slika5);
  $("#slika6Input").val(object.slika6);
  $("#slika7Input").val(object.slika7);
  $("#slika8Input").val(object.slika8);

  $("#mapaIdInput").val(object.mapaId);
  $("#brojGpsInput").val(object.brojGps);
  $("#latitudeInput").val(object.latitude);
  $("#longitudeInput").val(object.longitude);
  $("#parkingLatitudeInput").val(object.parkingLatitude);
  $("#parkingLongitudeInput").val(object.parkingLongitude);

  $("#nagibCheckbox").prop("checked", object.nagib);
  $("#drvoCheckbox").prop("checked", object.drvo);
  $("#dostupnaCheckbox").prop("checked", object.dostupna);
  $("#samoNaUpitCheckbox").prop("checked", object.samoNaUpit);
  $("#vanjskiCheckbox").prop("checked", object.vanjski);
  $("#pausalCheckbox").prop("checked", object.pausal);
  $("#noclickCheckbox").prop("checked", object.noclick);
  $("#openModalCheckbox").prop("checked", object.openModal);
  $("#noteHeaderCheckbox").prop("checked", object.noteHeader);
  $("#nePrikazujBrojCheckbox").prop("checked", object.nePrikazujBroj);

  $("#wifiCheckbox").prop("checked", object.wifi);
  $("#parkingCheckbox").prop("checked", object.parking);
  $("#struja16aCheckbox").prop("checked", object.struja16a);
  $("#struja10aCheckbox").prop("checked", object.struja10a);
  $("#struja6aCheckbox").prop("checked", object.struja6a);
  $("#vodaCheckbox").prop("checked", object.voda);
  $("#kabelskaTvCheckbox").prop("checked", object.kabelskaTv);
  $("#satelitskaTvCheckbox").prop("checked", object.satelitskaTv);

  $("#odvodnjaCheckbox").prop("checked", object.odvodnja);
  $("#perilicaPosudaCheckbox").prop("checked", object.perilicaPosuda);
  $("#susilicaPosudaCheckbox").prop("checked", object.susilicaPosuda);
  $("#perilicaRubljaCheckbox").prop("checked", object.perilicaRublja);
  $("#susilicaRubljaCheckbox").prop("checked", object.susilicaRublja);
  $("#peglaCheckbox").prop("checked", object.pegla);
  $("#klimaUredajCheckbox").prop("checked", object.klimaUredaj);
  $("#mikrovalnaCheckbox").prop("checked", object.mikrovalna);
  $("#tosterCheckbox").prop("checked", object.toster);
  $("#kuhaloZaVoduCheckbox").prop("checked", object.kuhaloZaVodu);

  $("#petsAllowedCheckbox").prop("checked", object.petsAllowed);
  $("#petsNotAllowedCheckbox").prop("checked", object.petsNotAllowed);

  $("#rostiljCheckbox").prop("checked", object.rostilj);
  $("#bazenCheckbox").prop("checked", object.bazen);
  $("#jacuzziCheckbox").prop("checked", object.jacuzzi);
  $("#loungerCheckbox").prop("checked", object.lounger);

  $("#napomena_hrInput").val(object.napomena_hr);
  M.textareaAutoResize($("#napomena_hrInput"));
  $("#napomena_enInput").val(object.napomena_en);
  M.textareaAutoResize($("#napomena_enInput"));
  $("#napomena_deInput").val(object.napomena_de);
  M.textareaAutoResize($("#napomena_deInput"));
  $("#napomena_itInput").val(object.napomena_it);
  M.textareaAutoResize($("#napomena_itInput"));
  $("#napomena_nlInput").val(object.napomena_nl);
  M.textareaAutoResize($("#napomena_nlInput"));
  $("#napomena_ruInput").val(object.napomena_ru);
  M.textareaAutoResize($("#napomena_ruInput"));
  $("#napomena_siInput").val(object.napomena_si);
  M.textareaAutoResize($("#napomena_siInput"));
  $("#napomena_plInput").val(object.napomena_pl);
  M.textareaAutoResize($("#napomena_plInput"));

  $("#saveButton").attr("onclick", `saveButton(${index})`);
  $("#editObjectModal").modal("open");
}

function addNew() {
  clearValidities();

  $("#brojInput").val("");

  $("#vrstaSjInput").val("");

  $("#pmsUnitIdInput").val("");
  $("#brojOsobaInput").val("");
  $("#brojDjeceInput").val("");
  $("#kapacitetLezajevaInput").val("");

  $("#duzinaInput").val("");
  $("#sirinaInput").val("");
  $("#velicinaInput").val("");
  $("#duzina2Input").val("");
  $("#sirina3Input").val("");
  $("#povrsinaInput").val("");

  $("#osuncanostInput").val("");
  $("#osuncanostInput").formSelect();
  $("#podlogaInput").val("");
  $("#podlogaInput").formSelect();

  $("#brojMishInput").val("");
  $("#vrstaMishInput").val("");

  $("#strujaIdInput").val("");
  $("#vodaIdInput").val("");

  $("#slikaInput").val("");
  $("#virtualTourInput").val("");
  $("#slika1Input").val("");
  $("#slika2Input").val("");
  $("#slika3Input").val("");
  $("#slika4Input").val("");
  $("#slika5Input").val("");
  $("#slika6Input").val("");
  $("#slika7Input").val("");
  $("#slika8Input").val("");

  $("#mapaIdInput").val("");
  $("#brojGpsInput").val("");
  $("#latitudeInput").val("");
  $("#longitudeInput").val("");
  $("#parkingLatitudeInput").val("");
  $("#parkingLongitudeInput").val("");

  $("#nagibCheckbox").prop("checked", false);
  $("#drvoCheckbox").prop("checked", false);
  $("#dostupnaCheckbox").prop("checked", true);
  $("#samoNaUpitCheckbox").prop("checked", false);
  $("#vanjskiCheckbox").prop("checked", false);
  $("#pausalCheckbox").prop("checked", false);
  $("#noclickCheckbox").prop("checked", false);
  $("#openModalCheckbox").prop("checked", true);
  $("#noteHeaderCheckbox").prop("checked", false);
  $("#nePrikazujBrojCheckbox").prop("checked", false);

  $("#wifiCheckbox").prop("checked", false);
  $("#parkingCheckbox").prop("checked", false);
  $("#struja16aCheckbox").prop("checked", false);
  $("#struja10aCheckbox").prop("checked", false);
  $("#struja6aCheckbox").prop("checked", false);
  $("#vodaCheckbox").prop("checked", false);
  $("#kabelskaTvCheckbox").prop("checked", false);
  $("#satelitskaTvCheckbox").prop("checked", false);

  $("#odvodnjaCheckbox").prop("checked", false);
  $("#perilicaPosudaCheckbox").prop("checked", false);
  $("#susilicaPosudaCheckbox").prop("checked", false);
  $("#perilicaRubljaCheckbox").prop("checked", false);
  $("#susilicaRubljaCheckbox").prop("checked", false);
  $("#peglaCheckbox").prop("checked", false);
  $("#klimaUredajCheckbox").prop("checked", false);
  $("#mikrovalnaCheckbox").prop("checked", false);
  $("#tosterCheckbox").prop("checked", false);
  $("#kuhaloZaVoduCheckbox").prop("checked", false);

  $("#petsAllowedCheckbox").prop("checked", false);
  $("#petsNotAllowedCheckbox").prop("checked", false);

  $("#rostiljCheckbox").prop("checked", false);
  $("#bazenCheckbox").prop("checked", false);
  $("#jacuzziCheckbox").prop("checked", false);
  $("#loungerCheckbox").prop("checked", false);

  $("#napomena_hrInput").val("");
  M.textareaAutoResize($("#napomena_hrInput"));
  $("#napomena_enInput").val("");
  M.textareaAutoResize($("#napomena_enInput"));
  $("#napomena_deInput").val("");
  M.textareaAutoResize($("#napomena_deInput"));
  $("#napomena_itInput").val("");
  M.textareaAutoResize($("#napomena_itInput"));
  $("#napomena_nlInput").val("");
  M.textareaAutoResize($("#napomena_nlInput"));
  $("#napomena_ruInput").val("");
  M.textareaAutoResize($("#napomena_ruInput"));
  $("#napomena_siInput").val("");
  M.textareaAutoResize($("#napomena_siInput"));
  $("#napomena_plInput").val("");
  M.textareaAutoResize($("#napomena_plInput"));

  $("#saveButton").attr("onclick", `saveButton(null)`);
  $("#editObjectModal").modal("open");
}

function confirmDelete(uid) {
  const index = getIndexByUid(uid, filteredObjects);
  $("#confirmDeleteButton").attr("onClick", `deleteInDB(${index})`);
  $("#confirmDelete").modal("open");
}

function deleteInDB(index) {
  httpDelete("/cms/api/v1/brojSJ/" + filteredObjects[index].uid)
    .then(getData)
    .then(applyFilters);
}

function saveButton(index) {
  let object;
  if (index || index === 0) object = Object.assign({}, filteredObjects[index]);
  else object = { kampId: window.sessionStorage.getItem("kampId") };
  if (!validateInput(object.uid)) {
    M.toast({
      html:
        prijevodi["Nemože se spremiti jer podaci nisu dobro uneseni"]?.[window.sessionStorage.getItem("language")] ||
        "Nemože se spremiti jer podaci nisu dobro uneseni",
      classes: "rounded",
    });
    return;
  }

  object.broj = $("#brojInput").val();

  object.vrstaSJ = findVrstaSjUid[$("#vrstaSjInput").val()];

  object.pmsUnitId = $("#pmsUnitIdInput").val();
  object.brojOsoba = $("#brojOsobaInput").val();
  object.brojDjece = $("#brojDjeceInput").val();
  object.kapacitetLezajeva = $("#kapacitetLezajevaInput").val();

  object.duzina = $("#duzinaInput").val();
  object.sirina = $("#sirinaInput").val();
  object.velicina = $("#velicinaInput").val();
  object.duzina2 = $("#duzina2Input").val();
  object.sirina3 = $("#sirina3Input").val();
  object.povrsina = $("#povrsinaInput").val();
  object.osuncanostId = $("#osuncanostInput").val();
  object.podlogaId = $("#podlogaInput").val();

  object.brojMish = $("#brojMishInput").val();
  object.vrstaMish = $("#vrstaMishInput").val();

  object.strujaId = $("#strujaIdInput").val();
  object.vodaId = $("#vodaIdInput").val();

  object.slika = $("#slikaInput").val();
  object.virtualTour = $("#virtualTourInput").val();
  object.slika1 = $("#slika1Input").val();
  object.slika2 = $("#slika2Input").val();
  object.slika3 = $("#slika3Input").val();
  object.slika4 = $("#slika4Input").val();
  object.slika5 = $("#slika5Input").val();
  object.slika6 = $("#slika6Input").val();
  object.slika7 = $("#slika7Input").val();
  object.slika8 = $("#slika8Input").val();

  object.mapaId = $("#mapaIdInput").val();
  object.brojGps = $("#brojGpsInput").val();
  object.latitude = $("#latitudeInput").val();
  object.longitude = $("#longitudeInput").val();
  object.parkingLatitude = $("#parkingLatitudeInput").val();
  object.parkingLongitude = $("#parkingLongitudeInput").val();

  object.nagib = $("#nagibCheckbox").is(":checked");
  object.drvo = $("#drvoCheckbox").is(":checked");
  object.dostupna = $("#dostupnaCheckbox").is(":checked");
  object.samoNaUpit = $("#samoNaUpitCheckbox").is(":checked");
  object.vanjski = $("#vanjskiCheckbox").is(":checked");
  object.pausal = $("#pausalCheckbox").is(":checked");
  object.noclick = $("#noclickCheckbox").is(":checked");
  object.openModal = $("#openModalCheckbox").is(":checked");
  object.noteHeader = $("#noteHeaderCheckbox").is(":checked");
  object.nePrikazujBroj = $("#nePrikazujBrojCheckbox").is(":checked");

  object.wifi = $("#wifiCheckbox").is(":checked");
  object.parking = $("#parkingCheckbox").is(":checked");
  object.struja16a = $("#struja16aCheckbox").is(":checked");
  object.struja10a = $("#struja10aCheckbox").is(":checked");
  object.struja6a = $("#struja6aCheckbox").is(":checked");
  object.voda = $("#vodaCheckbox").is(":checked");
  object.kabelskaTv = $("#kabelskaTvCheckbox").is(":checked");
  object.satelitskaTv = $("#satelitskaTvCheckbox").is(":checked");

  object.odvodnja = $("#odvodnjaCheckbox").is(":checked");
  object.perilicaPosuda = $("#perilicaPosudaCheckbox").is(":checked");
  object.susilicaPosuda = $("#susilicaPosudaCheckbox").is(":checked");
  object.perilicaRublja = $("#perilicaRubljaCheckbox").is(":checked");
  object.susilicaRublja = $("#susilicaRubljaCheckbox").is(":checked");
  object.pegla = $("#peglaCheckbox").is(":checked");
  object.klimaUredaj = $("#klimaUredajCheckbox").is(":checked");
  object.mikrovalna = $("#mikrovalnaCheckbox").is(":checked");
  object.toster = $("#tosterCheckbox").is(":checked");
  object.kuhaloZaVodu = $("#kuhaloZaVoduCheckbox").is(":checked");

  object.petsAllowed = $("#petsAllowedCheckbox").is(":checked");
  object.petsNotAllowed = $("#petsNotAllowedCheckbox").is(":checked");

  object.rostilj = $("#rostiljCheckbox").is(":checked");
  object.bazen = $("#bazenCheckbox").is(":checked");
  object.jacuzzi = $("#jacuzziCheckbox").is(":checked");
  object.lounger = $("#loungerCheckbox").is(":checked");

  object.napomena_hr = $("#napomena_hrInput").val();
  object.napomena_en = $("#napomena_enInput").val();
  object.napomena_de = $("#napomena_deInput").val();
  object.napomena_it = $("#napomena_itInput").val();
  object.napomena_nl = $("#napomena_nlInput").val();
  object.napomena_ru = $("#napomena_ruInput").val();
  object.napomena_si = $("#napomena_siInput").val();
  object.napomena_pl = $("#napomena_plInput").val();

  httpPost("/cms/api/v1/brojSJ", object).then(getData).then(applyFilters);
  $("#editObjectModal").modal("close");
}

function confirmSavePogodnosti() {
  if (!validateVrstaSJ()) {
    M.toast({
      html:
        prijevodi["VrstaSJ mora biti odabrana"]?.[window.sessionStorage.getItem("language")] ||
        "VrstaSJ mora biti odabrana",
      classes: "rounded",
    });
    return;
  }
  $("#confirmSavePogodnosti").modal("open");
}

function savePogodnosti() {
  let pogodnosti = { kampId: window.sessionStorage.getItem("kampId") };

  pogodnosti.vrstaSJ = findVrstaSjUid[$("#vrstaSjInput").val()];

  pogodnosti.wifi = $("#wifiCheckbox").is(":checked");
  pogodnosti.parking = $("#parkingCheckbox").is(":checked");
  pogodnosti.struja16a = $("#struja16aCheckbox").is(":checked");
  pogodnosti.struja10a = $("#struja10aCheckbox").is(":checked");
  pogodnosti.struja6a = $("#struja6aCheckbox").is(":checked");
  pogodnosti.voda = $("#vodaCheckbox").is(":checked");
  pogodnosti.kabelskaTv = $("#kabelskaTvCheckbox").is(":checked");
  pogodnosti.satelitskaTv = $("#satelitskaTvCheckbox").is(":checked");

  pogodnosti.odvodnja = $("#odvodnjaCheckbox").is(":checked");
  pogodnosti.perilicaPosuda = $("#perilicaPosudaCheckbox").is(":checked");
  pogodnosti.susilicaPosuda = $("#susilicaPosudaCheckbox").is(":checked");
  pogodnosti.perilicaRublja = $("#perilicaRubljaCheckbox").is(":checked");
  pogodnosti.susilicaRublja = $("#susilicaRubljaCheckbox").is(":checked");
  pogodnosti.pegla = $("#peglaCheckbox").is(":checked");
  pogodnosti.klimaUredaj = $("#klimaUredajCheckbox").is(":checked");
  pogodnosti.mikrovalna = $("#mikrovalnaCheckbox").is(":checked");
  pogodnosti.toster = $("#tosterCheckbox").is(":checked");
  pogodnosti.kuhaloZaVodu = $("#kuhaloZaVoduCheckbox").is(":checked");

  pogodnosti.petsAllowed = $("#petsAllowedCheckbox").is(":checked");
  pogodnosti.petsNotAllowed = $("#petsNotAllowedCheckbox").is(":checked");

  pogodnosti.rostilj = $("#rostiljCheckbox").is(":checked");
  pogodnosti.bazen = $("#bazenCheckbox").is(":checked");
  pogodnosti.jacuzzi = $("#jacuzziCheckbox").is(":checked");
  pogodnosti.lounger = $("#loungerCheckbox").is(":checked");

  httpPost("/cms/api/v1/pogodnosti", pogodnosti).then(getData).then(displayData);
} //MOZDA pozvati ovo u saveButton() da ne dupliciram kod

function confirmSetParkingToVrsta() {
  if (!validateVrstaSJ()) {
    M.toast({
      html:
        prijevodi["VrstaSJ mora biti odabrana"]?.[window.sessionStorage.getItem("language")] ||
        "VrstaSJ mora biti odabrana",
      classes: "rounded",
    });
    return;
  }
  $("#confirmSaveParkingCoordinates").modal("open");
}

function setParkingToVrsta() {
  let parkingCoordinates = { kampId: window.sessionStorage.getItem("kampId") };

  parkingCoordinates.vrstaSJ = findVrstaSjUid[$("#vrstaSjInput").val()];

  parkingCoordinates.parkingLatitude = $("#parkingLatitudeInput").val();
  parkingCoordinates.parkingLongitude = $("#parkingLongitudeInput").val();

  httpPost("/cms/api/v1/brojSJ/setVrstaParking", parkingCoordinates).then(getData).then(displayData);
}

function search() {
  const filters = $("#search")
    .val()
    .split(" ") //each word is a separate filter
    .map((filter) => filter.trim()) //ignore whitespace at the ends
    .filter((filter) => !!filter) //ignore empty strings
    .map((filter) => filter.toLowerCase()); //ignore case

  filters.forEach((filter) => {
    filteredObjects = filteredObjects.filter(
      (object) =>
        (object.broj && String(object.broj).toLowerCase().includes(filter)) ||
        (object.brojMish && String(object.brojMish).toLowerCase().includes(filter)) ||
        (object.mapaId && String(object.mapaId).toLowerCase().includes(filter))
    );
  });
}

function filter(vrstaSjId) {
  if (vrstaSjId) return objects.filter((object) => object.vrstaSJ == vrstaSjId);
  //MOZDA ovo razdvojiti u dvije funkcije, čudno je ovako
  if (findVrstaSjUid[$("#vrstaSjSelect").val()]) {
    filteredObjects = objects.filter((object) => object.vrstaSJ == findVrstaSjUid[$("#vrstaSjSelect").val()]);
  } else {
    filteredObjects = [...objects];
  }
}

function applyFilters() {
  filter();
  dostupnostFilter();
  search();
  displayData();
}

function onVrstaFilterChange() {
  //MOZDA izbaciti ovu funkciju jer izgleda ko da je redundantna - bilo bi dosta pozvati applyFilters
  const filterValue = $("#vrstaSjSelect").val();
  if (!filterValue) {
    filteredObjects = [...objects];
    applyFilters();
    return;
  }
  if (findVrstaSjUid[filterValue]) {
    applyFilters();
    return;
  }
  return;
}

function clearFilter() {
  $("#vrstaSjSelect").val("");
  applyFilters();
}

function dostupnostFilter() {
  const filterValue = $("#dostupnostSelect").val();
  if (!filterValue || filterValue == "sve") return;

  if (filterValue.substring(0, 2) == "NO")
    filteredObjects = filteredObjects.filter((object) => !object[filterValue.substring(2)]);
  else filteredObjects = filteredObjects.filter((object) => object[filterValue] == true);
}

function validateInput(uid) {
  clearValidities();
  //vrstaSJ mora biti odabrana
  let result = validateVrstaSJ();
  //brojMish mora biti jedinstven
  if (checkForExistance($("#brojMishInput").val(), objects, "brojMish", uid)) {
    result = false;
    setValidity($("#brojMishInput"), false);
  } else setValidity($("#brojMishInput"), true);

  return result;
}

function validateVrstaSJ() {
  if (!findVrstaSjUid[$("#vrstaSjInput").val()]) {
    setValidity($("#vrstaSjInput"), false);
    return false;
  }
  setValidity($("#vrstaSjInput"), true);
  return true;
}
