chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.url?.startsWith("chrome://")) return undefined;
    await chrome.scripting.insertCSS({
        files: ['tooltip.css'],
        target: {tabId: tab.id}
    });
    if (changeInfo.status === 'complete') {
        await chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                files: ['test.js']
            }
        );
    }
});