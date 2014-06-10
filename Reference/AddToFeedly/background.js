var FEED_HREF = '';
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.status == "complete") {
		chrome.tabs.executeScript(tab.id, {file: "bookmarklet.js"});     
	 	chrome.pageAction.hide(tabId);   	 
	 	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		  chrome.tabs.sendMessage(tabs[0].id, {greeting: "RSS"}, function(response) {
		    if(response && response.ResRSS == "true"){
				chrome.pageAction.show(tabId);  
				FEED_HREF = 'http://www.feedly.com/home#subscription/feed/'+ response.href;
				chrome.pageAction.onClicked.addListener(function(tab){      
					      
				  chrome.tabs.sendMessage(tabs[0].id, {FEED_HREF:FEED_HREF}, function(response) {
				  });
			      
			    });
		     }
		  });
		}); 
   } 
});