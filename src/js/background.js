// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// clientId: "grwatcher2",
//     clientSecret: "FE01NYD4BRN89WADJCX4436MRWHQ",

var appGlobal = {
    feedlyApiClient: new FeedlyApiClient(),
    options: {
        accessToken: "",
        refreshToken: "",
        useSecureConnection: true
    },
    //Names of options after changes of which scheduler will be initialized
    criticalOptionNames: ["accessToken"],
    // criticalOptionNames: ["updateInterval", "accessToken", "showFullFeedContent", "openSiteOnIconClick", "maxNumberOfFeeds", "abilitySaveFeeds", "filters", "isFiltersEnabled", "showCounter", "oldestFeedsFirst", "resetCounterOnClick"],
    isLoggedIn: false,
    clientId: "sandbox",
    clientSecret: "A0SXFX54S3K0OC9GNCXG",
    // clientId: "grwatcher2",
    // clientSecret: "FE01NYD4BRN89WADJCX4436MRWHQ",
    tokenIsRefreshing: false
};

// Event handlers
chrome.runtime.onInstalled.addListener(function (details) {
    //Trying read old options (mostly access token) if possible
    readOptions(function () {
        //Write all options in chrome storage and initialize application
        writeOptions(initialize);
    });
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
    var callback;

    for (var optionName in changes) {
        if (appGlobal.criticalOptionNames.indexOf(optionName) !== -1) {
            callback = initialize;
            break;
        }
    }
    readOptions(callback);
});

chrome.runtime.onStartup.addListener(function () {
    readOptions(initialize);
});

chrome.runtime.onSuspendCanceled.addListener(function(){
    // Reload options when event page is reloaded
   readOptions(initialize);
});

chrome.extension.onMessage.addListener(function(request, sender) {
  if (request.msg == "feedIcon") {
    // First validate that all the URLs have the right schema.
    var input = [];
    for (var i = 0; i < request.feeds.length; ++i) {
      var a = document.createElement('a');
      a.href = request.feeds[i].href;
      if (a.protocol == "http:" || a.protocol == "https:") {
        input.push(request.feeds[i]);
      } else {
        console.log('Warning: feed source rejected (wrong protocol): ' +
                    request.feeds[i].href);
      }
    }

    if (input.length == 0)
      return;  // We've rejected all the input, so abort.

    // We have received a list of feed urls found on the page.
    var feeds = {};
    feeds[sender.tab.id] = input;
    chrome.storage.local.set(feeds, function() {
      // Enable the page action icon.
      chrome.pageAction.setTitle(
        { tabId: sender.tab.id,
          title: "Add feed to Feedly"
        });
      chrome.pageAction.show(sender.tab.id);
    });
  } //else if (request.msg == "feedDocument") {
    // var something = "something";
    // We received word from the content script that this document
    // is an RSS feed (not just a document linking to the feed).
    // So, we go straight to the subscribe page in a new tab and
    // navigate back on the current page (to get out of the xml page).
    // We don't want to navigate in-place because trying to go back
    // from the subscribe page takes us back to the xml page, which
    // will redirect to the subscribe page again (we don't support a
    // location.replace equivalant in the Tab navigation system).
    // chrome.tabs.executeScript(sender.tab.id,
    //     { code: "if (history.length > 1) " +
    //              "history.go(-1); else window.close();"
    //     });
    // var url = "subscribe.html?" + encodeURIComponent(request.href);
    // url = chrome.extension.getURL(url);
    // chrome.tabs.create({ url: url, index: sender.tab.index });
  // }
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  chrome.storage.local.remove(tabId.toString());
});


// UTILS

/* Initialization all parameters and run feeds check */
function initialize() {
    // if (appGlobal.options.openSiteOnIconClick) {
    //     chrome.browserAction.setPopup({popup: ""});
    // } else {
    //     chrome.browserAction.setPopup({popup: "popup.html"});
    // }
    appGlobal.feedlyApiClient.accessToken = appGlobal.options.accessToken;

    // startSchedule(appGlobal.options.updateInterval);
}

/* Runs authenticating a user process,
 * then read access token and stores in chrome.storage
 * This function is from FeedlyNotifier extension
 */
function getAccessToken() {
    var state = (new Date()).getTime();
    var url = appGlobal.feedlyApiClient.getMethodUrl("auth/auth", {
        response_type: "code",
        client_id: appGlobal.clientId,
        redirect_uri: "http://localhost",
        scope: "https://cloud.feedly.com/subscriptions",
        state: state
    }, appGlobal.options.useSecureConnection);
    console.log(url);

    chrome.tabs.create({url: url}, function (authorizationTab) {
        chrome.tabs.onUpdated.addListener(function processCode(tabId, information, tab) {

            var checkStateRegex = new RegExp("state=" + state);
            if (!checkStateRegex.test(information.url)) {
                return;
            }

            var codeParse = /code=(.+?)(?:&|$)/i;
            var matches = codeParse.exec(information.url);
            if (matches) {
                appGlobal.feedlyApiClient.request("auth/token", {
                    method: "POST",
                    useSecureConnection: appGlobal.options.useSecureConnection,
                    parameters: {
                        code: matches[1],
                        client_id: appGlobal.clientId,
                        client_secret: appGlobal.clientSecret,
                        redirect_uri: "http://localhost",
                        grant_type: "authorization_code"
                    },
                    onSuccess: function (response) {
                        chrome.storage.sync.set({
                            accessToken: response.access_token,
                            refreshToken: response.refresh_token,
                            feedlyUserId: response.id
                        }, function () {
                        });
                        chrome.tabs.onUpdated.removeListener(processCode);
                        chrome.tabs.update(authorizationTab.id, {url: chrome.extension.getURL("options/options.html")});
                    }
                });
            }
        });
    });
}

/* Tries refresh access token if possible */
// This function is from FeedlyNotifier extension
function refreshAccessToken(){
    if(!appGlobal.options.refreshToken) return;

    appGlobal.feedlyApiClient.request("auth/token", {
        method: "POST",
        useSecureConnection: appGlobal.options.useSecureConnection,
        parameters: {
            refresh_token: appGlobal.options.refreshToken,
            client_id: appGlobal.clientId,
            client_secret: appGlobal.clientSecret,
            grant_type: "refresh_token"
        },
        onSuccess: function (response) {
            chrome.storage.sync.set({
                accessToken: response.access_token,
                feedlyUserId: response.id
            }, function () {});
        },
        onComplete: function(){
            appGlobal.tokenIsRefreshing = false;
        }
    });
}

/* Writes all application options in chrome storage and runs callback after it */
// This function is from FeedlyNotifier extension
function writeOptions(callback) {
    var options = {};
    for (var option in appGlobal.options) {
        options[option] = appGlobal.options[option];
    }
    chrome.storage.sync.set(options, function () {
        if (typeof callback === "function") {
            callback();
        }
    });
}

/* Reads all options from chrome storage and runs callback after it */
// This function is from FeedlyNotifier extension
function readOptions(callback) {
    chrome.storage.sync.get(null, function (options) {
        for (var optionName in options) {
            if (typeof appGlobal.options[optionName] === "boolean") {
                appGlobal.options[optionName] = Boolean(options[optionName]);
            } else if (typeof appGlobal.options[optionName] === "number") {
                appGlobal.options[optionName] = Number(options[optionName]);
            } else {
                appGlobal.options[optionName] = options[optionName];
            }
        }
        if (typeof callback === "function") {
            callback();
        }
    });
}

/* Stops scheduler, sets badge as inactive and resets counter */
function setInactiveStatus() {
    // chrome.browserAction.setIcon({ path: appGlobal.icons.inactive }, function () {
    // });
    // chrome.browserAction.setBadgeText({ text: ""});
    // appGlobal.cachedFeeds = [];
    // appGlobal.isLoggedIn = false;
    // appGlobal.options.feedlyUserId = "";
    // stopSchedule();
}

/* Sets badge as active */
function setActiveStatus() {
    // chrome.browserAction.setIcon({ path: appGlobal.icons.default }, function () {
    // });
    appGlobal.isLoggedIn = true;
}

// This function is from FeedlyNotifier extension
function apiRequestWrapper(methodName, settings) {
    var onSuccess = settings.onSuccess;
    settings.onSuccess = function (response) {
        setActiveStatus();
        if (typeof onSuccess === "function") {
            onSuccess(response);
        }
    };

    var onAuthorizationRequired = settings.onAuthorizationRequired;

    settings.onAuthorizationRequired = function (accessToken) {
        if (appGlobal.isLoggedIn) {
            setInactiveStatus();
        }
        if (!appGlobal.tokenIsRefreshing){
            appGlobal.tokenIsRefreshing = true;
            refreshAccessToken();
        }
        if (typeof onAuthorizationRequired === "function") {
            onAuthorizationRequired(accessToken);
        }
    };

    appGlobal.feedlyApiClient.request(methodName, settings);
}
