// Created by Rudy Reeves
// background.html

window.onload = function(){background.refresh();}

Array.prototype.removeIndex = function(i) {
   for (var j = i; j < this.length - 1; j++)
      this[j] = this[j+1];
   this.length--;
   return this;
};

Array.prototype.insert = function(i, e) {
   this.length++;
   for (var j = this.length - 1; j > i; j--)
      this[j] = this[j-1];
   this[i] = e;
   return this;
};

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
   switch (request.action) {
   default:
      if (background[request.action] != null)
         background[request.action](request, sender);
      break;
   case "openPopup":
      background.sendCmd("refresh");
      sendResponse({action: "setStatuses", statuses:background.tabs});
      break;
   case "refreshPopup":
   case "closePopup":
      background.sendCmd("refresh");
      break;
   }
});

var background = {
   tabs : [],
   refresh : function() {
      this.sendCmd("getStatus");
      this.showNumMusicTabs();
   },
   sendRequest : function(request) {
      chrome.tabs.sendRequest(this.tabs[request.row].tabId, {action:request.cmd});
   },
   sendCmd : function(cmd) {
      for (var i = 0; i < this.tabs.length; i++)
         chrome.tabs.sendRequest(this.tabs[i].tabId, {action: cmd});
   },
   showNumMusicTabs : function() {
      var num = 0;
      for (var i = 0; i < this.tabs.length; i++)
         if (this.tabs[i].hasMusic && (this.tabs[i].songName != "" || this.tabs[i].artistName != "")) num++;
      var title = (num == 0 ? "No" : num) + " Music Tab" + (num == 1 ? "" : "s");
      chrome.browserAction.setTitle({title: title});
   },
   setStatus : function(request, sender) {
      if (!request.hasMusic) {
         for (var i = 0; i < this.tabs.length; i++)
            if (this.tabs[i].tabId == sender.tabId)
               this.tabs.removeIndex(i);
         return;
      }
      request.tabId = sender.tab.id;
      var index = this.tabs.length;
      for (var i = 0; i < this.tabs.length; i++) {
         if (this.tabs[i].tabId == request.tabId) {
            this.tabs.removeIndex(i);
            index = i;
            break;
         }
      }
      this.tabs.insert(index, request);
      this.showNumMusicTabs();
   }
};

chrome.tabs.onCreated.addListener(function(tab) {background.refresh();});
chrome.tabs.onDetached.addListener(function(tabId) {background.refresh();});
chrome.tabs.onAttached.addListener(function(tabId) {background.refresh();});
chrome.tabs.onUpdated.addListener(function(tabId) {background.refresh();});
chrome.tabs.onRemoved.addListener(function(tabId) {
   for (var i = 0; i < background.tabs.length; i++)
      if (background.tabs[i].tabId == tabId)
         background.tabs.removeIndex(i);
   background.refresh();
});