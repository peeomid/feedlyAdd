"use strict";

function initialize() {
    appGlobal.options.openSiteOnIconClick ? chrome.browserAction.setPopup({
        popup: ""
    }) : chrome.browserAction.setPopup({
        popup: "popup.html"
    }), appGlobal.feedlyApiClient.accessToken = appGlobal.options.accessToken, startSchedule(appGlobal.options.updateInterval)
}

function startSchedule(a) {
    stopSchedule(), updateCounter(), updateFeeds(), appGlobal.options.showCounter && appGlobal.intervalIds.push(setInterval(updateCounter, 6e4 * a)), (appGlobal.options.showDesktopNotifications || !appGlobal.options.openSiteOnIconClick) && appGlobal.intervalIds.push(setInterval(updateFeeds, 6e4 * a))
}

function stopSchedule() {
    appGlobal.intervalIds.forEach(function (a) {
        clearInterval(a)
    }), appGlobal.intervalIds = []
}

function sendDesktopNotification(a) {
    var b = [];
    if (a.length > appGlobal.options.maxNotificationsCount) {
        var c = a.length === appGlobal.options.maxNumberOfFeeds ? chrome.i18n.getMessage("many") : a.length.toString(),
            d = new Notification(chrome.i18n.getMessage("NewFeeds"), {
                body: chrome.i18n.getMessage("YouHaveNewFeeds", c),
                icon: appGlobal.icons.defaultBig
            });
        b.push(d)
    } else
        for (var e = 0; e < a.length; e++) d = new Notification(a[e].blog, {
            body: a[e].title,
            icon: a[e].blogIcon
        }), d.url = a[e].url, d.feedId = a[e].id, d.onclick = function (a) {
            var b = a.target;
            b.close(), openUrlInNewTab(b.url, !0), appGlobal.options.markReadOnClick && markAsRead([b.feedId])
        }, b.push(d);
    appGlobal.options.hideNotificationDelay > 0 && setTimeout(function () {
        for (e = 0; e < b.length; e++) b[e].close()
    }, 1e3 * appGlobal.options.hideNotificationDelay)
}

function openUrlInNewTab(a, b) {
    chrome.windows.getAll({}, function (c) {
        c.length < 1 ? chrome.windows.create({
            focused: !0
        }, function () {
            chrome.tabs.create({
                url: a,
                active: b
            }, function () {})
        }) : chrome.tabs.create({
            url: a,
            active: b
        }, function () {})
    })
}

function openFeedlyTab() {
    chrome.tabs.query({
        url: appGlobal.feedlyUrl + "/*"
    }, function (a) {
        a.length < 1 ? chrome.tabs.create({
            url: appGlobal.feedlyUrl
        }) : (chrome.tabs.update(a[0].id, {
            active: !0
        }), chrome.tabs.reload(a[0].id))
    })
}

function removeFeedFromCache(a) {
    for (var b, c = 0; c < appGlobal.cachedFeeds.length; c++)
        if (appGlobal.cachedFeeds[c].id === a) {
            b = c;
            break
        }
    void 0 !== b && appGlobal.cachedFeeds.splice(b, 1)
}

function filterByNewFeeds(a, b) {
    chrome.storage.local.get("lastFeedTimeTicks", function (c) {
        var d;
        d = c.lastFeedTimeTicks ? new Date(c.lastFeedTimeTicks) : new Date(1971, 0, 1);
        for (var e = [], f = d, g = 0; g < a.length; g++) a[g].date > d && (e.push(a[g]), a[g].date > f && (f = a[g].date));
        chrome.storage.local.set({
            lastFeedTimeTicks: f.getTime()
        }, function () {
            "function" == typeof b && b(e)
        })
    })
}

function resetCounter() {
    setBadgeCounter(0), chrome.storage.local.set({
        lastCounterResetTime: (new Date).getTime()
    })
}

function updateSavedFeeds(a) {
    apiRequestWrapper("streams/" + encodeURIComponent(appGlobal.savedGroup) + "/contents", {
        onSuccess: function (b) {
            appGlobal.cachedSavedFeeds = parseFeeds(b), "function" == typeof a && a()
        }
    })
}

function setBadgeCounter(a) {
    appGlobal.options.showCounter ? chrome.browserAction.setBadgeText({
        text: String(+a > 0 ? a : "")
    }) : chrome.browserAction.setBadgeText({
        text: ""
    })
}

function updateCounter() {
    function a(a) {
        apiRequestWrapper("markers/counts", {
            parameters: a,
            onSuccess: function (a) {
                var b = a.unreadcounts,
                    c = 0;
                if (appGlobal.options.isFiltersEnabled) apiRequestWrapper("subscriptions", {
                    onSuccess: function (a) {
                        b.forEach(function (a) {
                            -1 !== appGlobal.options.filters.indexOf(a.id) && (c += a.count)
                        }), a.forEach(function (a) {
                            var d = 0;
                            if (a.categories.forEach(function (a) {
                                -1 !== appGlobal.options.filters.indexOf(a.id) && d++
                            }), d > 1)
                                for (var e = 0; e < b.length; e++)
                                    if (a.id === b[e].id) {
                                        c -= b[e].count * --d;
                                        break
                                    }
                        }), setBadgeCounter(c)
                    }
                });
                else {
                    for (var d = 0; d < b.length; d++)
                        if (appGlobal.globalGroup === b[d].id) {
                            c = b[d].count;
                            break
                        }
                    setBadgeCounter(c)
                }
            }
        })
    }
    appGlobal.options.resetCounterOnClick ? chrome.storage.local.get("lastCounterResetTime", function (b) {
        if (b.lastCounterResetTime) var c = {
            newerThan: b.lastCounterResetTime
        };
        a(c)
    }) : (chrome.storage.local.set({
        lastCounterResetTime: new Date(0).getTime()
    }), a())
}

function updateFeeds(a, b) {
    appGlobal.cachedFeeds = [], appGlobal.options.filters = appGlobal.options.filters || [];
    for (var c = appGlobal.options.isFiltersEnabled && appGlobal.options.filters.length ? appGlobal.options.filters : [appGlobal.globalGroup], d = c.length, e = 0; e < c.length; e++) apiRequestWrapper("streams/" + encodeURIComponent(c[e]) + "/contents", {
        parameters: {
            unreadOnly: !0,
            count: appGlobal.options.maxNumberOfFeeds,
            ranked: appGlobal.options.oldestFeedsFirst ? "oldest" : "newest"
        },
        onSuccess: function (a) {
            d--, appGlobal.cachedFeeds = appGlobal.cachedFeeds.concat(parseFeeds(a)), 1 > d && (appGlobal.cachedFeeds = appGlobal.cachedFeeds.filter(function (a, b, c) {
                for (var d = ++b; d < c.length; d++)
                    if (c[d].id == a.id) return !1;
                return !0
            }), appGlobal.cachedFeeds = appGlobal.cachedFeeds.sort(function (a, b) {
                return a.date > b.date ? appGlobal.options.oldestFeedsFirst ? 1 : -1 : a.date < b.date ? appGlobal.options.oldestFeedsFirst ? -1 : 1 : 0
            }), appGlobal.cachedFeeds = appGlobal.cachedFeeds.splice(0, appGlobal.options.maxNumberOfFeeds), filterByNewFeeds(appGlobal.cachedFeeds, function (a) {
                appGlobal.options.showDesktopNotifications && !b && sendDesktopNotification(a)
            }))
        },
        onComplete: function () {
            "function" == typeof a && a()
        }
    })
}

function setInactiveStatus() {
    chrome.browserAction.setIcon({
        path: appGlobal.icons.inactive
    }, function () {}), chrome.browserAction.setBadgeText({
        text: ""
    }), appGlobal.cachedFeeds = [], appGlobal.isLoggedIn = !1, appGlobal.options.feedlyUserId = "", stopSchedule()
}

function setActiveStatus() {
    chrome.browserAction.setIcon({
        path: appGlobal.icons.default
    }, function () {}), appGlobal.isLoggedIn = !0
}

function parseFeeds(a) {
    var b = a.items.map(function (a) {
        var b;
        try {
            b = a.origin.htmlUrl.match(/http(?:s)?:\/\/[^/]+/i).pop()
        } catch (c) {
            b = "#"
        }
        var d, e;
        appGlobal.options.showFullFeedContent && void 0 !== a.content && (d = a.content.content, e = a.content.direction), d || void 0 !== a.summary && (d = a.summary.content, e = a.summary.direction);
        var f, g;
        a.title && (-1 !== a.title.indexOf("direction:rtl") ? (f = a.title.replace(/<\/?div.*?>/gi, ""), g = "rtl") : f = a.title);
        var h;
        if (a.tags)
            for (var i = 0; i < a.tags.length; i++)
                if (-1 !== a.tags[i].id.search(/global\.saved$/i)) {
                    h = !0;
                    break
                }
        var j, k;
        a.origin && a.origin.title && (-1 !== a.origin.title.indexOf("direction:rtl") ? (j = a.origin.title.replace(/<\/?div.*?>/gi, ""), k = "rtl") : j = a.origin.title);
        var l = [];
        return a.categories && (l = a.categories.map(function (a) {
            return {
                id: a.id,
                encodedId: encodeURI(a.id),
                label: a.label
            }
        })), {
            title: f,
            titleDirection: g,
            url: a.alternate ? a.alternate[0] ? a.alternate[0].href : "" : "",
            blog: j,
            blogTitleDirection: k,
            blogUrl: b,
            blogIcon: "https://www.google.com/s2/favicons?domain=" + b + "&alt=feed",
            id: a.id,
            content: d,
            contentDirection: e,
            isoDate: a.crawled ? new Date(a.crawled).toISOString() : "",
            date: a.crawled ? new Date(a.crawled) : "",
            isSaved: h,
            categories: l
        }
    });
    return b
}

function getFeeds(a, b) {
    appGlobal.cachedFeeds.length > 0 && !a ? b(appGlobal.cachedFeeds.slice(0), appGlobal.isLoggedIn) : updateFeeds(function () {
        b(appGlobal.cachedFeeds.slice(0), appGlobal.isLoggedIn)
    }, !0)
}

function getSavedFeeds(a, b) {
    appGlobal.cachedSavedFeeds.length > 0 && !a ? b(appGlobal.cachedSavedFeeds.slice(0), appGlobal.isLoggedIn) : updateSavedFeeds(function () {
        b(appGlobal.cachedSavedFeeds.slice(0), appGlobal.isLoggedIn)
    }, !0)
}

function markAsRead(a, b) {
    apiRequestWrapper("markers", {
        body: {
            action: "markAsRead",
            type: "entries",
            entryIds: a
        },
        method: "POST",
        onSuccess: function () {
            for (var c = 0; c < a.length; c++) removeFeedFromCache(a[c]);
            chrome.browserAction.getBadgeText({}, function (b) {
                b = +b, b > 0 && (b -= a.length, setBadgeCounter(b))
            }), "function" == typeof b && b(!0)
        },
        onAuthorizationRequired: function () {
            "function" == typeof b && b(!1)
        }
    })
}

function toggleSavedFeed(a, b, c) {
    b ? apiRequestWrapper("tags/" + encodeURIComponent(appGlobal.savedGroup), {
        method: "PUT",
        body: {
            entryId: a
        },
        onSuccess: function () {
            "function" == typeof c && c(!0)
        },
        onAuthorizationRequired: function () {
            "function" == typeof c && c(!1)
        }
    }) : apiRequestWrapper("tags/" + encodeURIComponent(appGlobal.savedGroup) + "/" + encodeURIComponent(a), {
        method: "DELETE",
        onSuccess: function () {
            "function" == typeof c && c(!0)
        },
        onAuthorizationRequired: function () {
            "function" == typeof c && c(!1)
        }
    });
    for (var d = 0; d < appGlobal.cachedFeeds.length; d++)
        if (appGlobal.cachedFeeds[d].id === a) {
            appGlobal.cachedFeeds[d].isSaved = b;
            break
        }
}

function getAccessToken() {
    var a = (new Date).getTime(),
        b = appGlobal.feedlyApiClient.getMethodUrl("auth/auth", {
            response_type: "code",
            client_id: appGlobal.clientId,
            redirect_uri: "http://localhost",
            scope: "https://cloud.feedly.com/subscriptions",
            state: a
        }, appGlobal.options.useSecureConnection);
    chrome.tabs.create({
        url: b
    }, function (b) {
        chrome.tabs.onUpdated.addListener(function c(d, e) {
            var f = new RegExp("state=" + a);
            if (f.test(e.url)) {
                var g = /code=(.+?)(?:&|$)/i,
                    h = g.exec(e.url);
                h && appGlobal.feedlyApiClient.request("auth/token", {
                    method: "POST",
                    useSecureConnection: appGlobal.options.useSecureConnection,
                    parameters: {
                        code: h[1],
                        client_id: appGlobal.clientId,
                        client_secret: appGlobal.clientSecret,
                        redirect_uri: "http://localhost",
                        grant_type: "authorization_code"
                    },
                    onSuccess: function (a) {
                        chrome.storage.sync.set({
                            accessToken: a.access_token,
                            refreshToken: a.refresh_token,
                            feedlyUserId: a.id
                        }, function () {}), chrome.tabs.onUpdated.removeListener(c), chrome.tabs.update(b.id, {
                            url: chrome.extension.getURL("options.html")
                        })
                    }
                })
            }
        })
    })
}

function refreshAccessToken() {
    appGlobal.options.refreshToken && appGlobal.feedlyApiClient.request("auth/token", {
        method: "POST",
        useSecureConnection: appGlobal.options.useSecureConnection,
        parameters: {
            refresh_token: appGlobal.options.refreshToken,
            client_id: appGlobal.clientId,
            client_secret: appGlobal.clientSecret,
            grant_type: "refresh_token"
        },
        onSuccess: function (a) {
            chrome.storage.sync.set({
                accessToken: a.access_token,
                feedlyUserId: a.id
            }, function () {})
        },
        onComplete: function () {
            appGlobal.tokenIsRefreshing = !1
        }
    })
}

function writeOptions(a) {
    var b = {};
    for (var c in appGlobal.options) b[c] = appGlobal.options[c];
    chrome.storage.sync.set(b, function () {
        "function" == typeof a && a()
    })
}

function readOptions(a) {
    chrome.storage.sync.get(null, function (b) {
        for (var c in b) appGlobal.options[c] = "boolean" == typeof appGlobal.options[c] ? Boolean(b[c]) : "number" == typeof appGlobal.options[c] ? Number(b[c]) : b[c];
        "function" == typeof a && a()
    })
}

function apiRequestWrapper(a, b) {
    var c = b.onSuccess;
    b.onSuccess = function (a) {
        setActiveStatus(), "function" == typeof c && c(a)
    };
    var d = b.onAuthorizationRequired;
    b.onAuthorizationRequired = function (a) {
        appGlobal.isLoggedIn && setInactiveStatus(), appGlobal.tokenIsRefreshing || (appGlobal.tokenIsRefreshing = !0, refreshAccessToken()), "function" == typeof d && d(a)
    }, appGlobal.feedlyApiClient.request(a, b)
}
var appGlobal = {
    feedlyApiClient: new FeedlyApiClient,
    icons: {
        "default": "/images/icon.png",
        inactive: "/images/icon_inactive.png",
        defaultBig: "/images/icon128.png"
    },
    options: {
        _updateInterval: 10,
        markReadOnClick: !0,
        accessToken: "",
        refreshToken: "",
        showDesktopNotifications: !0,
        hideNotificationDelay: 10,
        showFullFeedContent: !1,
        maxNotificationsCount: 5,
        openSiteOnIconClick: !1,
        feedlyUserId: "",
        abilitySaveFeeds: !1,
        maxNumberOfFeeds: 20,
        forceUpdateFeeds: !1,
        useSecureConnection: !0,
        isFiltersEnabled: !1,
        filters: [],
        showCounter: !0,
        oldestFeedsFirst: !1,
        resetCounterOnClick: !1,
        popupFontSize: 100,
        showCategories: !1,
        get updateInterval() {
            var a = 10;
            return this._updateInterval >= a ? this._updateInterval : a
        },
        set updateInterval(a) {
            return this._updateInterval = a
        }
    },
    criticalOptionNames: ["updateInterval", "accessToken", "showFullFeedContent", "openSiteOnIconClick", "maxNumberOfFeeds", "abilitySaveFeeds", "filters", "isFiltersEnabled", "showCounter", "oldestFeedsFirst", "resetCounterOnClick"],
    cachedFeeds: [],
    cachedSavedFeeds: [],
    isLoggedIn: !1,
    intervalIds: [],
    clientId: "grwatcher2",
    clientSecret: "FE01NYD4BRN89WADJCX4436MRWHQ",
    tokenIsRefreshing: !1,
    get feedlyUrl() {
        return this.options.useSecureConnection ? "https://feedly.com" : "http://feedly.com"
    },
    get savedGroup() {
        return "user/" + this.options.feedlyUserId + "/tag/global.saved"
    },
    get globalGroup() {
        return "user/" + this.options.feedlyUserId + "/category/global.all"
    },
    get globalUncategorized() {
        return "user/" + this.options.feedlyUserId + "/category/global.uncategorized"
    }
};
chrome.runtime.onInstalled.addListener(function () {
    readOptions(function () {
        writeOptions(initialize)
    })
}), chrome.storage.onChanged.addListener(function (a) {
    var b;
    for (var c in a)
        if (-1 !== appGlobal.criticalOptionNames.indexOf(c)) {
            b = initialize;
            break
        }
    readOptions(b)
}), chrome.runtime.onStartup.addListener(function () {
    readOptions(initialize)
}), chrome.webRequest.onCompleted.addListener(function (a) {
    ("POST" === a.method || "DELETE" === a.method) && (updateCounter(), updateFeeds())
}, {
    urls: ["*://*.feedly.com/v3/subscriptions*", "*://*.feedly.com/v3/markers?*ct=feedly.desktop*"]
}), chrome.webRequest.onCompleted.addListener(function (a) {
    ("PUT" === a.method || "DELETE" === a.method) && updateSavedFeeds()
}, {
    urls: ["*://*.feedly.com/v3/tags*global.saved*"]
}), chrome.browserAction.onClicked.addListener(function () {
    appGlobal.isLoggedIn ? (openFeedlyTab(), appGlobal.options.resetCounterOnClick && resetCounter()) : getAccessToken()
});