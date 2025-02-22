let objects;
let objectsByMarkId = {};
let filteredObjects;
let selectedYear = -1;
let vrsteSj;
let vrsteSjByIds;

$(document).ready(async function () {
  showLink();
  await provjeriKamp();
  $("#activeKampName").html(window.sessionStorage.getItem("kampName"));
  $("#myNavBar").sidenav();
  $("select").formSelect();
  setupYearButtons();
  getData().then(displayData);
}); //MOZDA izbaciti sve što se može u init() funkciju

function setupYearButtons() {
  $("#yearButton1").html(new Date().getFullYear());
  $("#yearButton2").html(new Date().getFullYear() + 1);
}

function selectYear(i) {
  selectedYear = new Date().getFullYear() + Number(i);
  applyFilters();
}

async function getData() {
  let promises = [];
  promises.push(
    httpGet("/cms/api/v1/cjenici").then((results) => {
      objects = results;
      results.forEach(
        (o) => (objectsByMarkId["" + o.godina + o.vrstaSjId] = o)
      );
    })
  );
  promises.push(
    httpGet("/cms/api/v1/vrstaSJ").then((results) => {
      vrsteSj = results;
      let vrsteSjByIdsTemp = {};
      results.forEach((vrstaSj) => {
        vrsteSjByIdsTemp[vrstaSj.uid] = vrstaSj;
      });
      vrsteSjByIds = vrsteSjByIdsTemp;
    })
  );
  await Promise.all(promises);
  const currentYear = new Date().getFullYear();
  vrsteSj.forEach((vrstaSj) => {
    if (!objectsByMarkId["" + currentYear + vrstaSj.uid]) {
      const newObject = {
        uid: null,
        godina: currentYear,
        vrstaSjId: vrstaSj.uid,
        phobsCjenik: null,
      };
      objects.push(newObject);
      objectsByMarkId["" + currentYear + vrstaSj.uid] = newObject;
    }
    if (!objectsByMarkId["" + Number(currentYear + 1) + vrstaSj.uid]) {
      const newObject = {
        uid: null,
        godina: Number(currentYear + 1),
        vrstaSjId: vrstaSj.uid,
        phobsCjenik: null,
      };
      objects.push(newObject);
      objectsByMarkId["" + Number(currentYear + 1) + vrstaSj.uid] = newObject;
    }
  });
  search();
}

function displayData() {
  let newhtml = `<thead>
        <tr>
          <th localization-key="Vrsta smještajne jedinice">
            ${
              prijevodi["Vrsta smještajne jedinice"]?.[
                window.sessionStorage.getItem("language")
              ] || "Vrsta smještajne jedinice"
            }
          </th>
          <th localization-key="PHOBS cjenik">${
            prijevodi["PHOBS cjenik"]?.[
                window.sessionStorage.getItem("language")
              ] || "PHOBS cjenik"
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
            <td>${getDisplayValue(vrsteSjByIds[object.vrstaSjId].naziv)}</td>
            <td>
                <div class="input-field noMargins">
                    <input 
                        type="text" 
                        name="phobsCjenikInput${
                          "" + object.godina + object.vrstaSjId
                        }" 
                        id="phobsCjenikInput${
                          "" + object.godina + object.vrstaSjId
                        }" 
                        value="${getDisplayValue(object.phobsCjenik)}" 
                        onInput="showWarning(${
                          "" + object.godina + object.vrstaSjId
                        })"
                    />
                    <span
                        id="warning${"" + object.godina + object.vrstaSjId}"
                        class="helper-text"
                        data-error="Obavezno polje."
                        data-success=""
                        localization-key="Obavezno polje."
                    ></span>
                </div>
            </td>
            <td>
                <button class="btn-floating blue" onClick="saveChange(${
                  "" + object.godina + object.vrstaSjId
                })">
                    <i class="large material-icons">save</i>
                </button>
            </td>
        </tr>`;
  });
  newhtml += "</tbody>";
  $("#objectTable").html(newhtml);
}

function showWarning(markId) {
  $("#warning" + markId).html(
    "Neće se spremiti dok ne pritisnete gumb 'spremi'."
  );
}

function removeWarning(markId) {
  $("#warning" + markId).html("");
}

function saveChange(markId) {
  if (!markId || !objectsByMarkId[markId]) return;
  let object = objectsByMarkId[markId];
  object.phobsCjenik = $("#phobsCjenikInput" + markId).val();
  httpPost("/cms/api/v1/cjenici", object).then((ok) => {
    if (ok) removeWarning(markId);
  });
}

function saveAll() {
  //Za svaki objekt: ako input postoji i value mu je promijenjen => spremi taj objekt
  objects.forEach((object) => {
    if (
      $(`#phobsCjenikInput${"" + object.godina + object.vrstaSjId}`).length &&
      getDisplayValue(object.phobsCjenik) !=
        $(`#phobsCjenikInput${"" + object.godina + object.vrstaSjId}`).val()
    )
      saveChange("" + object.godina + object.vrstaSjId);
    else removeWarning("" + object.godina + object.vrstaSjId);
    //makni warning u slučaju da je korisnik promijenio input na istu vrijednost
  });
}

function search() {
  const filters = $("#search")
    .val()
    .split(" ") //each word is a separate filter
    .map((filter) => filter.trim()) //ignore whitespace at the ends
    .filter((filter) => !!filter) //ignore empty strings
    .map((filter) => filter.toLowerCase()); //ignore case

  filteredObjects = objects.filter((o) => o.godina == selectedYear);
  filters.forEach((filter) => {
    filteredObjects = filteredObjects.filter(
      (object) =>
        vrsteSjById[object.vrstaSjId]?.naziv &&
        String(vrsteSjById[object.vrstaSjId]?.naziv)
          .toLowerCase()
          .includes(filter)
    );
  });
}

function applyFilters() {
  search();
  displayData();
}
