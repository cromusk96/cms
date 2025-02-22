//MOZDA prepisat ovo nekak da se ne oslanja na confirm delete modal i da ne sprema varijable za sebe

let file = {};
let tableName = "";

function selectCsv(tn) {
  tableName = tn;
  $('<input type="file" multiple>')
    .on("change", async function () {
      file = this.files[0];
      confirmSendCsv();
    })
    .click();
}

function confirmSendCsv() {
  $("#confirmSendCsvButton").attr("onClick", `sendCsvFile()`);
  $("#confirmSendCsv").modal("open");
}

async function sendCsvFile() {
  if (!tableName || jQuery.isEmptyObject(file)) {
    // This shouldn't normally happen
    M.toast({
      html: prijevodi["Datoteka nije odabrana."]?.[window.sessionStorage.getItem("language")] || "Datoteka nije odabrana.",
      classes: "rounded",
    });
    resolve();
  }
  resetProgressBar();
  showLoader();
  const req = new XMLHttpRequest();
  await new Promise((resolve, reject) => {
    req.upload.addEventListener("progress", updateProgress);
    req.onloadend = resolve; //continue when request finishes
    req.open("POST", "/cms/api/v1/" + tableName + "/csv");
    req.withCredentials = true;
    req.setRequestHeader("kampid", window.sessionStorage.getItem("kampId"));
    const formData = new FormData();
    formData.append(file.name, file);
    req.send(formData);
  });
  hideLoader();
  file = {};
  tableName = "";
  if (Math.floor(req.status / 100) == 2) {
    location.reload();
  } else {
    console.log(req.responseText);
    if (req.responseText) {
      M.toast({
        html:
          (prijevodi[
            "Učitavanje iz .csv-a nije uspjelo jer ovi redovi nisu prošli validaciju:"
          ]?.[window.sessionStorage.getItem("language")] ||
            "Učitavanje iz .csv-a nije uspjelo jer ovi redovi nisu prošli validaciju:") +
          "<br>" +
          req.responseText,
        classes: "rounded",
      });
    } else {
      M.toast({
        html:
          (prijevodi["Učitavanje iz csv-a nije uspjelo."]?.[window.sessionStorage.getItem("language")] ||
            "Učitavanje iz csv-a nije uspjelo.") +
          " Status: " +
          req.status,
        classes: "rounded",
      });
    }
  }
}

function downloadCsv(tn) {
  fetch("/cms/api/v1/" + tn + "/csv", {
    credentials: "include",
    headers: { kampId: window.sessionStorage.getItem("kampId") },
  })
    .then((res) => res.blob())
    .then((blob) => {
      const file = window.URL.createObjectURL(blob);

      // create <a> tag dinamically
      let fileLink = document.createElement("a");
      fileLink.href = file;

      // it forces the name of the downloaded file
      fileLink.download = tn + ".csv";

      // triggers the click event
      fileLink.click();
    });
}
