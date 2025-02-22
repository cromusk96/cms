function showLoader() {
  document.getElementById("loader").classList.add("show");
}

function hideLoader() {
  document.getElementById("loader").classList.remove("show");
  resetProgressBar();
}

function updateProgress(e) {
  document.getElementById("progressBar").style.width =
    (e.loaded / e.total) * 100 + "%";
}

function resetProgressBar() {
  document.getElementById("progressBar").style.width = "0%";
}
