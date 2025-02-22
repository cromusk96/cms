const getTipText = { P: "Parcela", M: "Mobilna kućica/Glamping" };
let kampData;
let periodi;
let paidForPopunjavanjeRupa = false;

$(document).ready(async function () {
  showLink();
  $("#activeKampName").html(window.sessionStorage.getItem("kampName"));
  $(".modal").modal();
  $(".datepicker").datepicker({
    autoClose: true,
    firstDay: 1,
    format: "yyyy-mm-dd",
  });
  $("#myNavBar").sidenav();
  $("select").formSelect();
  getData().then(displayData);
});

async function getData() {
  if (!window.sessionStorage.getItem("kampId")) {
    //dodajemo novi kamp
    kampData = { imaParcele: true, imaMh: true, navigacija: true };
    periodi = [];
    $(".disableOnNewKamp").addClass("disabled");
    return;
  }
  let promises = [];
  promises.push(
    httpGet("/cms/api/v1/kamp").then((results) => {
      kampData = results;
    })
  );
  promises.push(
    httpGet("/cms/api/v1/periodi").then((results) => {
      periodi = results;
    })
  );
  promises.push(
    httpGet("/cms/api/v1/isPaid/popunjavanje_rupa").then((results) => {
      paidForPopunjavanjeRupa = results.popunjavanje_rupa;
      if (!paidForPopunjavanjeRupa) {
        $("#popunjavanjeRupaCheckbox").prop("disabled", true);
      }
    })
  );
  await Promise.all(promises);
}

function displayData() {
  clearValidities();
  $("#jeziciLabel").html(
    `<h6 localization-key="Višejezičnost:">${
      prijevodi["Višejezičnost:"]?.[window.sessionStorage.getItem("language")] || "Višejezičnost:"
    }</h6>`
  );

  $("#nazivInput").val(kampData.naziv);
  $("#dodatniNazivInput").val(kampData.dodatniNaziv);

  $("#slika1Input").val(kampData.logo);
  $("#slika2Input").val(kampData.defaultSlika);

  $("#mailInput").val(kampData.mail);
  $("#telefonInput").val(kampData.telefon);
  $("#wwwInput").val(kampData.www);

  $("#adresaInput").val(kampData.adresa);
  $("#mjestoInput").val(kampData.mjesto);
  $("#drzavaInput").val(kampData.drzava);

  $("#latitudeInput").val(kampData.latitude);
  $("#longitudeInput").val(kampData.longitude);

  $("#minDanRezInput").val(kampData.minDanRez);
  $("#minDanRezMobilkeInput").val(kampData.minDanRezMobilke);
  $("#cuvanjeRezMinutaInput").val(kampData.cuvanjeRezMinuta);

  $("#brojOsobaInput").val(kampData.brojOsoba);
  $("#brojDjeceInput").val(kampData.brojDjece);
  $("#brojOsobaMhInput").val(kampData.brojOsobaMh);
  $("#brojDjeceMhInput").val(kampData.brojDjeceMh);

  $("#phobsIdParceleInput").val(kampData.phobsIdParcele);
  $("#phobsIdMobilkeInput").val(kampData.phobsIdMobilke);

  $("#otvorenOdInput").val(kampData.otvorenOd);
  $("#otvorenDoInput").val(kampData.otvorenDo);

  $("#rezParcelaStartDateInput").val(kampData.rezParcelaStartDate);
  $("#rezMobilkaStartDateInput").val(kampData.rezMobilkaStartDate);

  $("#propertyidInput").val(kampData.propertyid);
  $("#phobs_usernameInput").val(kampData.phobs_username);
  $("#phobs_passwordInput").val(kampData.phobs_password);
  $("#phobs_siteidInput").val(kampData.phobs_siteid);
  $("#pmsApiKeyInput").val(kampData.pmsApiKey);
  $("#pmsTokenInput").val(kampData.pmsToken);
  $("#defaultRateIdInput").val(kampData.defaultRateId);
  $("#rateIdParceleInput").val(kampData.rateIdParcele);
  $("#mapboxTokenInput").val(kampData.mapboxToken);
  $("#geojsonFileInput").val(kampData.geojsonFile);

  $("#bookingModulCheckbox").prop("checked", !!kampData.bookingModul);
  $("#zatvoriBookingCheckbox").prop("checked", !!kampData.zatvoriBooking);
  $("#panomiframeCheckbox").prop("checked", !!kampData.panomiframe);
  $("#sortFilterRbCheckbox").prop("checked", !!kampData.sortFilterRb);
  $("#upitVidljivoCheckbox").prop("checked", !!kampData.upitVidljivo);
  $("#nazivHeaderCheckbox").prop("checked", !!kampData.nazivHeader);
  $("#maintenanceModeCheckbox").prop("checked", !!kampData.maintenanceMode);
  $("#imaParceleCheckbox").prop("checked", !!kampData.imaParcele);
  $("#imaMhCheckbox").prop("checked", !!kampData.imaMh);
  $("#navigacijaCheckbox").prop("checked", !!kampData.navigacija);
  $("#showDistancesCheckbox").prop("checked", !!kampData.showDistances);
  $("#paymentGatewayCheckbox").prop("checked", !!kampData.paymentGateway);
  $("#filterAsButtonCheckbox").prop("checked", !!kampData.filterAsButton);
  $("#loyaltyCheckbox").prop("checked", !!kampData.loyalty);
  $("#popunjavanjeRupaCheckbox").prop("checked", !!(paidForPopunjavanjeRupa && kampData.popunjavanjeRupa));

  $("#hrCheckbox").prop("checked", !!kampData.hr);
  $("#enCheckbox").prop("checked", !!kampData.en);
  $("#deCheckbox").prop("checked", !!kampData.de);
  $("#itCheckbox").prop("checked", !!kampData.it);
  $("#nlCheckbox").prop("checked", !!kampData.nl);
  $("#ruCheckbox").prop("checked", !!kampData.ru);
  $("#siCheckbox").prop("checked", !!kampData.si);
  $("#plCheckbox").prop("checked", !!kampData.pl);

  displayPeriodi();
}

function displayPeriodi() {
  let newHtml = `<div class="row valign-wrapper flexWrap">
  <div class="col s12"><h5 localization-key="Razdoblja dozvoljenih rezervacija:">${
    prijevodi["Razdoblja dozvoljenih rezervacija:"]?.[window.sessionStorage.getItem("language")] ||
    "Razdoblja dozvoljenih rezervacija:"
  }</h5></div>`;
  for (let i = 0; i < periodi.length; i++) {
    if (!periodi[i].deleted) newHtml += makePeriodHtml(i);
  }
  newHtml += `</div><div class="divider"></div>`;
  $("#periodiDiv").html(newHtml);
}

function deletePeriod(index) {
  $("#confirmDeletePeriodButton").attr("onClick", `deletePeriodInDb(${index})`);
  $("#confirmDeletePeriod").modal("open");
}

async function deletePeriodInDb(index) {
  if (periodi[index].uid) {
    if (await httpDelete("/cms/api/v1/period/" + periodi[index].uid)) periodi[index].deleted = true;
  } else {
    periodi[index].deleted = true;
    M.toast({
      html: prijevodi["Uspješno brisanje"]?.[window.sessionStorage.getItem("language")] || "Uspješno brisanje",
      classes: "rounded",
    });
  }

  getData().then(displayPeriodi);
}

function editPeriod(index) {
  clearValidities();
  $("#jeziciLabel").html(
    `<h6 localization-key="Višejezičnost:">${
      prijevodi["Višejezičnost:"]?.[window.sessionStorage.getItem("language")] || "Višejezičnost:"
    }</h6>`
  );

  $("#tipInput").val(periodi[index].tip);
  $("#tipInput").formSelect();

  $("#aktivanCheckbox").prop("checked", !!periodi[index].aktivan);
  $("#minDanRezPeriodiInput").val(periodi[index].minDanRez);

  $("#datumOdInput").val(getDisplayValue(periodi[index].datumOd));
  $("#datumDoInput").val(getDisplayValue(periodi[index].datumDo));

  $("#ponDolazakCheckbox").prop("checked", !!periodi[index].ponDolazak);
  $("#utoDolazakCheckbox").prop("checked", !!periodi[index].utoDolazak);
  $("#sriDolazakCheckbox").prop("checked", !!periodi[index].sriDolazak);
  $("#cetDolazakCheckbox").prop("checked", !!periodi[index].cetDolazak);
  $("#petDolazakCheckbox").prop("checked", !!periodi[index].petDolazak);
  $("#subDolazakCheckbox").prop("checked", !!periodi[index].subDolazak);
  $("#nedDolazakCheckbox").prop("checked", !!periodi[index].nedDolazak);

  $("#ponOdlazakCheckbox").prop("checked", !!periodi[index].ponOdlazak);
  $("#utoOdlazakCheckbox").prop("checked", !!periodi[index].utoOdlazak);
  $("#sriOdlazakCheckbox").prop("checked", !!periodi[index].sriOdlazak);
  $("#cetOdlazakCheckbox").prop("checked", !!periodi[index].cetOdlazak);
  $("#petOdlazakCheckbox").prop("checked", !!periodi[index].petOdlazak);
  $("#subOdlazakCheckbox").prop("checked", !!periodi[index].subOdlazak);
  $("#nedOdlazakCheckbox").prop("checked", !!periodi[index].nedOdlazak);

  $("#saveButton").attr("onclick", `savePeriod(${index})`);
  $("#editPeriodModal").modal("open");
}

async function savePeriod(index) {
  if (!validatePeriod()) {
    M.toast({
      html:
        prijevodi["Nemože se spremiti jer podaci nisu dobro uneseni"]?.[window.sessionStorage.getItem("language")] ||
        "Nemože se spremiti jer podaci nisu dobro uneseni",
      classes: "rounded",
    });
    return;
  }

  periodi[index].tip = $("#tipInput").val();

  periodi[index].aktivan = $("#aktivanCheckbox").is(":checked");
  periodi[index].minDanRez = $("#minDanRezPeriodiInput").val();

  periodi[index].datumOd = $("#datumOdInput").val();
  periodi[index].datumDo = $("#datumDoInput").val();

  periodi[index].ponDolazak = $("#ponDolazakCheckbox").is(":checked");
  periodi[index].utoDolazak = $("#utoDolazakCheckbox").is(":checked");
  periodi[index].sriDolazak = $("#sriDolazakCheckbox").is(":checked");
  periodi[index].cetDolazak = $("#cetDolazakCheckbox").is(":checked");
  periodi[index].petDolazak = $("#petDolazakCheckbox").is(":checked");
  periodi[index].subDolazak = $("#subDolazakCheckbox").is(":checked");
  periodi[index].nedDolazak = $("#nedDolazakCheckbox").is(":checked");

  periodi[index].ponOdlazak = $("#ponOdlazakCheckbox").is(":checked");
  periodi[index].utoOdlazak = $("#utoOdlazakCheckbox").is(":checked");
  periodi[index].sriOdlazak = $("#sriOdlazakCheckbox").is(":checked");
  periodi[index].cetOdlazak = $("#cetOdlazakCheckbox").is(":checked");
  periodi[index].petOdlazak = $("#petOdlazakCheckbox").is(":checked");
  periodi[index].subOdlazak = $("#subOdlazakCheckbox").is(":checked");
  periodi[index].nedOdlazak = $("#nedOdlazakCheckbox").is(":checked");

  if (await httpPost("/cms/api/v1/periodi", periodi[index])) {
    $("#editPeriodModal").modal("close");
    getData().then(displayPeriodi);
  }
}

function addNewPeriod() {
  periodi.push({ kampId: window.sessionStorage.getItem("kampId") });
  $("#activeCancelButton").attr("onclick", `cancelAddNewPeriod(${periodi.length - 1})`);
  $("#activeCancelButton").removeClass("hide");
  $("#passiveCancelButton").addClass("hide");
  editPeriod(periodi.length - 1);
}

function cancelAddNewPeriod(index) {
  $("#activeCancelButton").prop("onclick", null).off("click");
  $("#activeCancelButton").addClass("hide");
  $("#passiveCancelButton").removeClass("hide");
  periodi[index].deleted = true;
}

function confirmDelete() {
  $("#confirmDeleteButton").attr("onClick", `deleteInDB()`);
  $("#confirmDelete").modal("open");
}

function deleteInDB() {
  httpDelete("/cms/api/v1/kamp/" + kampData.uid).then((success) => {
    if (success) window.location.href = `/cms/`;
  });
}

async function saveButton() {
  let object;
  object = Object.assign({}, kampData);

  if (!validateInput()) {
    M.toast({
      html:
        prijevodi["Nemože se spremiti jer podaci nisu dobro uneseni"]?.[window.sessionStorage.getItem("language")] ||
        "Nemože se spremiti jer podaci nisu dobro uneseni",
      classes: "rounded",
    });
    return;
  }

  object.naziv = $("#nazivInput").val();
  object.dodatniNaziv = $("#dodatniNazivInput").val();

  object.logo = $("#slika1Input").val();
  object.defaultSlika = $("#slika2Input").val();

  object.mail = $("#mailInput").val();
  object.telefon = $("#telefonInput").val();
  object.www = $("#wwwInput").val();

  object.adresa = $("#adresaInput").val();
  object.mjesto = $("#mjestoInput").val();
  object.drzava = $("#drzavaInput").val();

  object.latitude = $("#latitudeInput").val();
  object.longitude = $("#longitudeInput").val();

  object.minDanRez = $("#minDanRezInput").val();
  object.minDanRezMobilke = $("#minDanRezMobilkeInput").val();
  object.cuvanjeRezMinuta = $("#cuvanjeRezMinutaInput").val();

  object.brojOsoba = $("#brojOsobaInput").val();
  object.brojDjece = $("#brojDjeceInput").val();
  object.brojOsobaMh = $("#brojOsobaMhInput").val();
  object.brojDjeceMh = $("#brojDjeceMhInput").val();

  object.phobsIdParcele = $("#phobsIdParceleInput").val();
  object.phobsIdMobilke = $("#phobsIdMobilkeInput").val();

  object.otvorenOd = $("#otvorenOdInput").val();
  object.otvorenDo = $("#otvorenDoInput").val();

  object.rezParcelaStartDate = $("#rezParcelaStartDateInput").val();
  object.rezMobilkaStartDate = $("#rezMobilkaStartDateInput").val();

  object.propertyid = $("#propertyidInput").val();
  object.phobs_username = $("#phobs_usernameInput").val();
  object.phobs_password = $("#phobs_passwordInput").val();
  object.phobs_siteid = $("#phobs_siteidInput").val();
  object.pmsApiKey = $("#pmsApiKeyInput").val();
  object.pmsToken = $("#pmsTokenInput").val();
  object.defaultRateId = $("#defaultRateIdInput").val();
  object.rateIdParcele = $("#rateIdParceleInput").val();
  object.mapboxToken = $("#mapboxTokenInput").val();
  object.geojsonFile = $("#geojsonFileInput").val();

  object.bookingModul = $("#bookingModulCheckbox").is(":checked");
  object.zatvoriBooking = $("#zatvoriBookingCheckbox").is(":checked");
  object.panomiframe = $("#panomiframeCheckbox").is(":checked");
  object.sortFilterRb = $("#sortFilterRbCheckbox").is(":checked");
  object.upitVidljivo = $("#upitVidljivoCheckbox").is(":checked");
  object.nazivHeader = $("#nazivHeaderCheckbox").is(":checked");
  object.maintenanceMode = $("#maintenanceModeCheckbox").is(":checked");
  object.imaParcele = $("#imaParceleCheckbox").is(":checked");
  object.imaMh = $("#imaMhCheckbox").is(":checked");
  object.navigacija = $("#navigacijaCheckbox").is(":checked");
  object.showDistances = $("#showDistancesCheckbox").is(":checked");
  object.paymentGateway = $("#paymentGatewayCheckbox").is(":checked");
  object.filterAsButton = $("#filterAsButtonCheckbox").is(":checked");
  object.loyalty = $("#loyaltyCheckbox").is(":checked");
  object.popunjavanjeRupa = $("#popunjavanjeRupaCheckbox").is(":checked");

  object.hr = $("#hrCheckbox").is(":checked");
  object.en = $("#enCheckbox").is(":checked");
  object.de = $("#deCheckbox").is(":checked");
  object.it = $("#itCheckbox").is(":checked");
  object.nl = $("#nlCheckbox").is(":checked");
  object.ru = $("#ruCheckbox").is(":checked");
  object.si = $("#siCheckbox").is(":checked");
  object.pl = $("#plCheckbox").is(":checked");

  if (await httpPost("/cms/api/v1/kamp", object)) {
    if (!window.sessionStorage.getItem("kampId")) window.location.href = "/cms/";
    getData().then(displayData);
  }
}

function validateInput() {
  clearValidities();
  $("#jeziciLabel").html(
    `<h6 localization-key="Višejezičnost:">${
      prijevodi["Višejezičnost:"]?.[window.sessionStorage.getItem("language")] || "Višejezičnost:"
    }</h6>`
  );
  result = true;

  //naziv je obavezno polje
  if (!$("#nazivInput").val()) {
    result = false;
    setValidity($("#nazivInput"), false);
  } else setValidity($("#nazivInput"), true);
  //phobsIdParcele je obavezno polje, nemogu provjeriti je li jedinstven
  if (!$("#phobsIdParceleInput").val()) {
    result = false;
    setValidity($("#phobsIdParceleInput"), false);
  } else setValidity($("#phobsIdParceleInput"), true);
  //phobsIdMobilke je obavezno polje, nemogu provjeriti je li jedinstven
  if (!$("#phobsIdMobilkeInput").val()) {
    result = false;
    setValidity($("#phobsIdMobilkeInput"), false);
  } else setValidity($("#phobsIdMobilkeInput"), true);
  //barem jedan jezik mora biti odabran
  if (
    !$("#hrCheckbox").is(":checked") &&
    !$("#enCheckbox").is(":checked") &&
    !$("#deCheckbox").is(":checked") &&
    !$("#itCheckbox").is(":checked") &&
    !$("#nlCheckbox").is(":checked") &&
    !$("#ruCheckbox").is(":checked") &&
    !$("#siCheckbox").is(":checked") &&
    !$("#plCheckbox").is(":checked")
  ) {
    result = false;
    $("#jeziciLabel").html(
      `<h6 class="red-text" localization-key="Barem jedan jezik mora biti odabran:">${
        prijevodi["Barem jedan jezik mora biti odabran:"]?.[window.sessionStorage.getItem("language")] ||
        "Barem jedan jezik mora biti odabran:"
      }</h6>`
    );
  }

  return result;
}

function validatePeriod() {
  let result = true;
  //tip mora biti jedan od ponuđenih
  if (!getTipText[$("#tipInput").val()]) {
    result = false;
    setValidity($("#tipInput").parent(), false);
  } else setValidity($("#tipInput").parent(), true);
  //datumOd i datumDo moraju biti odabrani
  if (!$("#datumOdInput").val()) {
    result = false;
    setValidity($("#datumOdInput"), false);
  } else setValidity($("#datumOdInput"), true);
  if (!$("#datumDoInput").val()) {
    result = false;
    setValidity($("#datumDoInput"), false);
  } else setValidity($("#datumDoInput"), true);
  //datumOd mora biti prije datumDo
  if (
    $("#datumOdInput").val() &&
    $("#datumDoInput").val() &&
    $("#datumOdInput").val().localeCompare($("#datumDoInput").val()) <= 0
  ) {
    setValidity($("#datumOdInput"), true);
    setValidity($("#datumDoInput"), true);
  } else {
    result = false;
    setValidity($("#datumOdInput"), false);
    setValidity($("#datumDoInput"), false);
  }
  return result;
}

async function updateUnitId() {
  document.activeElement?.blur();
  const updateUnitIdUrl = await httpGet("/cms/api/v1/updateUnitIdUrl").then((result) => result[0]?.vrijednostPolja);
  if (!updateUnitIdUrl) {
    M.toast({
      html:
        prijevodi["Nije definiran endpoint"]?.[window.sessionStorage.getItem("language")] || "Nije definiran endpoint",
      classes: "rounded",
    });
    return;
  }
  const response = await fetch(updateUnitIdUrl);
  if (!response.ok) {
    M.toast({
      html: response.status + " " + response.statusText,
      classes: "rounded",
    });
    return;
  }
  const text = await response.text();
  if (text) {
    M.toast({
      html: text,
      classes: "rounded",
    });
    return;
  }
  M.toast({
    html: prijevodi["OK"]?.[window.sessionStorage.getItem("language")] || "OK",
    classes: "rounded",
  });
  return;
}

function uploadGeojson() {
  $('<input type="file" multiple>')
    .on("change", async function () {
      const success = await sendFile(this.files[0]);
      if (success) {
        $("#geojsonFileInput").val(this.files[0].name);
      }
    })
    .click();
}

async function sendFile(file) {
  resetProgressBar();
  showLoader();
  const req = new XMLHttpRequest();
  await new Promise((resolve, reject) => {
    req.upload.addEventListener("progress", updateProgress);
    req.onloadend = resolve; //continue when request finishes
    req.open("POST", "/cms/api/v1/geojson");
    req.withCredentials = true;
    req.setRequestHeader("kampid", window.sessionStorage.getItem("kampId"));
    const formData = new FormData();
    formData.append(file.name, file);
    req.send(formData);
  });
  hideLoader();
  if (Math.floor(req.status / 100) == 2) return true;
  else {
    M.toast({
      html:
        (prijevodi["Neuspješno spremanje."]?.[window.sessionStorage.getItem("language")] ||
          "Neuspješno spremanje.") +
        " Status: " +
        req.status,
      classes: "rounded",
    });
    return false;
  }
}

function revertGeojson() {
  httpPost("/cms/api/v1/revertGeojson", { kampId: kampData.uid });
}

function makePeriodHtml(index) {
  return `<div class="divider col s12"></div>
    <div class="col s3 l2">
        <p class="right-align" localization-key="Tip:">${
          prijevodi["Tip:"]?.[window.sessionStorage.getItem("language")] || "Tip:"
        }</p>
    </div>
    <div class="col s9 l4">
        <p>${getDisplayValue(
          prijevodi[getTipText[periodi[index].tip]]?.[window.sessionStorage.getItem("language")] ||
            getTipText[periodi[index].tip]
        )}</p>
    </div>
    <div class="col s9 l5">
        <p class="right-align" localization-key="Minimalno dana za rezervaciju:">${
          prijevodi["Minimalno dana za rezervaciju:"]?.[window.sessionStorage.getItem("language")] ||
          "Minimalno dana za rezervaciju:"
        }</p>
    </div>
    <div class="col s3 l1">
        <p>${Number(periodi[index].minDanRez)}</p>
    </div>
    <div class="col s3 l2">
        <p class="right-align" localization-key="Aktivan:">${
          prijevodi["Aktivan:"]?.[window.sessionStorage.getItem("language")] || "Aktivan:"
        }</p>
    </div>
    <div class="col s9 l2">
        <p>${daIliNe(periodi[index].aktivan)}</p>
    </div>
    <div class="col s3 l2">
        <p class="right-align" localization-key="Datum od:">${
          prijevodi["Datum od:"]?.[window.sessionStorage.getItem("language")] || "Datum od:"
        }</p>
    </div>
    <div class="col s3 l2">
        <p>${getDisplayValue(periodi[index].datumOd)}</p>
    </div>
    <div class="col s3 l2">
        <p class="right-align" localization-key="Datum do:">${
          prijevodi["Datum do:"]?.[window.sessionStorage.getItem("language")] || "Datum do:"
        }</p>
    </div>
    <div class="col s3 l2">
        <p>${getDisplayValue(periodi[index].datumDo)}</p>
    </div>
    <div class="col s3">
        <p class="right-align" localization-key="Dolasci:">${
          prijevodi["Dolasci:"]?.[window.sessionStorage.getItem("language")] || "Dolasci:"
        }</p>
    </div>
    <div class="col s9">
        <p>${makeDaniString(periodi[index], "Dolazak")}</p>
    </div>
    <div class="col s3">
        <p class="right-align" localization-key="Odlasci:">${
          prijevodi["Odlasci:"]?.[window.sessionStorage.getItem("language")] || "Odlasci:"
        }</p>
    </div>
    <div class="col s9">
        <p>${makeDaniString(periodi[index], "Odlazak")}</p>
    </div>
    <div class="col s12 right-align">
        <button
            class="waves-effect waves-light btn blue"
            onclick="editPeriod(${index})"
        >
        <i class="material-icons left">edit</i>
            <span localization-key="Uredi">${
              prijevodi["Uredi"]?.[window.sessionStorage.getItem("language")] || "Uredi"
            }</span>
        </button>
        <button 
            class="waves-effect waves-light btn red"
            onclick="deletePeriod(${index})"
        >
        <i class="material-icons left">delete</i>
            <span localization-key="Obriši">${
              prijevodi["Obriši"]?.[window.sessionStorage.getItem("language")] || "Obriši"
            }</span>
        </button>
    </div>`;
}

function makeDaniString(period, string) {
  let result = "";
  if (period["pon" + string])
    result += (prijevodi["Ponedjeljak"]?.[window.sessionStorage.getItem("language")] || "Ponedjeljak") + ", ";
  if (period["uto" + string])
    result += (prijevodi["Utorak"]?.[window.sessionStorage.getItem("language")] || "Utorak") + ", ";
  if (period["sri" + string])
    result += (prijevodi["Srijeda"]?.[window.sessionStorage.getItem("language")] || "Srijeda") + ", ";
  if (period["cet" + string])
    result += (prijevodi["Četvrtak"]?.[window.sessionStorage.getItem("language")] || "Četvrtak") + ", ";
  if (period["pet" + string])
    result += (prijevodi["Petak"]?.[window.sessionStorage.getItem("language")] || "Petak") + ", ";
  if (period["sub" + string])
    result += (prijevodi["Subota"]?.[window.sessionStorage.getItem("language")] || "Subota") + ", ";
  if (period["ned" + string])
    result += (prijevodi["Nedjelja"]?.[window.sessionStorage.getItem("language")] || "Nedjelja") + ", ";
  return result.substring(0, result.length - 2);
}
