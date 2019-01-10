chrome.commands.onCommand.addListener(function(command) {
	if (command == "mute active tab")
	{
		chrome.windows.getCurrent(function(window) {
			chrome.tabs.query({active: true, windowId: window.id}, function(tabs) {
				chrome.tabs.update(tabs[0].id, {muted: !tabs[0].mutedInfo.muted});
			});
		});
	}
});