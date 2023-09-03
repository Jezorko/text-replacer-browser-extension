import {defaultConfiguration} from '../data/default_configuration.js';

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({configuration: defaultConfiguration});
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.url?.startsWith("chrome://")) return undefined;
    if (changeInfo.status === 'complete') {
        await chrome.scripting.insertCSS({
            files: ['styles/tooltip.css'],
            target: {tabId: tab.id}
        });
        chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                files: ['scripts/add_tooltips.js']
            }
        );
    }
});