chrome.runtime.onMessage.addListener(function (msg, _, sendResponse) {
	switch (msg.text) {
		case 'get_tabs':
			chrome.tabs.getAllInWindow(
				tabs => sendResponse(JSON.stringify(tabs))
			);
			return true;
		case 'switch_tab':
			chrome.tabs.highlight({
				tabs: [ msg.index ]
			});
			break;
	}
});

