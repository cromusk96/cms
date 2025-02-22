let objects;
let filteredObjects;
let vrsteObjekata;
let findVrstaObjektaUid = {};

$(document).ready(async function () {
  $(".modal").modal();
  $("select").formSelect();
  $(".tabs").tabs();
  $("#imageDisplayModal").modal({
    onCloseStart: () => {
      $("#editObjectModal").modal("open");
    },
  });
  $(".timepicker").timepicker({
    showClearBtn: true,
    autoClose: true,
    twelveHour: false,
    vibrate: false,
  });
  translateNow();
  $("#jezikSelect").val(window.sessionStorage.getItem("language"));
  $("#jezikSelect").formSelect();
  getData().then(displayData);
});

async function getData() {
  let promises = [];
  promises.push(
    httpGet("/cms/api/v1/getOwnedObjects").then((results) => {
      objects = results;
      search();
    })
  );
  promises.push(
    httpGet("/cms/api/v1/vrsteObjekata").then((results) => {
      vrsteObjekata = {};
      let tempData = {};
      results.forEach((vrstaObjekta) => {
        tempData[vrstaObjekta.naziv] = null;
        findVrstaObjektaUid[vrstaObjekta.naziv] = vrstaObjekta.uid;
        vrsteObjekata[vrstaObjekta.uid] = vrstaObjekta;
      });
      $("#vrstaObjektaUidInput").autocomplete({
        data: tempData,
        minLength: 0,
        onAutocomplete: () => {
          setValidity($("#vrstaObjektaUidInput"), true);
        },
      });
    })
  );
  await Promise.all(promises);
}

function displayData() {
  let newhtml = `<thead>
        <tr>
          <th localization-key="Vrsta">${
            prijevodi["Vrsta"]?.[window.sessionStorage.getItem("language")] ||
            "Vrsta"
          }</th>
          <th localization-key="Naziv">${
            prijevodi["Naziv"]?.[window.sessionStorage.getItem("language")] ||
            "Naziv"
          }</th>
          <th class="hide-on-small-only" localization-key="Podnaziv">${
            prijevodi["Podnaziv"]?.[window.sessionStorage.getItem("language")] ||
            "Podnaziv"
          }</th>
          <th class="hide-on-small-only" localization-key="Adresa">${
            prijevodi["Adresa"]?.[window.sessionStorage.getItem("language")] ||
            "Adresa"
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
            <td>${getDisplayValue(
              vrsteObjekata[object.vrstaObjektaUid]?.naziv
            )}</td>
            <td>${getDisplayValue(object.naziv)}</td>
            <td class="hide-on-small-only">${getDisplayValue(
              object.podnaziv
            )}</td>
            <td class="hide-on-small-only">${getDisplayValue(
              object.adresa
            )}</td>
            <td>
                <button class="btn-floating blue" onClick="openModal(${
                  object.uid
                })">
                    <i class="large material-icons">edit</i>
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

  $("#vrstaObjektaUidInput").val(vrsteObjekata[object.vrstaObjektaUid]?.naziv);

  $("#nazivInput").val(object.naziv);
  $("#podnazivInput").val(object.podnaziv);
  $("#telefonInput").val(object.telefon);
  $("#mailInput").val(object.mail);
  $("#wwwInput").val(object.www);
  $("#cjenikUrlInput").val(object.cjenikUrl);
  $("#adresaInput").val(object.adresa);
  $("#mjestoInput").val(object.mjesto);
  $("#drzavaInput").val(object.drzava);
  $("#radnoVrijemeInput").val(object.radno_vrijeme);
  $("#cjenikTextInput").val(object.cjenikText);
  $("#urlTextInput").val(object.urlText);

  $("#noclickCheckbox").prop("checked", object.noclick);
  $("#noteHeaderCheckbox").prop("checked", object.noteHeader);
  $("#overheadTextCheckbox").prop("checked", object.overheadText);

  $("#slikaInput").val(object.slika);
  $("#slika1Input").val(object.slika1);
  $("#slika2Input").val(object.slika2);
  $("#slika3Input").val(object.slika3);
  $("#slika4Input").val(object.slika4);
  $("#slika5Input").val(object.slika5);
  $("#slika6Input").val(object.slika6);
  $("#slika7Input").val(object.slika7);
  $("#slika8Input").val(object.slika8);

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

  $("#sinkCheckbox").prop("checked", object.sink);
  $("#showerCheckbox").prop("checked", object.shower);
  $("#childrenToiletCheckbox").prop("checked", object.childrenToilet);
  $("#chemicalToiletCheckbox").prop("checked", object.chemicalToilet);
  $("#disabledToiletCheckbox").prop("checked", object.disabledToilet);
  $("#privateToiletCheckbox").prop("checked", object.privateToilet);
  $("#clothingWashCheckbox").prop("checked", object.clothingWash);
  $("#dishWashCheckbox").prop("checked", object.dishWash);
  $("#laundryCheckbox").prop("checked", object.laundry);
  $("#dryerCheckbox").prop("checked", object.dryer);
  $("#dogShowerCheckbox").prop("checked", object.dogShower);
  $("#refrigeratorCheckbox").prop("checked", object.refrigerator);

  $("#ambulantaCheckbox").prop("checked", object.ambulanta);
  $("#barCheckbox").prop("checked", object.bar);
  $("#restaurantCheckbox").prop("checked", object.restaurant);
  $("#wellnessCheckbox").prop("checked", object.wellness);
  $("#hairdresserCheckbox").prop("checked", object.hairdresser);
  $("#fitnessCheckbox").prop("checked", object.fitness);
  $("#kioskCheckbox").prop("checked", object.kiosk);

  $("#ponOd1Input").val(object.ponOd1);
  $("#ponDo1Input").val(object.ponDo1);
  $("#ponOd2Input").val(object.ponOd2);
  $("#ponDo2Input").val(object.ponDo2);

  $("#utoOd1Input").val(object.utoOd1);
  $("#utoDo1Input").val(object.utoDo1);
  $("#utoOd2Input").val(object.utoOd2);
  $("#utoDo2Input").val(object.utoDo2);

  $("#sriOd1Input").val(object.sriOd1);
  $("#sriDo1Input").val(object.sriDo1);
  $("#sriOd2Input").val(object.sriOd2);
  $("#sriDo2Input").val(object.sriDo2);

  $("#cetOd1Input").val(object.cetOd1);
  $("#cetDo1Input").val(object.cetDo1);
  $("#cetOd2Input").val(object.cetOd2);
  $("#cetDo2Input").val(object.cetDo2);

  $("#petOd1Input").val(object.petOd1);
  $("#petDo1Input").val(object.petDo1);
  $("#petOd2Input").val(object.petOd2);
  $("#petDo2Input").val(object.petDo2);

  $("#subOd1Input").val(object.subOd1);
  $("#subDo1Input").val(object.subDo1);
  $("#subOd2Input").val(object.subOd2);
  $("#subDo2Input").val(object.subDo2);

  $("#nedOd1Input").val(object.nedOd1);
  $("#nedDo1Input").val(object.nedDo1);
  $("#nedOd2Input").val(object.nedOd2);
  $("#nedDo2Input").val(object.nedDo2);

  displayNeradniPeriodi(object);

  $("#saveButton").attr("onclick", `saveButton(${index})`);
  $("#editObjectModal").modal("open");
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

  object.vrstaObjektaUid =
    findVrstaObjektaUid[$("#vrstaObjektaUidInput").val()];

  object.naziv = $("#nazivInput").val();
  object.podnaziv = $("#podnazivInput").val();
  object.telefon = $("#telefonInput").val();
  object.mail = $("#mailInput").val();
  object.www = $("#wwwInput").val();
  object.cjenikUrl = $("#cjenikUrlInput").val();
  object.adresa = $("#adresaInput").val();
  object.mjesto = $("#mjestoInput").val();
  object.drzava = $("#drzavaInput").val();
  object.radno_vrijeme = $("#radnoVrijemeInput").val();
  object.cjenikText = $("#cjenikTextInput").val();
  object.urlText = $("#urlTextInput").val();

  object.noclick = $("#noclickCheckbox").is(":checked");
  object.noteHeader = $("#noteHeaderCheckbox").is(":checked");
  object.overheadText = $("#overheadTextCheckbox").is(":checked");

  object.slika = $("#slikaInput").val();
  object.slika1 = $("#slika1Input").val();
  object.slika2 = $("#slika2Input").val();
  object.slika3 = $("#slika3Input").val();
  object.slika4 = $("#slika4Input").val();
  object.slika5 = $("#slika5Input").val();
  object.slika6 = $("#slika6Input").val();
  object.slika7 = $("#slika7Input").val();
  object.slika8 = $("#slika8Input").val();

  object.napomena_hr = $("#napomena_hrInput").val();
  object.napomena_en = $("#napomena_enInput").val();
  object.napomena_de = $("#napomena_deInput").val();
  object.napomena_it = $("#napomena_itInput").val();
  object.napomena_nl = $("#napomena_nlInput").val();
  object.napomena_ru = $("#napomena_ruInput").val();
  object.napomena_si = $("#napomena_siInput").val();
  object.napomena_pl = $("#napomena_plInput").val();

  object.sink = $("#sinkCheckbox").is(":checked");
  object.shower = $("#showerCheckbox").is(":checked");
  object.childrenToilet = $("#childrenToiletCheckbox").is(":checked");
  object.chemicalToilet = $("#chemicalToiletCheckbox").is(":checked");
  object.disabledToilet = $("#disabledToiletCheckbox").is(":checked");
  object.privateToilet = $("#privateToiletCheckbox").is(":checked");
  object.clothingWash = $("#clothingWashCheckbox").is(":checked");
  object.dishWash = $("#dishWashCheckbox").is(":checked");
  object.laundry = $("#laundryCheckbox").is(":checked");
  object.dryer = $("#dryerCheckbox").is(":checked");
  object.dogShower = $("#dogShowerCheckbox").is(":checked");
  object.refrigerator = $("#refrigeratorCheckbox").is(":checked");

  object.ambulanta = $("#ambulantaCheckbox").is(":checked");
  object.bar = $("#barCheckbox").is(":checked");
  object.restaurant = $("#restaurantCheckbox").is(":checked");
  object.wellness = $("#wellnessCheckbox").is(":checked");
  object.hairdresser = $("#hairdresserCheckbox").is(":checked");
  object.fitness = $("#fitnessCheckbox").is(":checked");
  object.kiosk = $("#kioskCheckbox").is(":checked");

  object.ponOd1 = $("#ponOd1Input").val();
  object.ponDo1 = $("#ponDo1Input").val();
  object.ponOd2 = $("#ponOd2Input").val();
  object.ponDo2 = $("#ponDo2Input").val();

  object.utoOd1 = $("#utoOd1Input").val();
  object.utoDo1 = $("#utoDo1Input").val();
  object.utoOd2 = $("#utoOd2Input").val();
  object.utoDo2 = $("#utoDo2Input").val();

  object.sriOd1 = $("#sriOd1Input").val();
  object.sriDo1 = $("#sriDo1Input").val();
  object.sriOd2 = $("#sriOd2Input").val();
  object.sriDo2 = $("#sriDo2Input").val();

  object.cetOd1 = $("#cetOd1Input").val();
  object.cetDo1 = $("#cetDo1Input").val();
  object.cetOd2 = $("#cetOd2Input").val();
  object.cetDo2 = $("#cetDo2Input").val();

  object.petOd1 = $("#petOd1Input").val();
  object.petDo1 = $("#petDo1Input").val();
  object.petOd2 = $("#petOd2Input").val();
  object.petDo2 = $("#petDo2Input").val();

  object.subOd1 = $("#subOd1Input").val();
  object.subDo1 = $("#subDo1Input").val();
  object.subOd2 = $("#subOd2Input").val();
  object.subDo2 = $("#subDo2Input").val();

  object.nedOd1 = $("#nedOd1Input").val();
  object.nedDo1 = $("#nedDo1Input").val();
  object.nedOd2 = $("#nedOd2Input").val();
  object.nedDo2 = $("#nedDo2Input").val();

  for (let i = 0; i < object?.neradniPeriodi?.length; i++) {
    object.neradniPeriodi[i].datumOd = $("#neradniDatumOd" + i + "Input").val();
    object.neradniPeriodi[i].datumDo = $("#neradniDatumDo" + i + "Input").val();
  }

  httpPost("/cms/api/v1/objekti", object).then(getData).then(displayData);
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
        (object.vrstaObjektaUid &&
          String(vrsteObjekata[object.broj]).toLowerCase().includes(filter)) ||
        (object.naziv && String(object.naziv).toLowerCase().includes(filter)) ||
        (object.podnaziv &&
          String(object.podnaziv).toLowerCase().includes(filter))
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
  //vrsta objekta je obavezno polje i mora biti od ponuđenoga
  if (!findVrstaObjektaUid[$("#vrstaObjektaUidInput").val()]) {
    result = false;
    setValidity($("#vrstaObjektaUidInput"), false);
  } else setValidity($("#vrstaObjektaUidInput"), true);
  //naziv je obavezno polje
  if (!$("#nazivInput").val()) {
    result = false;
    setValidity($("#nazivInput"), false);
  } else setValidity($("#nazivInput"), true);
  for (
    let i = 0;
    i < objects[getIndexByUid(uid, objects)]?.neradniPeriodi?.length;
    i++
  ) {
    //neradni periodi moraju imati od:
    if (!$("#neradniDatumOd" + i + "Input").val()) {
      result = false;
      setValidity($("#neradniDatumOd" + i + "Input"), false);
    } else setValidity($("#neradniDatumOd" + i + "Input"), true);
    //neradni periodi moraju imati od: prije do:
    if (
      $("#neradniDatumDo" + i + "Input").val() &&
      $("#neradniDatumOd" + i + "Input").val() >
        $("#neradniDatumDo" + i + "Input").val()
    ) {
      result = false;
      setValidity($("#neradniDatumOd" + i + "Input"), false);
      setValidity($("#neradniDatumDo" + i + "Input"), false);
    } else {
      setValidity($("#neradniDatumOd" + i + "Input"), true);
      setValidity($("#neradniDatumDo" + i + "Input"), true);
    }
  }

  return result;
}

function displayNeradniPeriodi(object) {
  if (!object)
    $("#neradniPeriodiDiv").html(
      `<div class="col s12">
        <p localization-key="Neradne periode je moguće definirati nakon što je objekt stvoren.">${
          prijevodi[
            "Neradne periode je moguće definirati nakon što je objekt stvoren."
          ]?.[window.sessionStorage.getItem("language")] ||
          "Neradne periode je moguće definirati nakon što je objekt stvoren."
        }</p>
      </div>`
    ); //MOZDA omogućiti neradne periode na stvaranju
  let html =
    `<div class="col s12"><p localization-key="Neradni periodi:">${
      prijevodi["Neradni periodi:"]?.[
                window.sessionStorage.getItem("language")
              ] || "Neradni periodi:"
    }</p></div>` + `<div class="col s12 divider"></div>`;
  for (let i = 0; i < object?.neradniPeriodi?.length; i++)
    html += `
      <div class="col s2 m1 right-align"><p id="od${i}Label" localization-key="Od:">${
      prijevodi["Od:"]?.[window.sessionStorage.getItem("language")] || "Od:"
    }</p></div>
      <div class="col s10 m5 input-field">
        <input
          type="text"
          class="datepicker"
          id="neradniDatumOd${i}Input"
          onchange="updateDatum(true, ${i}, ${object?.uid})"
          autocomplete="off"
        />
        <span
          class="helper-text"
          data-error="${
            prijevodi["Obavezno polje. Mora biti prije datuma do."]?.[
                window.sessionStorage.getItem("language")
              ] || "Obavezno polje. Mora biti prije datuma do."
          }"
          data-success=""
          localization-key="Obavezno polje. Mora biti prije datuma do."
        ></span>
      </div>
      <div class="col s2 m1 right-align"><p id="do${i}Label localization-key="Do:">${
      prijevodi["Do:"]?.[window.sessionStorage.getItem("language")] || "Do:"
    }</p></div>
      <div class="col s10 m5 input-field">
        <input
          type="text"
          class="datepicker"
          id="neradniDatumDo${i}Input"
          onchange="updateDatum(false, ${i}, ${object?.uid})"
          autocomplete="off"
        />
        <span
          class="helper-text"
          data-error="${
            prijevodi["Mora biti poslije datuma od."]?.[
                window.sessionStorage.getItem("language")
              ] || "Mora biti poslije datuma od."
          }"
          data-success=""
          localization-key="Mora biti poslije datuma od."
        ></span>
      </div>
      <div class="col s6 m6">
        <button
          class="waves-effect waves-light btn red"
          onclick="deleteNeradniPeriod(${object.uid},${i})"
        >
          <i class="material-icons left">delete</i>
          Obriši
        </button>
      </div>
      <div class="col s6 m6">
        <p>
          <label class="black-text">
            <input
              type="checkbox"
              class="filled-in"
              id="neradniPeriod${i}Checkbox"
              onchange="onSingleDayChange(${i})"
            />
            <span class="mySpanPadding" localization-key="Samo jedan dan">${
              prijevodi["Samo jedan dan"]?.[
                window.sessionStorage.getItem("language")
              ] || "Samo jedan dan"
            }</span>
          </label>
        </p>
      </div>
      <div class="col s12 divider"></div>
  `;
  html += `
  <div class="col s12 right-align">
    <button
      class="waves-effect waves-light btn"
      onclick="addNewPeriod(${object?.uid})"
    >
      <i class="material-icons left">add</i>
      <span localization-key="Novi neradni period">${
        prijevodi["Novi neradni period"]?.[
                window.sessionStorage.getItem("language")
              ] || "Novi neradni period"
      }</span>
    </button>
  </div>`;
  $("#neradniPeriodiDiv").html(html);
  for (let i = 0; i < object?.neradniPeriodi?.length; i++) {
    $("#neradniDatumOd" + i + "Input").val(object.neradniPeriodi[i].datumOd);
    $("#neradniDatumDo" + i + "Input").val(object.neradniPeriodi[i].datumDo);
    if (!object.neradniPeriodi[i].datumDo)
      $("#neradniDatum" + i + "Checkbox").prop("checked", true);
  }
  $(".datepicker").datepicker({
    autoClose: true,
    firstDay: 1,
    format: "yyyy-mm-dd",
    container: "body", //bug workaround - ovako ne odscrolla modal na vrh
  });
}

function addNewPeriod(id) {
  let i = getIndexByUid(id, objects);
  if (!objects[i].neradniPeriodi) objects[i].neradniPeriodi = [];
  objects[i].neradniPeriodi.push({ objectId: id });
  displayNeradniPeriodi(objects[i]);
}

function deleteNeradniPeriod(id, index) {
  let i = getIndexByUid(id, objects);
  objects[i].neradniPeriodi.splice(index, 1);
  displayNeradniPeriodi(objects[i]);
}

function onSingleDayChange(i) {
  if ($("#neradniPeriod" + i + "Checkbox").is(":checked")) {
    $("#od" + i + "Label").html("Datum:");
    $("#do" + i + "Label").html("");
    $("#neradniDatumDo" + i + "Input").val("");
    $("#neradniDatumDo" + i + "Input").prop("disabled", true);
  } else {
    $("#od" + i + "Label").html("Od:");
    $("#do" + i + "Label").html("Do:");
    $("#neradniDatumDo" + i + "Input").prop("disabled", false);
  }
}

function updateDatum(isOd, index, objectId) {
  //ovo je potrebno da se datumi u novim periodima ne obrišu kad stvoriš još jedan
  const elementId = "#neradniDatum" + (isOd ? "Od" : "Do") + index + "Input";
  objects[getIndexByUid(objectId, objects)].neradniPeriodi[index][
    "datum" + (isOd ? "Od" : "Do")
  ] = $(elementId).val();
}

function kopirajZaSveDane(danIndex) {
  const kraticeDana = ["ned", "pon", "uto", "sri", "cet", "pet", "sub"];
  const od1 = $("#" + kraticeDana[danIndex] + "Od1Input").val();
  const do1 = $("#" + kraticeDana[danIndex] + "Do1Input").val();
  const od2 = $("#" + kraticeDana[danIndex] + "Od2Input").val();
  const do2 = $("#" + kraticeDana[danIndex] + "Do2Input").val();

  for (let i = 0; i < kraticeDana.length; i++) {
    $("#" + kraticeDana[i] + "Od1Input").val(od1);
    $("#" + kraticeDana[i] + "Do1Input").val(do1);
    $("#" + kraticeDana[i] + "Od2Input").val(od2);
    $("#" + kraticeDana[i] + "Do2Input").val(do2);
  }
}

function changeLanguage() {
  window.sessionStorage.setItem("language", $("#jezikSelect").val());
  translateNow();
}
