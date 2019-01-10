chrome.commands.onCommand.addListener(function(command) {
	if (command == "dupe tab")
	{
		chrome.windows.getCurrent(function(window) {
			chrome.tabs.query({active: true, windowId: window.id}, function(tabs) {
				chrome.tabs.duplicate(tabs[0].id);
			});
		});
	}
	else
	{
		console.log('Command:', command);
		console.log("type of command:", typeof command); //string
	}
});