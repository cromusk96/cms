let objects;
let filteredObjects;

$(document).ready(async function () {
  showLink();
  await provjeriKamp();
  $("#activeKampName").html(window.sessionStorage.getItem("kampName"));
  $(".modal").modal();
  $("#myNavBar").sidenav();
  getData().then(displayData);
});

async function getData() {
  let promises = [];
  promises.push(
    httpGet("/cms/api/v1/rateIdWhitelist").then((results) => {
      objects = results;
      search();
    })
  );
  await Promise.all(promises);
}

function displayData() {
  let newhtml = `<thead>
        <tr>
          <th localization-key="Rate ID">${
            prijevodi["Rate ID"]?.[window.sessionStorage.getItem("language")] || "Rate ID"
          }</th>
          <th localization-key="Prikaži">${prijevodi["Prikaži"]?.[window.sessionStorage.getItem("language")] || "Prikaži"}</th>
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
            <td>${getDisplayValue(object.rateId)}</td>
            <td>${daIliNe(object.include)}</td>
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
  object = filteredObjects[index];

  $("#rateIdInput").val(object.rateId);

  $("#includeCheckbox").prop("checked", object.include);

  $("#saveButton").attr("onclick", `saveButton(${index})`);
  $("#editObjectModal").modal("open");
}

function addNew() {
  clearValidities();

  $("#rateIdInput").val("");

  $("#includeCheckbox").prop("checked", true);

  $("#saveButton").attr("onclick", `saveButton(null)`);
  $("#editObjectModal").modal("open");
}

function confirmDelete(uid) {
  const index = getIndexByUid(uid, filteredObjects);
  $("#confirmDeleteButton").attr("onClick", `deleteInDB(${index})`);
  $("#confirmDelete").modal("open");
}

function deleteInDB(index) {
  httpDelete("/cms/api/v1/rateIdWhitelist/" + filteredObjects[index].uid)
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
        prijevodi["Nemože se spremiti jer podaci nisu dobro uneseni"]?.[window.sessionStorage.getItem("language")] ||
        "Nemože se spremiti jer podaci nisu dobro uneseni",
      classes: "rounded",
    });
    return;
  }

  object.rateId = $("#rateIdInput").val();

  object.include = $("#includeCheckbox").is(":checked");

  httpPost("/cms/api/v1/rateIdWhitelist", object).then(getData).then(displayData);
  $("#editObjectModal").modal("close");
}

function search() {
  const filters = $("#search")
    .val()
    .split(" ") //each word is a separate filter
    .map((filter) => filter.trim()) //ignore whitespace at the ends
    .filter((filter) => !!filter) //ignore empty strings
    .map((filter) => filter.toLowerCase()); //ignore case

  filteredObjects = [...objects];
  filters.forEach((filter) => {
    filteredObjects = filteredObjects.filter(
      (object) => object.rateId && String(object.rateId).toLowerCase().includes(filter)
    );
  });
}

function validateInput(uid) {
  clearValidities();
  let result = true;
  //RateId je obavezno polje
  if(!$("#rateIdInput").val()){
    result=false;
    setValidity($("#rateIdInput"),false)
  }
  return result;
}

function applyFilters() {
  search();
  displayData();
}
