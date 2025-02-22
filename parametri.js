let objects;
let filteredObjects;

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
  await httpGet("/cms/api/v1/isAdmin").then((result) => {
    if (!result) window.location.href = "/cms";
  });
  let promises = [];
  promises.push(
    httpGet("/cms/api/v1/parametri").then((results) => {
      objects = results;
      search();
    })
  );
  await Promise.all(promises);
}

function displayData() {
  let newhtml = `<thead>
        <tr>
        <th localization-key="Naziv polja">${
          prijevodi["Naziv polja"]?.[window.sessionStorage.getItem("language")] ||
          "Naziv polja"
        }</th>
        <th localization-key="Vrijednost polja">${
          prijevodi["Vrijednost polja"]?.[
                window.sessionStorage.getItem("language")
              ] || "Vrijednost polja"
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
              <td>${getDisplayValue(object.nazivPolja)}</td>
              <td class="hide-on-small-only">${getDisplayValue(
                object.vrijednostPolja
              )}</td>
              <td class="hide-on-med-and-up">${myTruncate(
                getDisplayValue(object.vrijednostPolja),
                14
              )}</td>
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

  $("#nazivPoljaInput").val(object.nazivPolja);

  $("#vrijednostPoljaInput").val(object.vrijednostPolja);

  $("#saveButton").attr("onclick", `saveButton(${index})`);
  $("#editObjectModal").modal("open");
}

function addNew() {
  clearValidities();

  $("#nazivPoljaInput").val("");

  $("#vrijednostPoljaInput").val("");

  $("#saveButton").attr("onclick", `saveButton(null)`);
  $("#editObjectModal").modal("open");
}

function confirmDelete(uid) {
  const index = getIndexByUid(uid, filteredObjects);
  $("#confirmDeleteButton").attr("onClick", `deleteInDB(${index})`);
  $("#confirmDelete").modal("open");
}

function deleteInDB(index) {
  httpDelete("/cms/api/v1/parametar/" + filteredObjects[index].uid)
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

  object.nazivPolja = $("#nazivPoljaInput").val();

  object.vrijednostPolja = $("#vrijednostPoljaInput").val();

  httpPost("/cms/api/v1/parametri", object).then(getData).then(displayData);
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
        (object.nazivPolja &&
          String(object.nazivPolja).toLowerCase().includes(filter)) ||
        (object.vrijednostPolja &&
          String(object.vrijednostPolja).toLowerCase().includes(filter))
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
  //nazivPolja je obavezno polje
  if (!$("#nazivPoljaInput").val()) {
    result = false;
    setValidity($("#nazivPoljaInput"), false);
  } else setValidity($("#nazivPoljaInput"), true);

  return result;
}

function myTruncate(string, numberOfCharacters) {
  if (!numberOfCharacters) numberOfCharacters = 25;
  if (string.length < numberOfCharacters) return string;
  return string.substring(0, numberOfCharacters) + "...";
}
