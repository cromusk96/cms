const getTipText = {
  P: "Parcela",
  M: "Mobilna kućica/Glamping",
  A: "Apartman",
};
let objects;
let filteredObjects;

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
    httpGet("/cms/api/v1/vrstaSJ").then(async (results) => {
      objects = results.filter((vrstaSj) => !vrstaSj.nofilter);
      filteredObjects = [...objects];
      let availableTypes = {};
      objects.forEach((v) => (availableTypes[v.tip] = true));
      const tempData = Object.keys(availableTypes).reduce((accumulator, type) => {
        if (!availableTypes[type] || !getTipText[type]) return accumulator;
        accumulator[getTipText[type]] = null;
        return accumulator;
      }, {});
      $("#vrstaSjSelect").autocomplete({
        data: tempData,
        minLength: 0,
        onAutocomplete: () => {
          onVrstaFilterChange();
        },
      });
    })
  );
  await Promise.all(promises);
}

function displayData() {
  let newhtml = `<thead>
        <tr id="0">
            <th localization-key="Oznaka">${
              prijevodi["Oznaka"]?.[window.sessionStorage.getItem("language")] || "Oznaka"
            }</th>
            <th localization-key="Naziv">${
              prijevodi["Naziv"]?.[window.sessionStorage.getItem("language")] || "Naziv"
            }</th>
            <th class="hide-on-small-only" localization-key="Oznaka PMS">${
              prijevodi["Oznaka PMS"]?.[window.sessionStorage.getItem("language")] || "Oznaka PMS"
            }</th>
            <th class="hide-on-small-only" localization-key="Oznaka PHOBS">${
              prijevodi["Oznaka PHOBS"]?.[window.sessionStorage.getItem("language")] || "Oznaka PHOBS"
            }</th>
            <th localization-key="Boja">${prijevodi["Boja"]?.[window.sessionStorage.getItem("language")] || "Boja"}</th>
        </tr>
    </thead>
    <tbody>`;
  filteredObjects.forEach((object, index) => {
    newhtml += `<tr draggable="true" id="${index}">
            <td>${getDisplayValue(object.oznaka)}</td>
            <td>${getDisplayValue(object.naziv)}</td>
            <td class="hide-on-small-only">${getDisplayValue(object.oznakaMish)}</td>
            <td class="hide-on-small-only">${getDisplayValue(object.oznakaPhobs)}</td>
            <td> <div class="colorDiv" style="background-color: ${object.color}"></div></td>
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
  httpPost("/cms/api/v1/reorderVrstaSj", object).then(getData).then(onVrstaFilterChange);
}

function onVrstaFilterChange() {
  const filterValue = $("#vrstaSjSelect").val()[0];
  if (!filterValue) filteredObjects = [...objects];
  else filteredObjects = objects.filter((vrstaSj) => vrstaSj.tip == filterValue);
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

function clearFilter() {
  $("#vrstaSjSelect").val("");
  onVrstaFilterChange();
}
