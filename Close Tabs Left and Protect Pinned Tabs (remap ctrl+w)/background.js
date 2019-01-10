//1. command gets active tab position.
//2. then, if the active tab is not pinned, it closes and the active tab becomes the next left tab (found with index-1)
	//exceptions: to-be-closed tab is first or last tab. don't move in these cases

chrome.commands.onCommand.addListener(function(command) {
	if (command == "close tab")
	{
		chrome.windows.getCurrent(function(window) {
			//console.log(window.id); //window.id: 28. top: 0. focused: true
			chrome.tabs.query({}, function(alltabs) {
				//console.log(alltabs); //each tab has a windowId
				var numtabs = alltabs.length;
				chrome.tabs.query({active: true, windowId: window.id}, function(tabs) {
					//console.log(tabs);
					if(!tabs[0].pinned)
					{
						if (tabs[0].index !== 0 && tabs[0].index !== numtabs-1)
						{
							chrome.tabs.query({index: tabs[0].index-1, windowId: window.id}, function(nexttabs) {
								//console.log("next tabs:", nexttabs);
								var nexttabid = nexttabs[0].id;
								//chrome.tabs.remove(tabs[0].id); //[][][]but if I use this instead, then it triggers the onactivated part twice (first by moving to the right tab, then by moving to the left tab; geez. I think race conditions is the better reality.
								chrome.tabs.update(nexttabid, {active: true}, function() {
									chrome.tabs.remove(tabs[0].id); //[][][]there's a race condition between another app. Does putting remove first fix it?
								});
							});
						}
						else
							chrome.tabs.remove(tabs[0].id);
					}
				});
			});
		});
	}
});