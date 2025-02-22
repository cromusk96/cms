let object = {};
let paymentGws;

$(document).ready(async function () {
  showLink();
  await provjeriKamp();
  $("#activeKampName").html(window.sessionStorage.getItem("kampName"));
  $(".modal").modal();
  $("#myNavBar").sidenav();
  $("select").formSelect();
  getData().then(buildPaymentGwSelect).then(displayData);
});

async function getData() {
  await httpGet("/cms/api/v1/isAdmin").then((result) => {
    if (!result) window.location.href = "/cms";
  });
  let dataCalls = [];
  dataCalls.push(
    httpGet("/cms/api/v1/payGwPostavke").then((result) => {
      object = result;
    })
  );
  dataCalls.push(
    httpGet("/cms/api/v1/paymentGws").then((results) => {
      paymentGws = results;
    })
  );
  await Promise.all(dataCalls);
}

function buildPaymentGwSelect() {
  let newHtml = "";
  paymentGws.forEach((paymentGw) => {
    if (paymentGw.uid == object.gatewayId)
      newHtml += `<option value="${paymentGw.uid}" selected>${paymentGw.naziv}</option>`;
    else
      newHtml += `<option value="${paymentGw.uid}">${paymentGw.naziv}</option>`;
  });
  $("#paymentGwSelect").html(newHtml);
  $("#paymentGwSelect").formSelect();
}

function displayData() {
  $("#shopIdInput").val(object.shopID);
  $("#shoppingCartIdPrefixInput").val(object.shoppingCartIdPrefix);
  $("#versionInput").val(object.version);
  $("#returnUrlInput").val(object.returnUrl);
  $("#cancelUrlInput").val(object.cancelUrl);
  $("#returnErrorUrlInput").val(object.returnErrorURL);

  $("#bankCardCheckbox").prop("checked", !!object.bankCard);
  $("#bankTransactionCheckbox").prop("checked", !!object.bankTransaction);
  $("#finishTransactionRightAwayCheckbox").prop(
    "checked",
    !!object.finishTransactionRightAway
  );
  $("#activeCheckbox").prop("checked", !!object.active);
}

function saveButton() {
  object.gatewayId = $("#paymentGwSelect").val();
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
  object.kampId = Number(window.sessionStorage.getItem("kampId"));

  object.shopID = $("#shopIdInput").val();
  object.shoppingCartIdPrefix = $("#shoppingCartIdPrefixInput").val();
  object.version = $("#versionInput").val();
  object.returnUrl = $("#returnUrlInput").val();
  object.cancelUrl = $("#cancelUrlInput").val();
  object.returnErrorURL = $("#returnErrorUrlInput").val();

  object.bankCard = $("#bankCardCheckbox").is(":checked");
  object.bankTransaction = $("#bankTransactionCheckbox").is(":checked");
  object.finishTransactionRightAway = $(
    "#finishTransactionRightAwayCheckbox"
  ).is(":checked");
  object.active = $("#activeCheckbox").is(":checked");

  httpPost("/cms/api/v1/payGwPostavke", object);
}

function validateInput(uid) {
  clearValidities();
  result = true;
  //Nothing yet...

  return result;
}
