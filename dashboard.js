let kampovi;
let isAdmin;

$(document).ready(function () {
  showLink();
  $("#myNavBar").sidenav();
  translateNow();
  setFlag();
  $("#jezikSelect").val(window.sessionStorage.getItem("language"));
  $("#jezikSelect").formSelect();
  getData().then(displayData);
});

async function getData() {
  let promises = [];
  promises.push(
    httpGet("/cms/api/v1/kampovi").then((results) => {
      kampovi = results;
      initActiveKamp();
    })
  );
  promises.push(
    httpGet("/cms/api/v1/isAdmin").then((result) => {
      isAdmin = result;
    })
  );
  await Promise.all(promises);
}

function displayData() {
  let newhtml = ``;
  for (let i = 0; i < kampovi.length; i++) {
    newhtml += `<div class="col s12 m6 l3">
    <div id="card${i}" class="card small hoverable bgPhoto dashboardCard" onclick="changeKamp(${i})">
      <div class="card-stacked">
        <div class="card-content">
          <h4 class="whiteTextShadow">${kampovi[i].naziv}</h4>
        </div>
      </div>
    </div>
  </div>`;
  }
  if (isAdmin) {
    newhtml += `<div class="col s12 m6 l3">
      <div class="card small hoverable bgPhoto dashboardCard" onclick="addNewKamp()">
        <div class="card-stacked">
          <div class="card-content">
            <h4 class="whiteTextShadow" localization-key="Dodaj novi kamp">${
              prijevodi["Dodaj novi kamp"]?.[
                window.sessionStorage.getItem("language")
              ] || "Dodaj novi kamp"
            }</h4>
          </div>
        </div>
      </div>
    </div>`;
    isAdmin = 1;
  } else isAdmin = 0;
  let m = 12 - ((kampovi.length + isAdmin) % 2) * 6;
  let l = 12 - ((kampovi.length + isAdmin) % 4) * 3;
  newhtml += `<div class="col s12 m${m} l${l}"></div>`; //Filler div to make everything stay in place
  $("#cardsHolder").html(newhtml);
  for (let i = 0; i < kampovi.length; i++) {
    $(`#card${i}`).css("background-image", `url(${kampovi[i].logo})`);
  }
}

function initActiveKamp() {
  if (kampovi.length == 0) {
    addNewKamp();
    return;
  }
  let activeKampId = window.sessionStorage.getItem("kampId");
  if (!activeKampId) {
    //nema aktivnog kampa pa postavlja prvi
    changeKamp(0);
    return;
  }
  //provjeriti da li aktivni kamp postoji u popisu kampova
  for (let i = 0; i < kampovi.length; i++) {
    if (kampovi[i].uid == activeKampId) {
      //pronašao je aktivni kamp
      if (kampovi[i].naziv != window.sessionStorage.getItem("kampName")) {
        //ako naziv nije dobro postavljen, postavi cijeli kamp opet
        changeKamp(i);
      } else {
        //inače samo zapiši ime
        $("#activeKampName").html(kampovi[i].naziv);
      }
      return;
    }
  }
  //nije pronašao aktivni kamp pa postavlja prvi
  changeKamp(0);
}

function changeKamp(index) {
  window.sessionStorage.setItem("kampId", kampovi[index].uid);
  window.sessionStorage.setItem("kampName", kampovi[index].naziv);
  $("#activeKampName").html(window.sessionStorage.getItem("kampName"));
  M.toast({
    html:
      (prijevodi["Odabran je kamp:"]?.[
        window.sessionStorage.getItem("language")
      ] || "Odabran je kamp:") +
      " " +
      kampovi[index].naziv,
    classes: "rounded",
  });
}
//MOZDA dodati loader kad se podaci učitavaju (posvuda) - dodali smo za upload slika i csv-ova

function changeLanguage() {
  window.sessionStorage.setItem("language", $("#jezikSelect").val());
  translateNow();
  setFlag();
  $("#jezikSelect").formSelect();
}

function setFlag() {
  $("#flagImage").attr(
    "src",
    "/cms/public/flags/" + window.sessionStorage.getItem("language") + ".svg"
  );
}
