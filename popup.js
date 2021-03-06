$(function() {
    var HISTORY_SIZE = 20;

    // localStorage only works with strings, so ...
    Storage.prototype.setObject = function(key, value) {
        this.setItem(key, JSON.stringify(value));
    };
    Storage.prototype.getObject = function(key) {
        // some releases of chrome appear to have trouble with JSON.parse
        // on a null object - gives "Illegal Access" error
        var object = this.getItem(key);
        return object ? JSON.parse(object) : null;
    };
    if (!localStorage.getObject("history")) {
        localStorage.setObject("history", []);
    }

    var history = function(i) {
        var history = localStorage.getObject("history");
        // overwrite Array's push method to maintain history in localStorage
        history.push = function(code) {
            if (history.length === 0
                    || code !== history[history.length - 1]) {
                history[history.length] = code;
                if (history.length > HISTORY_SIZE) {
                    history = history.slice(-HISTORY_SIZE);
                }
                localStorage.setObject("history", history);
            }
        };
        return (i === undefined) ? history : history[i];
    };

    var historyIdx = history().length - 1;

    var excDivProps = function(html) {
      return {
        "class": "text exc-div",
        css: {
          width: html.width() - 2, height: 0,
        }
      };
    };

    var closeDivProps = function(excDiv) {
      return {
        "class": "close-div",
        html: "<< Hmmmmm, that didn't work.  Click here to close. >>",
        click: function(evt) {
          excDiv.animate({height: 0}, function() {excDiv.remove();});
        }
      };
    };

    var msgDivProps = function(exc) {
      return {
        "class": "msg-div",
        html: exc.name + ": " + exc.message
      };
    };

    var callback = function(exc) {
        if (exc) {
            var html = $("html");
            var excDiv = $("<div>", excDivProps(html)).appendTo(html);
            var closeDiv = $("<div>", closeDivProps(excDiv));
            var msgDiv = $("<div>", msgDivProps(exc));
            excDiv.append(closeDiv).append(msgDiv);
            excDiv.animate({height: html.height() - 2})
        }
    };

    var execute = function() {
        var code = $("#code").val();
        history().push(code);
        historyIdx = history().length - 1;
        chrome.extension.getBackgroundPage().execute(code, callback);
    };

    $("#code").keypress(function(evt) {
        if (evt.ctrlKey && (evt.keyCode === 10)) execute();
    });

    $("#run").click(function(evt) {execute();});

    $("#reload").click(function(evt) {
        chrome.extension.getBackgroundPage().reload();
    });

    $("#clear").click(function(evt) {
        $("#code").val("");
        $("#code").focus();
    });

    $("#close").click(function(evt) {window.close();});

    $("#code").val(history(historyIdx));

    $("#code").focus();

    $("#main").slideDown();

    var updateHistoryNav = function() {
        $("#prev").attr("disabled", (historyIdx <= 0));
        $("#next").attr("disabled", (historyIdx >= history().length - 1));
    };

    $("#prev").click(function(evt) {
        $("#code").val(history(--historyIdx));
        updateHistoryNav();
    });

    $("#next").click(function(evt) {
        $("#code").val(history(++historyIdx));
        updateHistoryNav();
    });

    updateHistoryNav();
});
