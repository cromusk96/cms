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
  let promises = [];
  promises.push(
    httpGet("/cms/api/v1/podloga").then((results) => {
      objects = results;
      search();
    })
  );
  await Promise.all(promises);
}

function displayData() {
  let newhtml = `<thead>
        <tr>
          <th localization-key="Vrijednost">${
            prijevodi["Vrijednost"]?.[
              window.sessionStorage.getItem("language")
            ] || "Vrijednost"
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
        <td localization-key="${getDisplayValue(object.naziv)}">${
      prijevodi[object.naziv]?.[window.sessionStorage.getItem("language")] ||
      getDisplayValue(object.naziv)
    }</td>
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

  $("#nazivInput").val(
    prijevodi[object.naziv]?.[window.sessionStorage.getItem("language")] ||
      object.naziv
  );

  $("#saveButton").attr("onclick", `saveButton(${index})`);
  $("#editObjectModal").modal("open");
}

function addNew() {
  clearValidities();

  $("#nazivInput").val("");

  $("#saveButton").attr("onclick", `saveButton(null)`);
  $("#editObjectModal").modal("open");
}

function confirmDelete(uid) {
  const index = getIndexByUid(uid, filteredObjects);
  $("#confirmDeleteButton").attr("onClick", `deleteInDB(${index})`);
  $("#confirmDelete").modal("open");
}

function deleteInDB(index) {
  httpDelete("/cms/api/v1/podloga/" + filteredObjects[index].uid)
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

  object.naziv = $("#nazivInput").val();

  httpPost("/cms/api/v1/podloga", object).then(getData).then(displayData);
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
        object.naziv && String(object.naziv).toLowerCase().includes(filter)
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
  //vrijednost je obavezno polje
  if (!$("#nazivInput").val()) {
    result = false;
    setValidity($("#nazivInput"), false);
  } else setValidity($("#nazivInput"), true);

  return result;
}
