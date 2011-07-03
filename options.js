(function() {
  window.onload = function() {
    var bkg, key, value, _ref;
    for (key in localStorage) {
      value = localStorage[key];
      $("#" + key).val(value);
    }
    bkg = chrome.extension.getBackgroundPage();
    $("#save").click(function() {});
    $(".setting").each(function() {
      var el, name, _ref;
      el = $(this);
      name = el.attr("id");
      value = el.val();
      localStorage[name] = value;
      return (_ref = bkg.connection) != null ? _ref[name] = value : void 0;
    });
    if ((_ref = bkg.connection) != null) {
      _ref.initSocket();
    }
    return this;
  };
}).call(this);
