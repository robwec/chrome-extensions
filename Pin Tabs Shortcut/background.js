chrome.commands.onCommand.addListener(function(command) {
	if (command == "pin tab")
	{
		chrome.windows.getCurrent(function(window) {
			chrome.tabs.query({active: true, windowId: window.id}, function(tabs) {
				chrome.tabs.update(tabs[0].id, {
					pinned: !tabs[0].pinned
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