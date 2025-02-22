function changeImage(fieldNumber) {
  if (
    fieldNumber !== "" &&
    (!fieldNumber || fieldNumber < 1 || fieldNumber > 8)
  ) {
    //Ovo se nebi smjelo desit
    M.toast({
      html:
        prijevodi["Neuspješno spremanje."]?.[
          window.sessionStorage.getItem("language")
        ] || "Neuspješno spremanje.",
      classes: "rounded",
    });
    return;
  }
  const panorama = fieldNumber === "" ? "/api/panorama?path=" : "/";
  $('<input type="file" multiple>')
    .on("change", async function () {
      const pathPart = await sendImage(this.files[0]);
      if (pathPart) {
        $("#slika" + fieldNumber + "Input").val(
          "/cms" + panorama + "images/" + pathPart + "/" + this.files[0].name
        );
      }
    })
    .click();
}

async function sendImage(file) {
  resetProgressBar();
  showLoader();
  const req = new XMLHttpRequest();
  await new Promise((resolve, reject) => {
    req.upload.addEventListener("progress", updateProgress);
    req.onloadend = resolve; //continue when request finishes
    req.open("POST", "/cms/api/v1/image");
    req.withCredentials = true;
    req.setRequestHeader("kampid", window.sessionStorage.getItem("kampId"));
    const formData = new FormData();
    formData.append(file.name, file);
    req.send(formData);
  });
  hideLoader();
  if (Math.floor(req.status / 100) == 2) {
    const pathPartObject = JSON.parse(req.responseText);
    return pathPartObject.pathPart;
  } else {
    M.toast({
      html:
        (prijevodi["Neuspješno spremanje."]?.[
          window.sessionStorage.getItem("language")
        ] || "Neuspješno spremanje.") +
        " Status: " +
        req.status,
      classes: "rounded",
    });
    return false;
  }
}

function openImage(n) {
  if (!$("#slika" + n + "Input").val()) {
    M.toast({
      html:
        prijevodi["Nema slike za prikaz"]?.[
          window.sessionStorage.getItem("language")
        ] || "Nema slike za prikaz",
      classes: "rounded",
    });
    return;
  }
  if (n === "") {
    window.open($("#slika" + n + "Input").val(), "_blank").focus();
    return;
  }
  $("#imageDisplay").attr("src", $("#slika" + n + "Input").val());
  $("#editObjectModal").modal("close");
  $("#imageDisplayModal").modal("open");
}

function closeImage() {
  $("#imageDisplayModal").modal("close");
}
