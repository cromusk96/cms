async function httpGet(url) {
  const response = await fetch(url, {
    credentials: "include",
    headers: { kampId: window.sessionStorage.getItem("kampId") },
  });
  const returnData = await response.json();
  if (!response.ok) {
    M.toast({
      html:
        prijevodi["Neuspješno dohvaćanje podataka"]?.[
                window.sessionStorage.getItem("language")
              ] || "Neuspješno dohvaćanje podataka",
      classes: "rounded",
    });
  }
  return returnData;
}

async function httpDelete(url) {
  return fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: { kampId: window.sessionStorage.getItem("kampId") },
  }).then((res) => {
    if (res.ok)
      M.toast({
        html:
          prijevodi["Uspješno brisanje"]?.[
                window.sessionStorage.getItem("language")
              ] || "Uspješno brisanje",
        classes: "rounded",
      });
    else
      M.toast({
        html:
          (prijevodi["Brisanje nije uspjelo."]?.[
                window.sessionStorage.getItem("language")
              ] || "Brisanje nije uspjelo.") +
          " Status: " +
          res.status,
        classes: "rounded",
      });
    return res.ok;
  });
}

async function httpPost(url, object) {
  return fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(object),
  }).then((res) => {
    if(res.redirected) location.reload();
    if (res.ok)
      M.toast({
        html:
          prijevodi["Uspješno spremanje"]?.[
                window.sessionStorage.getItem("language")
              ] || "Uspješno spremanje",
        classes: "rounded",
      });
    else
      M.toast({
        html:
          (prijevodi["Spremanje nije uspjelo."]?.[
                window.sessionStorage.getItem("language")
              ] || "Spremanje nije uspjelo.") +
          " Status: " +
          res.status,
        classes: "rounded",
      });
    return res.ok;
  });
}
