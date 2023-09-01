chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.url?.startsWith("chrome://")) return undefined;
    if (changeInfo.status === 'loading') {
        await chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                files: ['test.js']
            }
        );
    }
});