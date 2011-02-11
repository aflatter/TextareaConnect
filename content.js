(function() {
  var port, textAreas;
  (function() {
    var siteId, timeStamp;
    timeStamp = new Date().getTime();
    siteId = function() {
      return location.href.replace(/[^a-zA-Z]/g, "") + "_" + timeStamp;
    };
    $.fn.edited = function(callback) {
      return this.each(function() {
        var $e, active, e, last, myloop;
        active = false;
        e = this;
        $e = $(e);
        $e.focusin(function() {
          return active = true;
        });
        $e.focusout(function() {
          return active = false;
        });
        last = $e.val();
        return (myloop = function() {
          var current;
          current = $e.val();
          if (active && current !== last) {
            callback($e);
            console.log("calling " + $e);
          }
          last = current;
          return setTimeout(myloop, 1000);
        })();
      });
    };
    $.fn.uuid = function() {
      var e, uuid;
      e = $(this.get(0));
      uuid = e.data("uuid");
      if (uuid) {
        return uuid;
      } else {
        $.fn.uuid.counter += 1;
        uuid = siteId() + "_" + $.fn.uuid.counter;
        e.data("uuid", uuid);
        return uuid;
      }
    };
    $.fn.uuid.counter = 0;
    return $.fn.editInExternalEditor = function(port) {
      var sendToEditor, that;
      that = $(this);
      if (that.data("server")) {
        return;
      }
      that.data("server", true);
      sendToEditor = function(spawn) {
        if (spawn == null) {
          spawn = false;
        }
        return port.postMessage({
          textarea: that.val(),
          uuid: that.uuid(),
          spawn: spawn,
          action: "open"
        });
      };
      that.edited(function() {
        console.log("edited " + this);
        return sendToEditor();
      });
      return sendToEditor(true);
    };
  })();
  textAreas = {};
  port = chrome.extension.connect({
    name: "textareapipe"
  });
  port.onMessage.addListener(function(obj) {
    var textarea;
    textarea = textAreas[obj.uuid];
    return textarea.val(obj.textarea);
  });
  chrome.extension.onRequest.addListener(function(req, sender) {
    var realUrl, textarea;
    if (req.action === "edittextarea") {
      console.log("frame " + req.onClickData.frameUrl + " page " + req.onClickData.pageUrl + " " + window.location.href + " ");
      realUrl = req.onClickData.frameUrl || req.onClickData.pageUrl;
      if (realUrl !== window.location.href) {
        return;
      }
      textarea = $(document.activeElement);
      textAreas[textarea.uuid()] = textarea;
      return textarea.editInExternalEditor(port);
    }
  });
  $(window).unload(function() {
    var key, ta, uuids;
    console.log(textAreas);
    for (key in textAreas) {
      ta = textAreas[key];
      uuids = ta.uuid();
    }
    if (uuids.length > 0) {
      return port.postMessage({
        action: "delete",
        uuids: uuids
      });
    }
  });
}).call(this);
