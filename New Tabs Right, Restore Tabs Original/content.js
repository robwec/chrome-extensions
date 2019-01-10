//Track closed tab ids and positions.
	//when a tab is restored, restore it in its original position, then remove its entry from the closed tab list
		//to check if a tab was restored: when a tab is created, check if its id is the same as the latest closed tabs's id
	//when a tab is created, increment by 1 all positions of closed tabs that are to the right of that tab (greater than or equal to index to the new tab). Don't increment this way when a tab is restored.
//[][][]lazy: this won't remember tab positions between sessions. that's fine with me; they'll just open to the right. Could store tab info in a file if I wanted that.
//hm. the restored tab doesn't have the same tab id as when it was deleted. Is there another way to check if a tab was restored?
//2017-02-12-1136-01 added window tracking

/*
"permissions": [
    "tabs",
    "windows",
    "sessions",
    "commands"
  ],
  "commands": {
    "debug": {
      "suggested_key": {
        "default": "Ctrl+Shift+Z"
      },
      "description": "debug"
    }
  }
chrome.commands.onCommand.addListener(function(command) {
	if (command == "debug")
	{
		//console.log(tabdeletehistory[tabdeletehistory.length-1], "tab delete history");
		console.log(tabdeletehistory, "tab delete history");
		console.log(currentid, "currentid");
		console.log(lastid, "lastid");
		console.log(windowcreatedorrestored_activated);
		console.log(windowcreatedorrestored_created);
	}
});
*/

var mytabs = {}; //have to track tab information and last active tab, because—guess what!?—the only way to tell a tab has been closed removes its information from the tab list. So I have to get it from my tracked data.
var currentid = {};
var lastid = {};
var lasttabcount = 1;
var tabdeletehistory = []; //track indices of deleted tabs. index:int, and sessionId:string
	//2017-02-12-0734-16 also have to track windowId
	//and have to push closed window sessions. That allows us to do nothing when a window is restored instead of a tab
var windowcreatedorrestored_activated = false;
var windowcreatedorrestored_created = false;

function updateTabData()
{
	chrome.tabs.query({}, function(tabs) {
		mytabs = {};
		for (i=0;i<tabs.length;i++)
		{
			mytabs[tabs[i].id] = tabs[i];
		}
	});
}
function updateTabCount()
{
	chrome.tabs.query( {}, function(tabs) {
		lasttabcount = tabs.length;
	});
}
function updateLastTabIds(currenttabid, windowid)
{
	lastid[windowid] = currentid[windowid];
	currentid[windowid] = currenttabid;
}
function updateClosedTabPositions_toRightOfNewTab_inSameWindow(tabid, mywindowid)
{
	//get current index of tab with id, THEN update positions
	chrome.tabs.get(tabid, function(tab) {
		for (i=0;i<tabdeletehistory.length;i++)
			if (tabdeletehistory[i].windowId == mywindowid && tabdeletehistory[i].index >= tab.index)
				tabdeletehistory[i].index = tabdeletehistory[i].index+1;
	});
}

document.addEventListener('DOMContentLoaded', function() {
	console.log("hi");
	chrome.windows.getAll(function (windowlist) {
		chrome.tabs.query({active: true}, function(tabs) {
			for (i=0;i<tabs.length;i++)
			{
				currentid[tabs[i].windowId] = tabs[i].id;
				lastid[tabs[i].windowId] = tabs[i].id;
			}
		});
	});
	updateTabCount();
	updateTabData();
});

function dictIsEmpty(obj) {
  return Object.keys(obj).length === 0;
}
chrome.tabs.onCreated.addListener(function(tab) {
	//console.log("tab was created!",tab);
	if (windowcreatedorrestored_created)
	{
		//console.log("created or restored a window. do nothing with tabs.");
		windowcreatedorrestored_created = false;
		updateTabData();
		return;
	}
	else
	{
		chrome.sessions.getRecentlyClosed(function(sessions) {
			//console.log(sessions[0],"sessions[0]");
			if (!dictIsEmpty(tabdeletehistory) && (tabdeletehistory[tabdeletehistory.length-1].sessionId !== sessions[0].tab.sessionId)) //detect restoring tab[][][]I really want to get the first restored tab, because sessions contains both tabs and windows.
			{
				chrome.tabs.get(tab.id, function(posttab) {
					chrome.tabs.move(posttab.id, {index: tabdeletehistory[tabdeletehistory.length-1].index}, function(movingtab) {
						chrome.tabs.get(currentid[posttab.windowId], function(hosttab) {
							if (!hosttab.active) //this is how to account for ctrl-clicking a link vs new tab. new tab automatically switches.
								updateLastTabIds(posttab.id,posttab.windowId);
							updateTabData();
							updateTabCount();
							tabdeletehistory.pop();
							//updateClosedTabPositions_toRightOfNewTab(tab.id); //[][][]
						});
					});
				});
			}
			else
			{
				move_createdTab_andUpdateData(tab);
			}
		});
	}
});
function move_createdTab_andUpdateData(tab)
{
	//console.log("tab in move_createdTab",tab);
	var moveindex = -1;
	if(!mytabs[currentid[tab.windowId]].pinned)
		moveindex = mytabs[currentid[tab.windowId]].index + 1;
	else
		var pinnedtabcase = true;
	chrome.windows.getCurrent(function (window) {
		chrome.tabs.query({pinned:true, windowId:window.id}, function(pinnedtabs) {
			if (pinnedtabcase)
			{
				var lastpinnedtabindex = 0;
				for (i=0;i<pinnedtabs.length;i++)
					lastpinnedtabindex = Math.max(lastpinnedtabindex,pinnedtabs[i].index);
				moveindex = lastpinnedtabindex + 1;
			}
			chrome.tabs.get(tab.id, function(tab) {
				chrome.tabs.move(tab.id, {index: moveindex}, function (tab) {
					chrome.tabs.get(currentid[tab.windowId], function(hosttab) {
						if (!hosttab.active) //this is how to account for ctrl-clicking a link vs new tab. new tab automatically switches.
							updateLastTabIds(tab.id,tab.windowId);
						updateTabData();
						updateTabCount();
						updateClosedTabPositions_toRightOfNewTab_inSameWindow(tab.id,tab.windowId);
					});
				});
			});
		});
	});
}

// detect when a tab was closed. that usually happens when a tab is activated AND there are now fewer tabs than previously
	//2017-02-12-1024-21 this doesn't detect when a window is closed. there's a (thankfully more accurate) listener for that
chrome.tabs.onActivated.addListener(function(activeInfo) {
	//console.log("tab was activated!",activeInfo);
	setTimeout(function() {
		chrome.tabs.get(activeInfo.tabId, function(tab) {
			//console.log(tab);
			//console.log(currentid[tab.windowId]);
			
			if (windowcreatedorrestored_activated)
			{
				//console.log("window was restored or created. do nothing with tabs.");
				currentid[tab.windowId] = tab.id;
				lastid[tab.windowId] = tab.id;
				windowcreatedorrestored_activated = false;
				updateTabData();
				return;
			}
			chrome.tabs.query({},function(tabs) {
				if (tabs.length < lasttabcount) //tricky! a tab was closed
				{
					fakeOnRemovedHandler(); //onremoved sucks :-/
				}
				else if (tabs.length == lasttabcount)
				{
					//console.log("tab switched.");
					updateLastTabIds(activeInfo.tabId,activeInfo.windowId);
					updateTabData();
					updateTabCount();
				}
				else if (tabs.length > lasttabcount)
				{
					//console.log("tab created. only update tabids if the created tab is now the active tab");
					chrome.tabs.get(currentid[activeInfo.windowId], function(lastknowncurrenttab) {
						if (!lastknowncurrenttab.active)
							updateLastTabIds(activeInfo.tabId,activeInfo.windowId);
						updateTabData();
						updateTabCount();
					});
				}
			});
		});
	}, 50); //So guess what. There was a race condition between this and another app that switches active tab then deletes the previous active tab. Sometimes this app requests the tabs after the switch but before the delete. I have no idea how to wait for the other app to finish; this small timeout does work though. I want to use tabs.onRemoved; however, that doesn't always trigger; wtf!? you had one job.
	//when it opens in the wrong position, that's because the tab took
});
function fakeOnRemovedHandler()
{
	//console.log("tab closed");
	chrome.sessions.getRecentlyClosed(function(sessions) {
		chrome.windows.getCurrent(function (window) {
			var newdeletedentry = {};
			//console.log("this is sessions[0], the just closed tab",sessions[0]);
			newdeletedentry.index = mytabs[currentid[window.id]].index;
			newdeletedentry.sessionId = sessions[0].tab.sessionId;
			newdeletedentry.windowId = window.id;
			tabdeletehistory.push(newdeletedentry);
			//console.log(newdeletedentry,"is the new deleted entry");
			chrome.tabs.query({active: true, windowId: window.id}, function(tabsreally) {
				//[][][]can I do a better update than this? What if I click a tab to close?
				updateLastTabIds(tabsreally[0].id,tabsreally[0].windowId);
				updateLastTabIds(tabsreally[0].id,tabsreally[0].windowId);
				updateTabData();
				updateTabCount();
			});
		});
	});
}
chrome.windows.onRemoved.addListener(function (windowId) {
	//console.log("window closed", windowId);
	windowcreatedorrestored_activated = false;
	windowcreatedorrestored_created = false;
	updateTabData();
});
chrome.windows.onCreated.addListener(function(window)
{
	//console.log("window created",window);
	windowcreatedorrestored_activated = true;
	windowcreatedorrestored_created = true;
	updateTabData();
});
/*
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	console.log("tab updated!",changeInfo);
	//fakeOnRemovedHandler();
});
chrome.tabs.onRemoved.addListener(function() {
	console.log("tab removed!");
	//fakeOnRemovedHandler();
});
//why do you suck, onremoved?
*/

chrome.tabs.onMoved.addListener(function() {
	//console.log("a tab moved! updating tab data and count (just in case)...");
	updateTabData();
	updateTabCount();
});