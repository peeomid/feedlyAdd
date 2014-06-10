chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
	h='';
    if (request.greeting == "RSS") {
		void(g=false);void(d=document);
		void(el=d.getElementsByTagName('link'));
		for(i=0;i<el.length;i++){
			href=el[i].getAttribute('href');
			rel=el[i].getAttribute('rel');
			if(rel.indexOf('alternate')!=-1) {
				ty=el[i].getAttribute('type');
				if((ty.indexOf('application/rss+xml')!=-1||ty.indexOf('text/xml')!=-1||ty.indexOf('application/atom+xml')!=-1) && href.indexOf('comments')==-1){
					g=true;
					h=el[i].href;
				}
			}
		};
		if(!g){
			void(el=d.getElementsByTagName('a'));
			for(i=0;i<el.length;i++){
				href=el[i].getAttribute('href');
				if(href) {
					if((href.indexOf('/feed')!=-1) && (href.indexOf('comments')==-1) && (href.indexOf('mailverify')==-1)){
						g=true;
						h=el[i].href;
					}
				}
			}
			if(!g){
				sendResponse({ResRSS: "false"});
			}
			else
			{
				sendResponse({ResRSS: "true", href:h});
			}
		}else{
			sendResponse({ResRSS: "true", href:h});
		};
    }
    if (request.FEED_HREF ){
	    void(location.href=request.FEED_HREF);	
    }
});