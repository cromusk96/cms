let objects;
let filteredObjects;

$(document).ready(async function () {
  showLink();
  await provjeriKamp();
  $("#activeKampName").html(window.sessionStorage.getItem("kampName"));
  $(".modal").modal();
  $("#myNavBar").sidenav();
  $("select").formSelect();
  $("#colorInput").colorpicker({ format: "hex" });
  $("#haloInput").colorpicker({ format: "hex" });
  getData().then(displayData);
}); //MOZDA izbaciti sve što se može u init() funkciju

async function getData() {
  let i = 0;
  let promises = [];
  promises.push(
    httpGet("/cms/api/v1/natpisi").then((results) => {
      objects = results;
      search();
    })
  );
  await Promise.all(promises);
}

function displayData() {
  let newhtml = `<thead>
        <tr>
          <th localization-key="Aktivan">${
            prijevodi["Aktivan"]?.[window.sessionStorage.getItem("language")] || "Aktivan"
          }</th>
          <th localization-key="Text">${prijevodi["Text"]?.[window.sessionStorage.getItem("language")] || "Text"}</th>
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
            <td>${daIliNe(object.active)}</td>
            <td>${getDisplayValue(object.text)}</td>
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

  $("#mapIdInput").val(object.mapId);

  $("#activeCheckbox").prop("checked", object.active);
  $("#poravnajCheckbox").prop("checked", object.poravnaj);

  $("#textRotationAlignmentSelect").val(object.textRotationAlignment);
  $("#textRotationAlignmentSelect").formSelect();

  $("#textInput").val(object.text);
  M.textareaAutoResize($("#textInput"));

  $("#latitudeInput").val(object.latitude);
  $("#longitudeInput").val(object.longitude);
  $("#rotationInput").val(object.rotation);

  $("#colorInput").val(object.color);
  $("#haloInput").val(object.halo);
  $("#halowidthInput").val(object.halowidth);

  $("#fontMinInput").val(object.fontMin);
  $("#fontMaxInput").val(object.fontMax);

  $("#saveButton").attr("onclick", `saveButton(${index})`);
  $("#editObjectModal").modal("open");
}

function addNew() {
  clearValidities();

  $("#mapIdInput").val("");

  $("#activeCheckbox").prop("checked", true);
  $("#poravnajCheckbox").prop("checked", false);

  $("#textRotationAlignmentSelect").val("auto");
  $("#textRotationAlignmentSelect").formSelect();

  $("#textInput").val("");
  M.textareaAutoResize($("#textInput"));

  $("#latitudeInput").val("");
  $("#longitudeInput").val("");
  $("#rotationInput").val("");

  $("#colorInput").val("");
  $("#haloInput").val("");
  $("#halowidthInput").val("");

  $("#fontMinInput").val("");
  $("#fontMaxInput").val("");

  $("#saveButton").attr("onclick", `saveButton(null)`);
  $("#editObjectModal").modal("open");
}

function confirmDelete(uid) {
  const index = getIndexByUid(uid, filteredObjects);
  $("#confirmDeleteButton").attr("onClick", `deleteInDB(${index})`);
  $("#confirmDelete").modal("open");
}

function deleteInDB(index) {
  httpDelete("/cms/api/v1/natpis/" + filteredObjects[index].uid)
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

  object.mapId = $("#mapIdInput").val();

  object.active = $("#activeCheckbox").is(":checked");
  object.poravnaj = $("#poravnajCheckbox").is(":checked");

  object.textRotationAlignment = $("#textRotationAlignmentSelect").val();

  object.text = $("#textInput").val();

  object.latitude = $("#latitudeInput").val();
  object.longitude = $("#longitudeInput").val();
  object.rotation = $("#rotationInput").val();

  object.color = $("#colorInput").val();
  object.halo = $("#haloInput").val();
  object.halowidth = $("#halowidthInput").val();

  object.fontMin = $("#fontMinInput").val();
  object.fontMax = $("#fontMaxInput").val();

  httpPost("/cms/api/v1/natpisi", object).then(getData).then(displayData);
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
      (object) => object.text && String(object.text).toLowerCase().includes(filter)
    );
  });
}

function validateInput(uid) {
  clearValidities();
  let result = true;
  //Font Max mora biti veći od font min ako su oboje uneseni
  const fontMax = Number($("#fontMaxInput").val());
  const fontMin = Number($("#fontMinInput").val());
  if (fontMax && fontMin && fontMax < fontMin) {
    result = false;
    setValidity($("#fontMaxInput"), false);
    setValidity($("#fontMinInput"), false);
  }
  return result;
}

function applyFilters() {
  search();
  displayData();
}
