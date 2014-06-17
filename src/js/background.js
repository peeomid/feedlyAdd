var MAJOR_VERSION = "0.4.2";
if(localStorage.getItem('version') === null ){
	chrome.tabs.create({'url': chrome.extension.getURL('options/thankyou.html')}, function(tab){});
	localStorage.setItem('version',MAJOR_VERSION);
}else{
	if (localStorage.getItem('version') != MAJOR_VERSION){
		localStorage.setItem('version',MAJOR_VERSION);
	}
}
var FEED_HREF = '';
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.status == "complete") {
		chrome.tabs.executeScript(tab.id, {file: "js/bookmarklet.js"});     
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