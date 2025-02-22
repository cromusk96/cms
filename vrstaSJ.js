const getTipText = {
  P: "Parcela",
  M: "Mobilna kućica/Glamping",
  A: "Apartman",
};
let objects;
let filteredObjects;
let paidForPopunjavanjeRupa = false;

$(document).ready(async function () {
  showLink();
  await provjeriKamp();
  $("#activeKampName").html(window.sessionStorage.getItem("kampName"));
  $(".modal").modal();
  $("#myNavBar").sidenav();
  $("select").formSelect();
  $("#colorInput").colorpicker({ format: "hex" });
  $("#lineColorInput").colorpicker({ format: "hex" });
  $("#imageDisplayModal").modal({
    onCloseStart: () => {
      $("#editObjectModal").modal("open");
    },
  });
  getData().then(displayData);
}); //MOZDA izbaciti sve što se može u init() funkciju

async function getData() {
  let i = 0;
  let promises = [];
  promises.push(
    httpGet("/cms/api/v1/vrstaSJ").then(async (results) => {
      objects = results;
      objects.forEach((o) => (o.phobsCjenik = null));
      search();
      await httpGet("/cms/api/v1/cjenici").then((results) => {
        results
          .filter((r) => r.godina == new Date().getFullYear())
          .forEach((cjenik) => {
            objects[getIndexByUid(cjenik.vrstaSjId, objects)].phobsCjenik = cjenik.phobsCjenik;
          });
      });
    })
  );
  promises.push(
    httpGet("/cms/api/v1/isPaid/popunjavanje_rupa").then((results) => {
      paidForPopunjavanjeRupa = results.popunjavanje_rupa;
      if (!paidForPopunjavanjeRupa) {
        $("#minRupaInput").prop("disabled", true);
        $("#maxRupaInput").prop("disabled", true);
      }
    })
  );
  await Promise.all(promises);
}

function displayData() {
  let newhtml = `<thead>
        <tr>
            <th localization-key="Oznaka">${
              prijevodi["Oznaka"]?.[window.sessionStorage.getItem("language")] || "Oznaka"
            }</th>
            <th localization-key="Tip">${prijevodi["Tip"]?.[window.sessionStorage.getItem("language")] || "Tip"}</th>
            <th localization-key="Naziv">${
              prijevodi["Naziv"]?.[window.sessionStorage.getItem("language")] || "Naziv"
            }</th>
            <th class="hide-on-small-only" localization-key="Oznaka PMS">${
              prijevodi["Oznaka PMS"]?.[window.sessionStorage.getItem("language")] || "Oznaka PMS"
            }</th>
            <th class="hide-on-small-only" localization-key="Oznaka PHOBS">${
              prijevodi["Oznaka PHOBS"]?.[window.sessionStorage.getItem("language")] || "Oznaka PHOBS"
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
    displayList = filteredObjects.slice((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage);
  } else {
    displayList = filteredObjects;
  }
  displayList.forEach((object) => {
    newhtml += `<tr>
            <td>${getDisplayValue(object.oznaka)}</td>
            <td>${getDisplayValue(
              prijevodi[getTipText[object.tip]]?.[window.sessionStorage.getItem("language")] || getTipText[object.tip]
            )}</td>
            <td>${getDisplayValue(object.naziv)}</td>
            <td class="hide-on-small-only">${getDisplayValue(object.oznakaMish)}</td>
            <td class="hide-on-small-only">${getDisplayValue(object.oznakaPhobs)}</td>
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
  const object = filteredObjects[index];
  $("#oznakaInput").val(object.oznaka);

  //MOZDA izbaciti tip van u svoju tablicu i povezati ga s periodima - Denis je reko kasnije
  $("#tipInput").val(object.tip);
  $("#tipInput").formSelect();

  $("#nazivInput").val(object.naziv);
  $("#oznakaMishInput").val(object.oznakaMish);
  $("#oznakaPhobsInput").val(object.oznakaPhobs);

  $("#brojOsobaInput").val(object.brojOsoba);
  $("#brojDjeceInput").val(object.brojDjece);

  $("#colorInput").colorpicker("setValue", object.color);
  $("#lineColorInput").colorpicker("setValue", object.lineColor);

  $("#minRupaInput").val(object.minRupa);
  $("#maxRupaInput").val(object.maxRupa);

  $("#slikaInput").val(object.slika);
  $("#virtualTourInput").val(object.virtualTour);
  $("#slika1Input").val(object.slika1);
  $("#slika2Input").val(object.slika2);
  $("#slika3Input").val(object.slika3);
  $("#slika4Input").val(object.slika4);
  $("#slika5Input").val(object.slika5);
  $("#slika6Input").val(object.slika6);
  $("#slika7Input").val(object.slika7);
  $("#slika8Input").val(object.slika8);

  $("#nofilterCheckbox").prop("checked", object.nofilter);
  $("#bookTocnogBrojaCheckbox").prop("checked", object.bookTocnogBroja);
  $("#prikaziSveDostupnoCheckbox").prop("checked", object.prikaziSveDostupno);
  $("#pitajBrojTipCheckbox").prop("checked", object.pitajBrojTip);
  $("#nePrikazujBrojCheckbox").prop("checked", object.nePrikazujBroj);

  $("#pmsIdInput").val(object.pmsId);
  $("#phobsIdInput").val(object.phobsId);
  $("#phobsCjenikInput").val(object.phobsCjenik);

  $("#porukaZaBookingInput").val(object.porukaZaBooking);
  M.textareaAutoResize($("#porukaZaBookingInput"));

  $("#distanceToSeaCheckbox").prop("checked", object.distanceToSea);
  $("#distanceToShopCheckbox").prop("checked", object.distanceToShop);
  $("#distanceToWcCheckbox").prop("checked", object.distanceToWc);
  $("#distanceToRestaurantCheckbox").prop("checked", object.distanceToRestaurant);

  $("#saveButton").attr("onclick", `saveButton(${index})`);
  $("#editObjectModal").modal("open");
}

function addNew() {
  clearValidities();

  $("#oznakaInput").val("");

  $("#tipInput").val("");
  $("#tipInput").formSelect();

  $("#nazivInput").val("");
  $("#oznakaMishInput").val("");
  $("#oznakaPhobsInput").val("");

  $("#brojOsobaInput").val("");
  $("#brojDjeceInput").val("");

  $("#colorInput").val("");
  $("#lineColorInput").val("");

  $("#minRupaInput").val("");
  $("#maxRupaInput").val("");

  $("#slikaInput").val("");
  $("#virtualTourInput").val("");
  $("#slika1Input").val("");
  $("#slika2Input").val("");
  $("#slika3Input").val("");
  $("#slika4Input").val("");
  $("#slika5Input").val("");
  $("#slika6Input").val("");
  $("#slika7Input").val("");
  $("#slika8Input").val("");

  $("#nofilterCheckbox").prop("checked", false);
  $("#bookTocnogBrojaCheckbox").prop("checked", true);
  $("#prikaziSveDostupnoCheckbox").prop("checked", false);
  $("#pitajBrojTipCheckbox").prop("checked", false);
  $("#nePrikazujBrojCheckbox").prop("checked", false);

  $("#pmsIdInput").val("");
  $("#phobsIdInput").val("");
  $("#phobsCjenikInput").val("");

  $("#porukaZaBookingInput").val("");
  M.textareaAutoResize($("#porukaZaBookingInput"));

  $("#distanceToSeaCheckbox").prop("checked", true);
  $("#distanceToShopCheckbox").prop("checked", false);
  $("#distanceToWcCheckbox").prop("checked", false);
  $("#distanceToRestaurantCheckbox").prop("checked", false);

  $("#saveButton").attr("onclick", `saveButton(null)`);
  $("#editObjectModal").modal("open");
}

function confirmDelete(uid) {
  const index = getIndexByUid(uid, filteredObjects);
  $("#confirmDeleteButton").attr("onClick", `deleteInDB(${index})`);
  $("#confirmDelete").modal("open");
}

function deleteInDB(index) {
  httpDelete("/cms/api/v1/vrstaSJ/" + filteredObjects[index].uid)
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

  object.oznaka = $("#oznakaInput").val();
  object.tip = $("#tipInput").val();
  object.naziv = $("#nazivInput").val();
  object.oznakaMish = $("#oznakaMishInput").val();
  object.oznakaPhobs = $("#oznakaPhobsInput").val();

  object.brojOsoba = $("#brojOsobaInput").val();
  object.brojDjece = $("#brojDjeceInput").val();

  object.color = $("#colorInput").val();
  object.lineColor = $("#lineColorInput").val();

  object.minRupa = $("#minRupaInput").val();
  object.maxRupa = $("#maxRupaInput").val();

  object.slika = $("#slikaInput").val();
  object.virtualTour = $("#virtualTourInput").val();
  object.slika1 = $("#slika1Input").val();
  object.slika2 = $("#slika2Input").val();
  object.slika3 = $("#slika3Input").val();
  object.slika4 = $("#slika4Input").val();
  object.slika5 = $("#slika5Input").val();
  object.slika6 = $("#slika6Input").val();
  object.slika7 = $("#slika7Input").val();
  object.slika8 = $("#slika8Input").val();

  object.nofilter = $("#nofilterCheckbox").is(":checked");
  object.bookTocnogBroja = $("#bookTocnogBrojaCheckbox").is(":checked");
  object.prikaziSveDostupno = $("#prikaziSveDostupnoCheckbox").is(":checked");
  object.pitajBrojTip = $("#pitajBrojTipCheckbox").is(":checked");
  object.nePrikazujBroj = $("#nePrikazujBrojCheckbox").is(":checked");

  object.pmsId = $("#pmsIdInput").val();
  object.phobsId = $("#phobsIdInput").val();
  object.phobsCjenik = $("#phobsCjenikInput").val();

  object.porukaZaBooking = $("#porukaZaBookingInput").val();

  object.distanceToSea = $("#distanceToSeaCheckbox").is(":checked");
  object.distanceToShop = $("#distanceToShopCheckbox").is(":checked");
  object.distanceToWc = $("#distanceToWcCheckbox").is(":checked");
  object.distanceToRestaurant = $("#distanceToRestaurantCheckbox").is(":checked");

  httpPost("/cms/api/v1/vrstaSJ", object).then(getData).then(displayData);
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
      (object) =>
        (object.oznaka && String(object.oznaka).toLowerCase().includes(filter)) ||
        (object.naziv && String(object.naziv).toLowerCase().includes(filter))
    );
  });
}

function validateInput(uid) {
  clearValidities();
  result = true;
  //tip mora biti odabran
  if (!getTipText[$("#tipInput").val()]) {
    result = false;
    setValidity($("#tipInput").parent(), false);
  } else setValidity($("#tipInput").parent(), true);
  //oznaka mora biti jedinstvena
  if (checkForExistance($("#oznakaInput").val(), objects, "oznaka", uid)) {
    result = false;
    setValidity($("#oznakaInput"), false);
  } else setValidity($("#oznakaInput"), true);
  //naziv mora biti upisan
  if (!$("#nazivInput").val()) {
    result = false;
    setValidity($("#nazivInput"), false);
  } else setValidity($("#nazivInput"), true);
  //oznakaMISH mora biti jedinstvena
  if (checkForExistance($("#oznakaMishInput").val(), objects, "oznakaMish", uid)) {
    result = false;
    setValidity($("#oznakaMishInput"), false);
  } else setValidity($("#oznakaMishInput"), true);
  //oznakaPHOBS mora biti odabrana
  if (!$("#oznakaPhobsInput").val()) {
    result = false;
    setValidity($("#oznakaPhobsInput"), false);
  } else setValidity($("#oznakaPhobsInput"), true);
  return result;
}

function applyFilters() {
  search();
  displayData();
}
