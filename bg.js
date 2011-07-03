(function() {
  var Connection, initExtension, loadSocketIO, showTempNotification;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  localStorage.url = 'http://localhost:32942';
  window.connection = null;
  loadSocketIO = function() {
    var scriptUrl;
    clearTimeout(loadSocketIO.timer);
    scriptUrl = "" + localStorage.url + "/socket.io/socket.io.js";
    console.log("trying to get io from " + scriptUrl);
    if (!window.io) {
      jQuery.getScript(scriptUrl, function() {
        window.connection = new Connection(localStorage.url);
        initExtension();
        return clearTimeout(loadSocketIO.timer);
      });
      return loadSocketIO.timer = setTimeout(loadSocketIO, 500);
    } else {
      return console.log("we aleready have io");
    }
  };
  initExtension = function() {
    chrome.contextMenus.removeAll(function() {
      return chrome.contextMenus.create({
        title: "Edit in external editor",
        contexts: ["editable"],
        onclick: function(onClickData, tab) {
          return chrome.tabs.sendRequest(tab.id, {
            action: "edittextarea",
            onClickData: onClickData
          });
        }
      });
    });
    return chrome.extension.onConnect.addListener(function(port) {
      if (port.name !== "textareapipe") {
        return;
      }
      return port.onMessage.addListener(function(msg) {
        return connection.pageActions[msg.action](port, msg);
      });
    });
  };
  showTempNotification = function(msg) {
    var notification;
    notification = webkitNotifications.createNotification("icon.png", 'TextareaConnect', msg);
    notification.show();
    return setTimeout(function() {
      return notification.cancel();
    }, 3000);
  };
  Connection = (function() {
    Connection.prototype.isConnected = false;
    function Connection(url) {
      this.url = url;
      this.ports = {};
      this.socket = null;
      this.pageActions = {
        open: __bind(function(port, msg) {
          this.ports[msg.uuid] = port;
          msg.type = msg.type || "txt";
          return this.send('open', msg);
        }, this),
        "delete": __bind(function(port, msg) {
          var uuid, _i, _len, _ref;
          _ref = msg.uuids;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            uuid = _ref[_i];
            delete this.ports[uuid];
          }
          return this.send('delete', msg);
        }, this)
      };
      this.initSocket();
    }
    Connection.prototype.initSocket = function() {
      var _ref;
      console.log("creating new socket " + this.url);
      if ((_ref = this.socket) != null) {
        _ref.disconnect();
      }
      this.socket = io.connect(this.url);
      this.socket.on("message", __bind(function(msg) {
        var obj, port;
        obj = JSON.parse(msg);
        port = this.ports[obj.uuid];
        return port.postMessage(obj);
      }, this));
      this.socket.on("connect", __bind(function() {
        this.isConnected = true;
        console.log(this);
        return showTempNotification("Connected to TextareaServer at " + this.url);
      }, this));
      this.socket.on("disconnect", __bind(function() {
        this.isConnected = false;
        console.log("Disconnected...");
        return showTempNotification("Disconnected from TextareaServer at " + this.url);
      }, this));
      this.socket.on("reconnect", __bind(function() {
        return console.log("Reconnecting...");
      }, this));
      return this.socket;
    };
    Connection.prototype.send = function() {
      var action, args, _ref;
      action = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (this.isConnected) {
        return (_ref = this.socket).emit.apply(_ref, [action].concat(__slice.call(args)));
      } else {
        return alert("Sorry, not connected to TextareaServer");
      }
    };
    return Connection;
  })();
  loadSocketIO();
}).call(this);
