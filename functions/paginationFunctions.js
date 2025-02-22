let maxPages;
function initPagination(maxNumberOfItems) {
  if (!window.sessionStorage.getItem("itemsPerPage"))
    window.sessionStorage.setItem("itemsPerPage", 20);
  const itemsPerPage = window.sessionStorage.getItem("itemsPerPage");
  $("#itemsPerPage").val(itemsPerPage);
  $("#itemsPerPage").formSelect();
  $("#itemsPerPageLabel").addClass("active");
  if (itemsPerPage == "SVE") {
    maxPages = 1;
  } else {
    maxPages = Math.ceil(
      maxNumberOfItems / Number(window.sessionStorage.getItem("itemsPerPage"))
    );
  }

  makeNewPaginationControls();

  let pageNumber = correctPageNumber(
    window.sessionStorage.getItem("pageNumber")
  );
  window.sessionStorage.setItem("pageNumber", pageNumber);
  $(".page" + pageNumber).addClass("active");
}
function setPageNumber(pageNumber) {
  pageNumber = correctPageNumber(pageNumber);
  window.sessionStorage.setItem("pageNumber", pageNumber);
  makeNewPaginationControls();
  $(".page" + pageNumber).addClass("active");
  displayData();
}
function correctPageNumber(pageNumber) {
  if (!pageNumber || pageNumber < 1) pageNumber = 1;
  if (pageNumber > maxPages) pageNumber = maxPages;
  updateArrows(pageNumber);

  return pageNumber;
}
function updateArrows(pageNumber) {
  if (pageNumber <= 1) {
    $(".leftArrow").addClass("disabled");
    $(".leftArrow").removeClass("waves-effect");
  } else {
    $(".leftArrow").removeClass("disabled");
    $(".leftArrow").addClass("waves-effect");
  }
  if (pageNumber >= maxPages) {
    $(".rightArrow").addClass("disabled");
    $(".rightArrow").removeClass("waves-effect");
  } else {
    $(".rightArrow").removeClass("disabled");
    $(".rightArrow").addClass("waves-effect");
  }
}
function alterPageNumber(x) {
  setPageNumber(Number(window.sessionStorage.getItem("pageNumber")) + x);
}
function setItemsPerPage() {
  let itemsPerPage = $("#itemsPerPage").val();
  if (itemsPerPage < 1) itemsPerPage = 1;
  window.sessionStorage.setItem("itemsPerPage", itemsPerPage);
  displayData();
}
function makeNewPaginationControls() {
  let pageNumber = window.sessionStorage.getItem("pageNumber");

  //left arrow and page 1:
  let newHtml = `<li class="leftArrow waves-effect">
  <a href="#!" onclick="alterPageNumber(-1)">
  <i class="material-icons">chevron_left</i></a></li>
  <li class="page1 waves-effect">
  <a href="#!" onclick="setPageNumber(1)">1</a></li>`;

  //...
  if (maxPages > 7 && pageNumber > 5)
    newHtml += `<li class="disabled"><a href="#!">...</a></li>`;

  //middle 5 pages:
  let start;
  let numberOfPages;
  if (maxPages < 8) {
    start = 2;
    numberOfPages = maxPages - 2;
  } else if (pageNumber < 5) {
    start = 2;
    numberOfPages = 6;
  } else if (pageNumber == 5) {
    start = 2;
    numberOfPages = 6;
  } else if (maxPages - pageNumber < 4) {
    start = maxPages - 6;
    numberOfPages = 6;
  } else if (maxPages - pageNumber == 4) {
    start = maxPages - 6;
    numberOfPages = 6;
  } else {
    start = pageNumber - 2;
    numberOfPages = 5;
  }
  for (let i = start; i < start + numberOfPages; i++) {
    newHtml += `<li class="page${i} waves-effect">
      <a href="#!" onclick="setPageNumber(${i})">${i}</a></li>`;
  }

  //...
  if (maxPages > 7 && pageNumber < maxPages - 4)
    newHtml += `<li class="disabled"><a href="#!">...</a></li>`;

  //last page:
  if (maxPages >= 2) {
    newHtml += `<li class="page${maxPages} waves-effect">
      <a href="#!" onclick="setPageNumber(${maxPages})">${maxPages}</a></li>`;
  }
  //right arrow:
  newHtml += `<li class="rightArrow waves-effect"><a href="#!" onclick="alterPageNumber(1)">
  <i class="material-icons">chevron_right</i></a></li>`;
  $(".pagination").html(newHtml);
}
