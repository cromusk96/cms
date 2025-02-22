function collectData() {
  $("#warning").css("visibility", "hidden");
  if ($("#username").val() == "" || $("#password").val() == "") {
    $("#warning").text("Korisničko ime i lozinka ne smiju biti prazni");
    $("#warning").css("visibility", "visible");
    return;
  }
  const username = $("#username").val();
  const password = $("#password").val();

  fetch("/cms/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }).then((res) => {
    if (res.ok) {
      window.location.href = `/cms/`;
    } else {
      $("#warning").text("Netočno korisničko ime ili lozinka");
      $("#warning").css("visibility", "visible");
    }
  });
}

function onSubmit(e) {
  e.preventDefault();
  collectData();
  return false;
}
