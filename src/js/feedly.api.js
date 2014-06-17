"use strict";
var FeedlyApiClient = function (a) {
    this.accessToken = a;
    var b = "http://cloud.feedly.com/v3/",
        c = "https://cloud.feedly.com/v3/",
        d = chrome.runtime.getManifest().version;
    this.getMethodUrl = function (a, e, f) {
        if (void 0 === a) return "";
        var g = (f ? c : b) + a,
            h = "?";
        for (var i in e) h += i + "=" + e[i] + "&";
        return h += "av=c" + d, g += h
    }, this.request = function (a, b) {
        var c = this.getMethodUrl(a, b.parameters, b.useSecureConnection),
            d = b.method || "GET";
        "GET" === d && (c += (/\?/.test(c) ? "&" : "?") + "ck=" + (new Date).getTime());
        var e = new XMLHttpRequest;
        e.timeout = 5e3, e.open(d, c, !0), this.accessToken && e.setRequestHeader("Authorization", "OAuth " + this.accessToken), e.onload = function (a) {
            var c;
            try {
                c = JSON.parse(a.target.response)
            } catch (d) {
                c = {
                    parsingError: d.message,
                    response: a.target.response
                }
            }
            200 === a.target.status ? "function" == typeof b.onSuccess && b.onSuccess(c) : 401 === a.target.status ? "function" == typeof b.onAuthorizationRequired && b.onAuthorizationRequired(b.accessToken) : 400 === a.target.status && "function" == typeof b.onError && b.onError(c), "function" == typeof b.onComplete && b.onComplete(c)
        };
        var f;
        b.body && (f = JSON.stringify(b.body)), e.send(f)
    }
};