const getVrstaText = {
  V: "Vrsta smještajne jedinice",
  S: "Smještajna jedinica",
  P: "Sve parcele",
  M: "Sve mobilke/Glamping",
};
let objects;
let filteredObjects;
let findOznakaMishUid = {};
let findBrojMishUid = {};
let oznakaMishData = {};
let brojMishData = {};

$(document).ready(async function () {
  showLink();
  await provjeriKamp();
  $("#activeKampName").html(window.sessionStorage.getItem("kampName"));
  $(".modal").modal();
  $(".datepicker").datepicker({
    autoClose: true,
    firstDay: 1,
    format: "yyyy-mm-dd",
  });
  $("#myNavBar").sidenav();
  $("select").formSelect();
  getData().then(displayData);
});

async function getData() {
  let promises = [];
  promises.push(
    httpGet("/cms/api/v1/stopBookings").then((results) => {
      objects = results;
      search();
    })
  );
  promises.push(
    httpGet("/cms/api/v1/vrstaSJ").then((results) => {
      results.forEach((vrstaSJ) => {
        oznakaMishData[vrstaSJ.oznakaMish] = null;
        findOznakaMishUid[vrstaSJ.oznakaMish] = vrstaSJ.uid;
      });
    })
  );
  promises.push(
    httpGet("/cms/api/v1/brojSJ").then((results) => {
      results.forEach((brojSJ) => {
        brojMishData[brojSJ.brojMish] = null;
        findBrojMishUid[brojSJ.brojMish] = brojSJ.uid;
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
            <th localization-key="Oznaka">${
              prijevodi["Oznaka"]?.[window.sessionStorage.getItem("language")] ||
              "Oznaka"
            }</th>
            <th localization-key="Datum od">${
              prijevodi["Datum od"]?.[
                window.sessionStorage.getItem("language")
              ] || "Datum od"
            }</th>
            <th localization-key="Datum do">${
              prijevodi["Datum do"]?.[
                window.sessionStorage.getItem("language")
              ] || "Datum do"
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
              prijevodi[getVrstaText[object.vrsta]]?.[
                window.sessionStorage.getItem("language")
              ] || getVrstaText[object.vrsta]
            )}</td>
            <td>${getDisplayValue(object.oznaka)}</td>
            <td>${getDisplayValue(object.datumOd)}</td>
            <td>${getDisplayValue(object.datumDo)}</td>
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

  $("#vrstaInput").val(object.vrsta);
  $("#vrstaInput").formSelect();
  vrstaChange();

  $("#oznakaInput").val(object.oznaka);

  $("#datumOdInput").val(object.datumOd);
  $("#datumDoInput").val(object.datumDo);

  $("#aktivnaCheckbox").prop("checked", !!object.aktivna);

  $("#saveButton").attr("onclick", `saveButton(${index})`);
  $("#editObjectModal").modal("open");
}

function addNew() {
  clearValidities();

  $("#vrstaInput").val("V");
  $("#vrstaInput").formSelect();
  vrstaChange();

  $("#oznakaInput").val("");

  $("#datumOdInput").val("");
  $("#datumDoInput").val("");

  $("#aktivnaCheckbox").prop("checked", true);

  $("#saveButton").attr("onclick", `saveButton(null)`);
  $("#editObjectModal").modal("open");
}

function confirmDelete(uid) {
  const index = getIndexByUid(uid, filteredObjects);
  $("#confirmDeleteButton").attr("onClick", `deleteInDB(${index})`);
  $("#confirmDelete").modal("open");
}

function deleteInDB(index) {
  httpDelete("/cms/api/v1/stopBooking/" + filteredObjects[index].uid)
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

  object.vrsta = $("#vrstaInput").val();

  object.oznaka = $("#oznakaInput").val();

  object.datumOd = $("#datumOdInput").val();
  object.datumDo = $("#datumDoInput").val();

  object.aktivna = $("#aktivnaCheckbox").is(":checked");

  httpPost("/cms/api/v1/stopBookings", object).then(getData).then(displayData);
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
        (object.oznaka &&
          String(object.oznaka).toLowerCase().includes(filter)) ||
        (object.datumOd &&
          String(object.datumOd).toLowerCase().includes(filter)) ||
        (object.datumDo &&
          String(object.datumDo).toLowerCase().includes(filter))
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
  //vrsta mora biti odabrana
  if (!getVrstaText[$("#vrstaInput").val()]) {
    result = false;
    setValidity($("#vrstaInput").parent(), false);
  } else setValidity($("#vrstaInput").parent(), true);
  //oznaka mora biti jedna od opcija ako nisu sve parcele/mobilke
  if ($("#vrstaInput").val() == "V") {
    if (!findOznakaMishUid[$("#oznakaInput").val()]) {
      result = false;
      setValidity($("#oznakaInput"), false);
    } else setValidity($("#oznakaInput"), true);
  }
  if ($("#vrstaInput").val() == "S") {
    if (!findBrojMishUid[$("#oznakaInput").val()]) {
      result = false;
      setValidity($("#oznakaInput"), false);
    } else setValidity($("#oznakaInput"), true);
  }
  //datumOd i datumDo moraju biti odabrani
  if (!$("#datumOdInput").val()) {
    result = false;
    setValidity($("#datumOdInput"), false);
  } else setValidity($("#datumOdInput"), true);
  if (!$("#datumDoInput").val()) {
    result = false;
    setValidity($("#datumDoInput"), false);
  } else setValidity($("#datumDoInput"), true);
  //datumOd mora biti prije datumDo
  if (
    $("#datumOdInput").val() &&
    $("#datumDoInput").val() &&
    $("#datumOdInput").val().localeCompare($("#datumDoInput").val()) <= 0
  ) {
    setValidity($("#datumOdInput"), true);
    setValidity($("#datumDoInput"), true);
  } else {
    result = false;
    setValidity($("#datumOdInput"), false);
    setValidity($("#datumDoInput"), false);
  }
  return result;
}

function postaviVrstaSJ() {
  $("#oznakaInput").autocomplete({
    data: oznakaMishData,
    minLength: 0,
  });
}

function postaviBrojSJ() {
  $("#oznakaInput").autocomplete({
    data: brojMishData,
    minLength: 0,
  });
}

function vrstaChange() {
  $("#oznakaInput").val("");
  const value = $("#vrstaInput").val();
  if (value == "V") postaviVrstaSJ();
  if (value == "S") postaviBrojSJ();

  if (value == "P" || value == "M") $("#oznakaInput").prop("disabled", true);
  else $("#oznakaInput").prop("disabled", false);
}
