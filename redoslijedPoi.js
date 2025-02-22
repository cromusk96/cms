let objects;
let filteredObjects;
let ikonice;
let ikoniceByName = {};
let groups;
let groupNazivById = {};

$(document).ready(async function () {
  showLink();
  await provjeriKamp();
  $("#activeKampName").html(window.sessionStorage.getItem("kampName"));
  $("#myNavBar").sidenav();
  $("select").formSelect();
  getData().then(displayData).then(setupDragAndDrop);
});

async function getData() {
  let promises = [];
  promises.push(
    httpGet("/cms/api/v1/tockeInteresa").then((results) => {
      objects = results;
      filteredObjects = [...results];
    })
  );
  promises.push(
    httpGet("/cms/api/v1/grupeTocki").then((results) => {
      groups = results;
      groupNazivById = results.reduce((acc, g) => {
        acc[g.uid] = g.naziv;
        return acc;
      }, {});
      let newHtml = `<option value="" selected localization-key="Nema grupe">${
        prijevodi["Nema grupe"]?.[window.sessionStorage.getItem("language")] || "Nema grupe"
      }</option>`;
      groups.forEach((g) => {
        newHtml += `<option value="${g.uid}" localization-key="${g.naziv}">${
          prijevodi[g.naziv]?.[window.sessionStorage.getItem("language")] || g.naziv
        }</option>`;
      });
      $("#grupaSelect").html(newHtml);
      $("#grupaSelect").formSelect();
    })
  );
  await Promise.all(promises);
}

function displayData() {
  let newhtml = `<thead>
        <tr id="0">
            <th localization-key="Naziv">${
              prijevodi["Naziv"]?.[window.sessionStorage.getItem("language")] || "Naziv"
            }</th>
            <th localization-key="Ikonica">${
              prijevodi["Ikonica"]?.[window.sessionStorage.getItem("language")] || "Ikonica"
            }</th>
            <th localization-key="Grupa">${
              prijevodi["Grupa"]?.[window.sessionStorage.getItem("language")] || "Grupa"
            }</th>
            <th localization-key="www text">${
              prijevodi["www text"]?.[window.sessionStorage.getItem("language")] || "www text"
            }</th>
        </tr>
    </thead>
    <tbody>`;
  filteredObjects.forEach((object, index) => {
    newhtml += `<tr draggable="true" id="${index}">
            <td>${getDisplayValue(object.naziv)}</td>
            <td>${getDisplayValue(object.ikonica)}</td>
            <td>${getDisplayValue(groupNazivById[object.grupa])}</td>
            <td>${getDisplayValue(object.wwwText)}</td>
        </tr>`;
  });
  newhtml += "</tbody>";
  $("#objectTable").html(newhtml);
}

function saveButton() {
  const object = {
    orderedListOfIds: filteredObjects.map((o) => o.uid),
    kampId: window.sessionStorage.getItem("kampId"),
  };
  httpPost("/cms/api/v1/reorderPoi", object).then(getData).then(onVrstaFilterChange);
}

function onVrstaFilterChange() {
  const filterValue = $("#grupaSelect").val();
  if (!filterValue) filteredObjects = [...objects];
  else filteredObjects = objects.filter((poi) => poi.grupa == filterValue);
  displayData();
}

function setupDragAndDrop() {
  const table = document.getElementById("objectTable");
  let draggedItem = null;

  table.addEventListener("dragstart", (event) => {
    draggedItem = event.target;
  });

  table.addEventListener("dragover", (event) => {
    event.preventDefault(); // Prevent default to allow drop
  });

  table.addEventListener("dragenter", (event) => {
    //if (event.target.tagName === "TR") {
    event.target.parentElement.style.border = "2px dashed #000"; // Optional: highlight the drop target
    //}
  });

  table.addEventListener("dragleave", (event) => {
    //if (event.target.tagName === "TR") {
    event.target.parentElement.style.border = ""; // Reset border
    //}
  });

  table.addEventListener("drop", (event) => {
    event.preventDefault();
    event.target.parentElement.style.border = ""; // Reset border

    const draggedFromIndex = draggedItem.id;
    const draggedToIndex = event.target.parentElement.id;

    moveObject(draggedFromIndex, draggedToIndex);
  });
}

function moveObject(fromIndex, toIndex) {
  const [movedObject] = filteredObjects.splice(fromIndex, 1);
  filteredObjects.splice(toIndex, 0, movedObject);
  displayData();
}
