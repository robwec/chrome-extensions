function getUrl() {
	chrome.windows.getCurrent(function(window) {
		chrome.tabs.query({active:true, windowId:window.id}, function(tabs) {
			chrome.tabs.update(tabs[0].id, {
				"url": "chrome://bookmarks"
			});
		});
	});
}
getUrl();