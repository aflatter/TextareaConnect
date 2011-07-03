window.onload = ->

  # Load previous settings
  for key, value of localStorage
    $("##{key}").val(value)

  bkg = chrome.extension.getBackgroundPage()

  $("#save").click ->
  $(".setting").each ->
    el = $(this)
    name  = el.attr("id")
    value = el.val()

    localStorage[name] = value
    bkg.connection?[name] = value

  bkg.connection?.initSocket()

  return this
