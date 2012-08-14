// Created by Rudy Reeves
// popup.js

document.addEventListener("DOMContentLoaded", function() {
   popup.init();
});

function $(id) {return document.getElementById(id);}
function klass(n) {return document.getElementsByClassName(n);}

Array.prototype.append = function(e) {
   this.length++;
   this[this.length - 1] = e;
   return this;
};

Array.prototype.removeIndex = function(i) {
   for (var j = i; j+1 < this.length; j++)
      this[j] = this[j+1];
   this.length--;
   return this;
};

/*document.addEventListener("keydown", function(e) {
    switch (e.keyCode) {
    case 32: // pause
        break;
    case 37: // previous
        break;
    case 39: // next
        break;
    }
});*/

function onRequest(request, sender, sendResponse) {
   switch (request.action) {
   case "setStatus":
      if (!request.hasMusic) {
         for (var i = 0; i < popup.rows.length; i++)
            if (popup.rows[i].status.tabId == sender.tabId)
               popup.removeRow(i);
         var row = $("row" + i);
         if (row != null)
            row.style.display = "none";
         return;
      }
      request.tabId = sender.tab.id;
      var found = false;
      for (var i = 0; i < popup.rows.length; i++) {
         if (popup.rows[i].status.tabId == request.tabId && request.tabId != null) {
            if (!found) {
               popup.setStatus(i, request);
               found = true;
            } else popup.removeRow(i);
         }
      }
      break;
   case "setStatuses":
      popup.setStatuses(request.statuses);
      break;
   }
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
   onRequest(request, sender, sendResponse);
});

function getMuteButton() {
   var btn = klass("mute")[0];
   return (btn == null ? klass("muteDisabled")[0] : btn);
}

window.onunload = function() {popup.closePopup();};

var popup = {
   rows : [],
   init : function() {
      chrome.extension.sendRequest({action: "openPopup"}, function(response) {
         onRequest(response);
      });
      $("signature").addEventListener("click", function() {
         chrome.tabs.create({url: "http://tanis.webs.com/"});
      });
      getMuteButton().addEventListener("click", function() {
         if (this.getAttribute("disabled") != "1")
            popup.mute();
      });
   },
   closePopup : function() {
      chrome.extension.sendRequest({action: "closePopup"});
   },
   refresh : function() {
      chrome.extension.sendRequest({action: "refreshPopup"});
   },
   mute : function() {
      for (var i = 0; i < this.rows.length; i++)
         if (this.rows[i].status.isPlaying)
            chrome.extension.sendRequest({action: "sendRequest", cmd: "pause", row: i});
   },
   removeRow : function(i) {
      this.rows.removeIndex(i);
      var row = $("row" + i);
      if (row == null) return;
      row.style.display = "none";
      row.setAttribute("id", "");
   },
   setStatuses : function(statuses) {
      var found = false;
      for (var i = 0; i < statuses.length; i++) {
         var status = statuses[i];
         popup.addRow(status);
         if (status.songName != "" || status.artistName != "")
            found = true;
      }
      if (!found) {
         $("noTabsMsg").style.display = "inline";
         getMuteButton().style.display = "none";
      }
   },
   setStatus : function(i, status) {
      var row = this.rows[i];
      if (row == null) return;
      row.status = status;
      row.container.setAttribute("style", "");
      row.play.style.display = (status.isPlaying ? "none" : "inline");
      row.pause.style.display = (status.isPlaying ? "inline" : "none");
      row.next.setAttribute("disabled", status.hasNext ? "0" : "1");
      row.next.setAttribute("class", "next " + (status.hasNext ? "icon" : "iconDisabled"));
      row.previous.setAttribute("disabled", status.hasPrevious ? "0" : "1");
      row.previous.setAttribute("class", "previous " + (status.hasPrevious ? "icon" : "iconDisabled"));
      if (status.hasThumbUp) {
         row.thumbUp.setAttribute("class", "thumbUp icon" + (status.isThumbedUp ? " selected" : ""));
         row.thumbUp.setAttribute("disabled", "0");
         for (var j = 0; j < this.rows.length; j++)
            if (this.rows[j].thumbUp.style.display == "none" || j == i)
               this.rows[j].thumbUp.style.display = "inline";
      }
      if (status.hasThumbDown) {
         row.thumbDown.setAttribute("class", "thumbDown icon" + (status.isThumbedDown ? " selected" : ""));
         row.thumbDown.setAttribute("disabled", "0");
         for (var j = 0; j < this.rows.length; j++)
            if (this.rows[j].thumbDown.style.display == "none" || j == i)
               this.rows[j].thumbDown.style.display = "inline";
      }
      row.favorite.style.display = (status.hasFavorite && status.isFavorited ? "inline" : "none");
      var middle = ((status.songName != "" && status.artistName != "") ? " - " : "");
      row.label.innerText = status.songName + middle + status.artistName;
      if (row.label.innerText.replace(/\s/g, "").trim() == "") {
         row.container.style.display = "none";
         $("content").style.marginTop = "0px";
      } else {
         row.container.style.display = "inline";
         $("noTabsMsg").style.display = "none";
         getMuteButton().style.display = "inline";
         $("content").style.marginTop = "0px";
      }
      if (status.favicon != null && status.favicon != "") {
         row.label.style.background = "url('" + status.favicon + "') no-repeat left center";
         row.label.style.backgroundSize = "18px 18px";
      } else row.label.style.backgroundSize = "24px 24px";
      row.label.setAttribute("tabId", status.tabId);
      row.label.addEventListener("click", function() {
         chrome.tabs.update(parseInt(this.getAttribute("tabId")), {active: true});
      });
      var count = 0;
      for (var j = 0; j < this.rows.length; j++)
         if (this.rows[j].status.isPlaying)
            count++;
      var mute = getMuteButton();
      if (count > 0) {
         mute.setAttribute("class", "mute");
         mute.setAttribute("disabled", "0");
      } else {
         mute.setAttribute("class", "muteDisabled");
         mute.setAttribute("disabled", "1");
      }
      var maxLabelLength = 0;
      for (var i = 0; i < this.rows.length; i++) {
         var n = this.rows[i].label.innerText.length;
         if (n > maxLabelLength)
            maxLabelLength = n;
      }
      for (var i = 0; i < this.rows.length; i++)
         this.rows[i].label.style.width = (maxLabelLength + 4) + "ex";
   },
   addRow : function(status) {
      if ($("rows") == null)
         $("content").innerHTML = '<ol id="rows"></ol>';
      var row = document.createElement("li");
      row.setAttribute("id", "row" + this.rows.length);
      row.setAttribute("class", "row");
      var container = document.createElement("div");
      container.setAttribute("class", "container");
      container.setAttribute("style", "display: none");
      var divs = [];
      var order = ["label", "favorite", "thumbDown", "thumbUp", "previous", "play", "pause", "next"];
      for (var i = 0; i < order.length; i++) {
         divs.append(document.createElement("div"));
         divs[i].setAttribute("class", order[i]);
      }
      for (var i = 1; i < divs.length; i++) {
         var div = divs[i];
         div.setAttribute("row", this.rows.length);
         div.setAttribute("cmd", order[i]);
         if (order[i] == "thumbUp" || order[i] == "thumbDown") {
            divs[i].setAttribute("class", order[i] + " iconDisabled");
            divs[i].setAttribute("disabled", "1");
            divs[i].style.display = "none";
         } else div.setAttribute("class", order[i] + " icon");
         var filler = document.createElement("span");
         filler.setAttribute("class", "hidden");
         filler.innerText = "&nbsp;";
         div.appendChild(filler);
         divs[i].addEventListener("click", function() {
            if (this.getAttribute("disabled") != "1")
               chrome.extension.sendRequest({action: "sendRequest", cmd: this.getAttribute("cmd"), row: this.getAttribute("row")});
         });
      }
      for (var i = 0; i < divs.length; i++)
         container.appendChild(divs[i]);
      row.appendChild(container);
      document.adoptNode(row);
      $("rows").appendChild(row);
      row = {container:container};
      for (var i = 0; i < order.length; i++)
         row[order[i]] = divs[i];
      this.rows.append(row);
      this.setStatus(this.rows.length - 1, status);
   }
};