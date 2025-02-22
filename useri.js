let objects;
let filteredObjects;
let kampovi;
let priviledges;
let ownedObjects;
let objekti;
let vrsteObjekata;

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
    httpGet("/cms/api/v1/users").then((results) => {
      objects = results;
      search();
    })
  );
  promises.push(
    httpGet("/cms/api/v1/kampovi").then((results) => {
      kampovi = results;
      displayKampovi();
    })
  );
  promises.push(
    httpGet("/cms/api/v1/sviObjekti").then((results) => {
      objekti = results;
    })
  );
  promises.push(
    httpGet("/cms/api/v1/vrsteObjekata").then((results) => {
      vrsteObjekata = {};
      results.forEach((vrstaObjekta) => {
        vrsteObjekata[vrstaObjekta.uid] = vrstaObjekta;
      });
    })
  );
  promises.push(
    httpGet("/cms/api/v1/objektVlasnik").then((results) => {
      ownedObjects = {};
      results.forEach((r) => {
        if (!ownedObjects[r.vlasnikId]?.length)
          ownedObjects[r.vlasnikId] = [r.objektId];
        else ownedObjects[r.vlasnikId].push(r.objektId);
      });
    })
  );
  await Promise.all(promises);
  await httpGet("/cms/api/v1/priviledges").then((results) => {
    objects.forEach((o) => {
      o.kampovi = {};
      results.forEach((r) => {
        if (o.uid == r.userId) o.kampovi[r.kampId] = true;
      });
    });
  });
}

function displayData() {
  let newhtml = `<thead>
          <tr>
            <th localization-key="Username">${
              prijevodi["Username"]?.[
                window.sessionStorage.getItem("language")
              ] || "Username"
            }</th>
            <th localization-key="Admin">${
              prijevodi["Admin"]?.[window.sessionStorage.getItem("language")] ||
              "Admin"
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
              <td>${getDisplayValue(object.username)}</td>
              <td>${daIliNe(object.isAdmin)}</td>
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

function displayKampovi() {
  let newhtml = "";
  for (let i = 0; i < kampovi.length; i++) {
    newhtml += `
    <div class="col s12 m6 l4">
      <p>
        <label>
          <input type="checkbox" 
            class="filled-in kampCheckbox" 
            id="kamp${kampovi[i].uid}Checkbox" 
            onchange="isVlasnikObjektaChange()" />
          <span>${kampovi[i].naziv}</span>
        </label>
      </p>
    </div>`;
  }
  newhtml += `
  <div class="col m${12 - (kampovi.length % 2) * 6} l${
    12 - (kampovi.length % 3) * 4
  } 
    hide-on-small-only show-on-medium-and-up">
    <!--filler div to make everything stay in place-->
  </div>`;
  $("#kampoviDiv").html(newhtml);
}

function displayObjekti(ownerId) {
  //save old checks
  const objektiCheckboxes = $(".objektCheckbox");
  const checkedObjekti = [];
  for (let i = 0; i < objektiCheckboxes.length; i++) {
    const id = objektiCheckboxes[i].id;
    if ($("#" + id).is(":checked")) checkedObjekti.push(id);
  }
  //build new checkboxes
  const checkedKampovi = kampovi.filter((k) =>
    $("#kamp" + k.uid + "Checkbox").is(":checked")
  );
  const displayObjekti = objekti
    .filter((o) => o.vrstaObjektaUid != 1 && o.vrstaObjektaUid != 12)
    .filter((o) => {
      for (let i = 0; i < checkedKampovi.length; i++)
        if (checkedKampovi[i].uid == o.kampId) return true;
      return false;
    });
  let newhtml = "";
  for (let i = 0; i < displayObjekti.length; i++) {
    newhtml += `
    <div class="col s12 m6 l4">
      <p>
        <label>
          <input type="checkbox" class="filled-in objektCheckbox" id="objekt${
            displayObjekti[i].uid
          }Checkbox" />
          <span localization-key="${
            vrsteObjekata[displayObjekti[i].vrstaObjektaUid].naziv
          }">${
      prijevodi[vrsteObjekata[displayObjekti[i].vrstaObjektaUid].naziv]?.[
        window.sessionStorage.getItem("language")
      ] || vrsteObjekata[displayObjekti[i].vrstaObjektaUid].naziv
    } - ${displayObjekti[i].naziv}</span>
        </label>
      </p>
    </div>`;
  }
  newhtml += `
  <div class="col m${12 - (displayObjekti.length % 2) * 6} l${
    12 - (displayObjekti.length % 3) * 4
  } 
    hide-on-small-only show-on-medium-and-up">
    <!--filler div to make everything stay in place-->
  </div>`;
  $("#objektiDiv").html(newhtml);
  $(".objektiHidden").removeClass("hide");
  //check what needs to be checked
  checkObjekti(ownerId, checkedObjekti);
}

function checkObjekti(ownerId, checkedObjekti) {
  $(".objektCheckbox").prop("checked", false);
  if (ownerId && ownedObjects[ownerId]?.length)
    ownedObjects[ownerId].forEach((objektId) =>
      $("#objekt" + objektId + "Checkbox").prop("checked", true)
    );
  if (checkedObjekti?.length)
    checkedObjekti.forEach((id) => $("#" + id).prop("checked", true));
}

function openModal(uid) {
  clearValidities();
  const index = getIndexByUid(uid, filteredObjects);
  const object = filteredObjects[index];

  $("#usernameInput").val(object.username);

  $("#passwordInput").val("");
  $("#nepromijenjenoCheckbox").prop("checked", true);
  nepromijenjenoChange();
  $("#nepromijenjenoCheckbox").prop("disabled", false);

  $("#isAdminCheckbox").prop("checked", !!object.isAdmin);
  if (isLastAdmin(uid)) $("#isAdminCheckbox").prop("disabled", true);
  else $("#isAdminCheckbox").prop("disabled", false);

  $(".kampCheckbox").prop("checked", !!object.isAdmin);
  if (object.isAdmin) $(".kampCheckbox").prop("disabled", true);
  else {
    Object.keys(object.kampovi).forEach((k) => {
      $("#kamp" + k + "Checkbox").prop("checked", object.kampovi[k]);
    });
    $(".kampCheckbox").prop("disabled", false);
  }

  $("#isVlasnikObjektaCheckbox").prop("checked", !!object.isVlasnikObjekta);
  $("#objektiDiv").html("");
  $(".objektiHidden").addClass("hide");
  if (object.isVlasnikObjekta) displayObjekti(object.uid);

  $("#isRecepcionerCheckbox").prop("checked", !!object.isRecepcioner);
  $("#isCallcentarCheckbox").prop("checked", !!object.isCallcentar);

  $("#saveButton").attr("onclick", `saveButton(${index})`);
  $("#editObjectModal").modal("open");
}

function addNew() {
  clearValidities();

  $("#usernameInput").val("");

  $("#passwordInput").val("");
  $("#nepromijenjenoCheckbox").prop("checked", false);
  nepromijenjenoChange();
  $("#nepromijenjenoCheckbox").prop("disabled", true);

  $("#isAdminCheckbox").prop("checked", false);
  $("#isAdminCheckbox").prop("disabled", false);

  $(".kampCheckbox").prop("checked", false);
  $(".kampCheckbox").prop("disabled", false);

  $("#isVlasnikObjektaCheckbox").prop("checked", false);
  $("#objektiDiv").html("");
  $(".objektiHidden").addClass("hide");

  $("#isRecepcionerCheckbox").prop("checked", false);
  $("#isCallcentarCheckbox").prop("checked", false);

  $("#saveButton").attr("onclick", `saveButton(null)`);
  $("#editObjectModal").modal("open");
}

function confirmDelete(uid) {
  if (isLastUser()) {
    M.toast({
      html:
        prijevodi["Ne može se obrisati jedinog user-a"]?.[
          window.sessionStorage.getItem("language")
        ] || "Ne može se obrisati jedinog user-a",
      classes: "rounded",
    });
    return;
  }
  const index = getIndexByUid(uid, filteredObjects);
  $("#confirmDeleteButton").attr("onClick", `deleteInDB(${index})`);
  $("#confirmDelete").modal("open");
}

function deleteInDB(index) {
  httpDelete("/cms/api/v1/user/" + filteredObjects[index].uid)
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

  object.username = $("#usernameInput").val();

  if (!$("#nepromijenjenoCheckbox").is(":checked"))
    object.password = $("#passwordInput").val();
  else object.password = null;

  object.isAdmin = $("#isAdminCheckbox").is(":checked");
  object.isVlasnikObjekta = $("#isVlasnikObjektaCheckbox").is(":checked");

  object.isRecepcioner = $("#isRecepcionerCheckbox").is(":checked");
  object.isCallcentar = $("#isCallcentarCheckbox").is(":checked");

  object.kampovi = {};
  if (!object.isAdmin)
    kampovi.forEach((k) => {
      if ($("#kamp" + k.uid + "Checkbox").is(":checked"))
        object.kampovi[k.uid] = true;
    });

  const objektiCheckboxes = $(".objektCheckbox");
  if (object.isVlasnikObjekta) {
    object.objekti = [];
    for (let i = 0; i < objektiCheckboxes.length; i++) {
      const id = objektiCheckboxes[i].id.slice(6, -8);
      if ($("#objekt" + id + "Checkbox").is(":checked"))
        object.objekti.push({ uid: id });
    }
  }

  httpPost("/cms/api/v1/users", object).then(getData).then(displayData);
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
        object.username &&
        String(object.username).toLowerCase().includes(filter)
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
  //username je obavezno polje i mora biti jedinstven
  if (checkForExistance($("#usernameInput").val(), objects, "username", uid)) {
    result = false;
    setValidity($("#usernameInput"), false);
  } else setValidity($("#usernameInput"), true);
  //password je obavezan ako nije nepromijenjen
  if (
    !$("#nepromijenjenoCheckbox").is(":checked") &&
    !$("#passwordInput").val()
  ) {
    result = false;
    setValidity($("#passwordInput"), false);
  } else setValidity($("#passwordInput"), true);

  return result;
}

function nepromijenjenoChange() {
  if ($("#nepromijenjenoCheckbox").is(":checked")) {
    $("#passwordInput").prop("disabled", true);
  } else {
    $("#passwordInput").prop("disabled", false);
  }
}

function isAdminChange() {
  if ($("#isAdminCheckbox").is(":checked")) {
    $(".kampCheckbox").prop("checked", true);
    $(".kampCheckbox").prop("disabled", true);
  } else {
    $(".kampCheckbox").prop("disabled", false);
  }
  isVlasnikObjektaChange();
}

function isLastAdmin(uid) {
  const admins = objects.filter((o) => o.isAdmin);
  if (admins.length < 2 && uid == admins[0].uid) return true;
  return false;
}

function isLastUser() {
  return objects.length < 2;
}

function isVlasnikObjektaChange() {
  if ($("#isVlasnikObjektaCheckbox").is(":checked")) displayObjekti(null);
  else {
    $("#objektiDiv").html("");
    $(".objektiHidden").addClass("hide");
  }
}
