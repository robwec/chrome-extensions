chrome.commands.onCommand.addListener(function(command) {
	if (command == "shift tab left")
	{
		chrome.windows.getCurrent(function(window) {
			chrome.tabs.query({active: true, windowId:window.id}, function(tabs) {
				chrome.tabs.get(tabs[0].id, function(tab) {
					if (tab.index > 0 && tab.index !== firstunpinnedtabindex)
						chrome.tabs.move(tab.id, {index: tab.index - 1});
				});
			});
		});
	}
	else if (command == "shift tab right")
	{
		//console.log(numtabs);
		//console.log(lastpinnedtabindex);
		//console.log(firstunpinnedtabindex);
		chrome.windows.getCurrent(function(window) {
			chrome.tabs.query({active: true, windowId:window.id}, function(tabs) {
				chrome.tabs.get(tabs[0].id, function(tab) {
					//console.log(tab);
					if (tab.index < numtabs-1 && tab.index !== lastpinnedtabindex[window.id])
						chrome.tabs.move(tab.id, {index: tab.index + 1});
				});
			});
		});
	}
	else
	{
		console.log('Command:', command);
		console.log("type of command:", typeof command); //string
	}
});
var numtabs = -1;
var lastpinnedtabindex = -1;
var firstunpinnedtabindex = -1;

//shift tab right
	//is tab pinned?
		//if yes, then is it the last pinned tab?
			//if yes, then do nothing
			//otherwise shift one position to the right
		//if no, is it the last tab?
			//if it is the last tab, then do nothing.
			//otherwise shift one position to the right
//shift tab one position to the right unless it's the last tab or the last pinned tab

//shift tab left
//shift tab one position to the left unless it's the first tab or the first unpinned tab
function updateNumberOfTabs()
{
	chrome.tabs.query({}, function(tabs) {
		numtabs = tabs.length;
	});
}
function updateLastPinnedTabIndex()
{
	chrome.windows.getCurrent(function(window) {
		chrome.tabs.query({pinned:true, windowId:window.id}, function(pinnedtabs) {
			for (i=0;i<pinnedtabs.length;i++)
				lastpinnedtabindex[window.id] = Math.max(lastpinnedtabindex[window.id],pinnedtabs[i].index);
		});
	});
}
function updateFirstUnpinnedTabIndex()
{
	chrome.windows.getCurrent(function(window) {
		chrome.tabs.query({pinned:false, windowId:window.id}, function(unpinnedtabs) {
			for (i=0;i<unpinnedtabs.length;i++)
			{
				if (firstunpinnedtabindex[window.id] == -1)
					firstunpinnedtabindex[window.id] = unpinnedtabs[i].index;
				firstunpinnedtabindex[window.id] = Math.min(firstunpinnedtabindex[window.id],unpinnedtabs[i].index);
			}
		});
	});
}
document.addEventListener('DOMContentLoaded', function() {
	updateNumberOfTabs();
	updateLastPinnedTabIndex();
	updateFirstUnpinnedTabIndex();
});
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	//console.log(changeInfo.hasOwnProperty("pinned"));
	if (changeInfo.hasOwnProperty("pinned"))
	{
		if (changeInfo.pinned == true)
		{
			lastpinnedtabindex[tab.windowId] += 1;
			firstunpinnedtabindex[tab.windowId] += 1;
		}
		else
		{
			lastpinnedtabindex[tab.windowId] -= 1;
			firstunpinnedtabindex[tab.windowId] -= 1;
		}
	}
});
chrome.tabs.onRemoved.addListener(function() {
	updateNumberOfTabs();
	updateLastPinnedTabIndex();
	updateFirstUnpinnedTabIndex();
});
chrome.tabs.onCreated.addListener(function() {
	updateNumberOfTabs();
	updateLastPinnedTabIndex();
	updateFirstUnpinnedTabIndex();
});