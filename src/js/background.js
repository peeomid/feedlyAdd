var MAJOR_VERSION = "0.4.2";
if(localStorage.getItem('version') === null ){
	chrome.tabs.create({'url': chrome.extension.getURL('options/thankyou.html')}, function(tab){});
	localStorage.setItem('version',MAJOR_VERSION);
}else{
	if (localStorage.getItem('version') != MAJOR_VERSION){
		localStorage.setItem('version',MAJOR_VERSION);
	}
}