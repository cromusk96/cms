let objects;
let filteredObjects;

$(document).ready(async function () {
  showLink();
  await provjeriKamp();
  $("#activeKampName").html(window.sessionStorage.getItem("kampName"));
  $(".modal").modal();
  $("#myNavBar").sidenav();
  $(".tabs").tabs();
  getData().then(displayData);
});

async function getData() {
  let i = 0;
  let promises = [];
  promises.push(
    httpGet("/cms/api/v1/translations").then((results) => {
      objects = results;
      search();
    })
  );
  await Promise.all(promises);
}

function displayData() {
  let newhtml = `<thead>
        <tr>
            <th>text_string</th>
            <th>hr</th>
            <th class="hide-on-small-only">hr_m</th>
            <th>en</th>
            <th class="hide-on-small-only">en_m</th>
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
            <td>${getDisplayValue(object.text_string)}</td>
            <td>${getDisplayValue(object.hr)}</td>
            <td class="hide-on-small-only">${getDisplayValue(object.hr_m)}</td>
            <td>${getDisplayValue(object.en)}</td>
            <td class="hide-on-small-only">${getDisplayValue(object.en_m)}</td>
            <td>
                <button class="btn-floating blue" onClick="openModal('${object.text_string}')">
                    <i class="large material-icons">edit</i>
                </button>
                <button class="btn-floating red" onClick="confirmDelete('${object.text_string}')">
                    <i class="large material-icons">delete</i>
                </button>
            </td>
        </tr>`;
  });
  newhtml += "</tbody>";
  $("#objectTable").html(newhtml);
}

function openModal(text_string) {
  clearValidities();
  const index = getIndexByTextString(text_string, filteredObjects);
  const object = filteredObjects[index];

  $("#text_stringInput").val(object.text_string);

  $("#hrInput").val(object.hr);
  M.textareaAutoResize($("#hrInput"));
  $("#enInput").val(object.en);
  M.textareaAutoResize($("#enInput"));
  $("#deInput").val(object.de);
  M.textareaAutoResize($("#deInput"));
  $("#itInput").val(object.it);
  M.textareaAutoResize($("#itInput"));
  $("#nlInput").val(object.nl);
  M.textareaAutoResize($("#nlInput"));
  $("#ruInput").val(object.ru);
  M.textareaAutoResize($("#ruInput"));
  $("#siInput").val(object.si);
  M.textareaAutoResize($("#siInput"));
  $("#plInput").val(object.pl);
  M.textareaAutoResize($("#plInput"));

  $("#hr_mInput").val(object.hr_m);
  M.textareaAutoResize($("#hr_mInput"));
  $("#en_mInput").val(object.en_m);
  M.textareaAutoResize($("#en_mInput"));
  $("#de_mInput").val(object.de_m);
  M.textareaAutoResize($("#de_mInput"));
  $("#it_mInput").val(object.it_m);
  M.textareaAutoResize($("#it_mInput"));
  $("#nl_mInput").val(object.nl_m);
  M.textareaAutoResize($("#nl_mInput"));
  $("#ru_mInput").val(object.ru_m);
  M.textareaAutoResize($("#ru_mInput"));
  $("#si_mInput").val(object.si_m);
  M.textareaAutoResize($("#si_mInput"));
  $("#pl_mInput").val(object.pl_m);
  M.textareaAutoResize($("#pl_mInput"));

  $("#saveButton").attr("onclick", `saveButton(${index})`);
  $("#editObjectModal").modal("open");
}

function addNew() {
  clearValidities();

  $("#text_stringInput").val("");

  $("#hrInput").val("");
  M.textareaAutoResize($("#hrInput"));
  $("#enInput").val("");
  M.textareaAutoResize($("#enInput"));
  $("#deInput").val("");
  M.textareaAutoResize($("#deInput"));
  $("#itInput").val("");
  M.textareaAutoResize($("#itInput"));
  $("#nlInput").val("");
  M.textareaAutoResize($("#nlInput"));
  $("#ruInput").val("");
  M.textareaAutoResize($("#ruInput"));
  $("#siInput").val("");
  M.textareaAutoResize($("#siInput"));
  $("#plInput").val("");
  M.textareaAutoResize($("#plInput"));

  $("#hr_mInput").val("");
  M.textareaAutoResize($("#hr_mInput"));
  $("#en_mInput").val("");
  M.textareaAutoResize($("#en_mInput"));
  $("#de_mInput").val("");
  M.textareaAutoResize($("#de_mInput"));
  $("#it_mInput").val("");
  M.textareaAutoResize($("#it_mInput"));
  $("#nl_mInput").val("");
  M.textareaAutoResize($("#nl_mInput"));
  $("#ru_mInput").val("");
  M.textareaAutoResize($("#ru_mInput"));
  $("#si_mInput").val("");
  M.textareaAutoResize($("#si_mInput"));
  $("#pl_mInput").val("");
  M.textareaAutoResize($("#pl_mInput"));

  $("#saveButton").attr("onclick", `saveButton(null)`);
  $("#editObjectModal").modal("open");
}

function confirmDelete(uid) {
  const index = getIndexByUid(uid, filteredObjects);
  $("#confirmDeleteButton").attr("onClick", `deleteInDB(${index})`);
  $("#confirmDelete").modal("open");
}

function deleteInDB(index) {
  httpDelete("/cms/api/v1/translation/" + filteredObjects[index].uid)
    .then(getData)
    .then(displayData);
}

function saveButton(index) {
  let object;
  if (index || index === 0) object = Object.assign({}, filteredObjects[index]);
  else object = { kampId: window.sessionStorage.getItem("kampId") };
  if (!validateInput(object.text_string)) {
    M.toast({
      html:
        prijevodi["Nemože se spremiti jer podaci nisu dobro uneseni"]?.[window.sessionStorage.getItem("language")] ||
        "Nemože se spremiti jer podaci nisu dobro uneseni",
      classes: "rounded",
    });
    return;
  }

  object.text_string = $("#text_stringInput").val();

  object.hr = $("#hrInput").val();
  object.en = $("#enInput").val();
  object.de = $("#deInput").val();
  object.it = $("#itInput").val();
  object.nl = $("#nlInput").val();
  object.ru = $("#ruInput").val();
  object.si = $("#siInput").val();
  object.pl = $("#plInput").val();

  object.hr_m = $("#hr_mInput").val();
  object.en_m = $("#en_mInput").val();
  object.de_m = $("#de_mInput").val();
  object.it_m = $("#it_mInput").val();
  object.nl_m = $("#nl_mInput").val();
  object.ru_m = $("#ru_mInput").val();
  object.si_m = $("#si_mInput").val();
  object.pl_m = $("#pl_mInput").val();

  httpPost("/cms/api/v1/translations", object).then(getData).then(displayData);
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
        (object.text_string && String(object.text_string).toLowerCase().includes(filter)) ||
        (object.hr && String(object.hr).toLowerCase().includes(filter)) ||
        (object.en && String(object.en).toLowerCase().includes(filter)) ||
        (object.it && String(object.it).toLowerCase().includes(filter)) ||
        (object.de && String(object.de).toLowerCase().includes(filter)) ||
        (object.nl && String(object.nl).toLowerCase().includes(filter)) ||
        (object.ru && String(object.ru).toLowerCase().includes(filter)) ||
        (object.si && String(object.si).toLowerCase().includes(filter)) ||
        (object.pl && String(object.pl).toLowerCase().includes(filter)) ||
        (object.hr_m && String(object.hr_m).toLowerCase().includes(filter)) ||
        (object.en_m && String(object.en_m).toLowerCase().includes(filter)) ||
        (object.it_m && String(object.it_m).toLowerCase().includes(filter)) ||
        (object.de_m && String(object.de_m).toLowerCase().includes(filter)) ||
        (object.nl_m && String(object.nl_m).toLowerCase().includes(filter)) ||
        (object.ru_m && String(object.ru_m).toLowerCase().includes(filter)) ||
        (object.si_m && String(object.si_m).toLowerCase().includes(filter)) ||
        (object.pl_m && String(object.pl_m).toLowerCase().includes(filter))
    );
  });
}

function applyFilters() {
  search();
  displayData();
}

function validateInput(text_string) {
  clearValidities();
  result = true;
  //text_string je obavezno polje i mora biti jedinstven
  if (checkForExistanceByText_string($("#text_stringInput").val(), objects, text_string)) {
    result = false;
    setValidity($("#text_stringInput"), false);
  } else setValidity($("#text_stringInput"), true);

  return result;
}

function getIndexByTextString(text_string, array) {
  for (let i = 0; i < array.length; i++) if (array[i].text_string == text_string) return i;
}

function checkForExistanceByText_string(value, array, text_string) {
  for (const object of array) {
    if (object.text_string == value && object.text_string != text_string) return true;
  }
  return false;
}
