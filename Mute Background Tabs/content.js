//MUTE TABS
//0. get mute status of all tabs
	//when a new tab is created, add its muted status to the dict
//1. when a tab is muted, update it's actual status in a dict
//2. soft-mute all tabs except the active tab, which gets its actual mute status from the dict
	//when tab is activated, mute all background tabs and change active tab status to the mute status in the dict
//[][][]this will consider everything muted when the window closes. to avoid that, I could store the actual states in a file instead of starting a new array. Instead, I'll just add a toggle for tracking status and turn it off, so that tabs always become unmuted when active.

var tabmutedstatuses = {};
var alwaysunmuteactivatedtab = false;
	//[][][]set this variable to true to always unmute the activated tab. Otherwise, it will remember whether a tab was previously manually muted, when it is once again activated.
	//[][][]the right way to do this would be to track tab muted status between sessions. I'll just let it assume each tab should be unmuted when active;

document.addEventListener('DOMContentLoaded', function() {
	//console.log("hi");
	getTabMutedStatuses_andMuteBackgroundTabs();
});

function getTabMutedStatuses_andMuteBackgroundTabs()
{
	chrome.tabs.query({}, function(tabs) {
		for (i=0;i<tabs.length;i++)
			tabmutedstatuses[tabs[i].id] = tabs[i].mutedInfo.muted;
		chrome.tabs.query({active: false}, function(tabstomute) {
			for (i=0;i<tabstomute.length;i++)
			{
				//console.log("muting background tab...",tabstomute[i])
				chrome.tabs.update(tabstomute[i].id, {muted: true});
			}
			//console.log(tabstomute);
			//console.log(tabmutedstatuses);
		});
	});
}
function getTabMutedStatuses()
{
	chrome.tabs.query({}, function(tabs) {
		for (i=0;i<tabs.length;i++)
			tabmutedstatuses[tabs[i].id] = tabs[i].mutedInfo.muted;
	});
}
function muteBackgroundTabs()
{
	chrome.tabs.query({active: false}, function(tabstomute) {
		for (i=0;i<tabstomute.length;i++)
		{
			//console.log("muting background tab...")
			chrome.tabs.update(tabstomute[i].id, {muted: true});
		}
	});
}
		//chrome.tabs.update(tabId, {muted: tabmutedstatuses[tabId]} function(tabtoset) {
//update muted status when a tab is muted outside of this extension
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	//console.log("tab updated, here's change info:", changeInfo);
	if (changeInfo.hasOwnProperty("mutedInfo"))
	{
		if (changeInfo.mutedInfo.reason !== "extension")
		{
			//console.log("updating muted status for tab muted by load or user");
			tabmutedstatuses[tabId] = tab.mutedInfo.muted;
		}
		else if (changeInfo.mutedInfo.hasOwnProperty("extensionId"))
		{
			if (changeInfo.mutedInfo.extensionId !== chrome.runtime.id)
			{
				//console.log("updating muted status for tab muted/unmuted outside of this extension");
				tabmutedstatuses[tabId] = tab.mutedInfo.muted;
			}
		}
	}
});

//detect when active tab changes and update muting. reset muting of active tab, and mute all inactive tabs.
chrome.tabs.onActivated.addListener(function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function (tab) {
		chrome.tabs.update(tab.id, {muted: (!alwaysunmuteactivatedtab && tabmutedstatuses[tab.id])}, function (tabtomute) {
			//if (!(!alwaysunmuteactivatedtab && tabmutedstatuses[tab.id]))
				//console.log("unmuting active tab");
			//console.log("active tab changed. resetting its mute status:", tabtomute);
			muteBackgroundTabs();
		});
	});
});

//add new tabs to the tab muted statuses list, defaulting with true.
chrome.tabs.onCreated.addListener(function(tab) {
	//console.log("new tab created. updating its mute status...");
	tabmutedstatuses[tab.id] = tab.mutedInfo.muted;
	chrome.tabs.update (tab.id, {muted: !tab.active});
});