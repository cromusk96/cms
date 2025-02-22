let object = {};

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
  let dataCalls = [];
  dataCalls.push(
    httpGet("/cms/api/v1/ostalePostavke").then((result) => {
      object = result;
      if (!object) object = {};
    })
  );
  await Promise.all(dataCalls);
}

function displayData() {
  $("#facebookInput").val(object.facebook);
  $("#instagramInput").val(object.instagram);
  $("#youtubeInput").val(object.youtube);

  $("#ibanInput").val(object.iban);
  $("#bicInput").val(object.bic);

  $("#oibInput").val(object.oib);
  $("#cuvanjeRezDanaInput").val(object.cuvanjeRezDana);
  $("#prodajaMailInput").val(object.prodajaMail);
  $("#prodajaTelefonInput").val(object.prodajaTelefon);

  $("#textZaGostaInput").val(object.textZaGosta);
  M.textareaAutoResize($("#textZaGostaInput"));

  $("#pravilaPrivatnostiHrInput").val(object.pravilaPrivatnostiHr);
  M.textareaAutoResize($("#pravilaPrivatnostiHrInput"));
  $("#pravilaPrivatnostiEnInput").val(object.pravilaPrivatnostiEn);
  M.textareaAutoResize($("#pravilaPrivatnostiEnInput"));
  $("#politikaKoristenjaHrInput").val(object.politikaKoristenjaHr);
  M.textareaAutoResize($("#politikaKoristenjaHrInput"));
  $("#politikaKoristenjaEnInput").val(object.politikaKoristenjaEn);
  M.textareaAutoResize($("#politikaKoristenjaEnInput"));
}

function saveButton() {
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

  object.facebook = $("#facebookInput").val();
  object.instagram = $("#instagramInput").val();
  object.youtube = $("#youtubeInput").val();

  object.iban = $("#ibanInput").val();
  object.bic = $("#bicInput").val();
  object.oib = $("#oibInput").val();

  object.prodajaMail = $("#prodajaMailInput").val();
  object.prodajaTelefon = $("#prodajaTelefonInput").val();

  object.textZaGosta = $("#textZaGostaInput").val();
  object.cuvanjeRezDana = $("#cuvanjeRezDanaInput").val();

  object.pravilaPrivatnostiHr = $("#pravilaPrivatnostiHrInput").val();
  object.pravilaPrivatnostiEn = $("#pravilaPrivatnostiEnInput").val();
  object.politikaKoristenjaHr = $("#politikaKoristenjaHrInput").val();
  object.politikaKoristenjaEn = $("#politikaKoristenjaEnInput").val();

  httpPost("/cms/api/v1/ostalePostavke", object);
}

function validateInput(uid) {
  clearValidities();
  result = true;
  //Nothing yet...

  return result;
}
