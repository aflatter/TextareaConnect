localStorage.url = 'http://localhost:32942'

window.connection = null

loadSocketIO = ->
  clearTimeout loadSocketIO.timer
  scriptUrl = "#{localStorage.url}/socket.io/socket.io.js"
  console.log "trying to get io from #{scriptUrl}"
  if not window.io
    jQuery.getScript scriptUrl , ->
      window.connection = new Connection(localStorage.url)
      initExtension()
      clearTimeout loadSocketIO.timer

    # TODO: Real error handling with real ajax calls
    loadSocketIO.timer = setTimeout loadSocketIO, 500
  else
    console.log "we aleready have io"

initExtension = ->

  chrome.contextMenus.removeAll ->
    chrome.contextMenus.create
      title: "Edit in external editor"
      contexts: ["editable",]
      onclick: ( onClickData, tab ) ->
        chrome.tabs.sendRequest tab.id, action: "edittextarea", onClickData: onClickData


  chrome.extension.onConnect.addListener (port) ->
    if port.name isnt "textareapipe"
      return

    port.onMessage.addListener (msg)  ->
      connection.pageActions[msg.action](port, msg)

showTempNotification = (msg) ->

  notification = webkitNotifications.createNotification "icon.png", 'TextareaConnect', msg

  notification.show()
  setTimeout ->
    notification.cancel()
  , 3000

class Connection

  isConnected: false

  constructor: (@url) ->
    @ports = {}
    @socket = null
    @pageActions =
      open: (port, msg) =>
        @ports[msg.uuid] = port
        msg.type = msg.type or "txt"
        @send 'open', msg

      delete: (port, msg) =>
        for uuid in msg.uuids
          delete @ports[uuid]
        @send 'delete', msg

    @initSocket()

  initSocket: ->
    console.log "creating new socket #{@url}"

    @socket?.disconnect()

    @socket = io.connect(@url)

    @socket.on "message", (msg) =>
      obj = JSON.parse msg
      port = @ports[obj.uuid]
      port.postMessage obj


    @socket.on "connect", =>
      @isConnected = true
      console.log(this)
      showTempNotification "Connected to TextareaServer at #{@url}"

    @socket.on "disconnect", =>
      @isConnected = false
      console.log "Disconnected..."
      showTempNotification "Disconnected from TextareaServer at #{@url}"

    @socket.on "reconnect", =>
      console.log("Reconnecting...")

    @socket

  send: (action, args...) ->
    if @isConnected
      @socket.emit action, args...
    else
      alert "Sorry, not connected to TextareaServer"

loadSocketIO()
