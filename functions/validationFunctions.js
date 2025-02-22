//check if value exists in a collection saved in element.key and ignore value with given uid
function checkForExistance(value, collection, key, uid) {
  if (!value) return true;

  //make string comparison case-insensitive because DB compares them like that
  if (typeof value === "string" || value instanceof String)
    value = value.toLowerCase();

  for (let i = 0; i < collection.length; i++) {
    const comparedValue =
      typeof collection[i][key] === "string" ||
      collection[i][key] instanceof String
        ? collection[i][key].toLowerCase()
        : collection[i][key];
    if (value == comparedValue && (!uid || uid != collection[i].uid))
      return true;
  }
  return false;
}

function setValidity(object, isValid) {
  if (isValid) {
    object.removeClass("invalid");
    object.addClass("valid");
  } else {
    object.removeClass("valid");
    object.addClass("invalid");
  }
}

function clearValidities() {
  $(".invalid").removeClass("invalid");
  $(".valid").removeClass("valid");
}
