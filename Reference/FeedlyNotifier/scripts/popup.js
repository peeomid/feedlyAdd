"use strict";

function renderFeeds(a) {
    showLoader(), popupGlobal.backgroundPage.getFeeds(popupGlobal.backgroundPage.appGlobal.options.forceUpdateFeeds || a, function (a, b) {
        if (popupGlobal.feeds = a, b === !1) showLogin();
        else if (0 === a.length) showEmptyContent();
        else {
            var c = $("#feed").show().empty();
            popupGlobal.backgroundPage.appGlobal.options.showCategories && renderCategories(c, a), c.append($("#feedTemplate").mustache({
                feeds: a
            })), c.find(".timeago").timeago(), showFeeds()
        }
    })
}

function renderSavedFeeds(a) {
    showLoader(), popupGlobal.backgroundPage.getSavedFeeds(popupGlobal.backgroundPage.appGlobal.options.forceUpdateFeeds || a, function (a, b) {
        if (popupGlobal.savedFeeds = a, b === !1) showLogin();
        else if (0 === a.length) showEmptyContent();
        else {
            var c = $("#feed-saved").empty();
            popupGlobal.backgroundPage.appGlobal.options.showCategories && renderCategories(c, a), c.append($("#feedTemplate").mustache({
                feeds: a
            })), c.find(".timeago").timeago(), showSavedFeeds()
        }
    })
}

function markAsRead(a) {
    for (var b = $(), c = 0; c < a.length; c++) b = b.add(".item[data-id='" + a[c] + "']");
    b.fadeOut("fast", function () {
        $(this).remove()
    }), b.attr("data-is-read", "true"), 0 === $("#feed").find(".item[data-is-read!='true']").size() && showLoader(), popupGlobal.backgroundPage.markAsRead(a, function () {
        0 === $("#feed").find(".item[data-is-read!='true']").size() && renderFeeds()
    })
}

function markAllAsRead() {
    var a = [];
    $(".item:visible").each(function (b, c) {
        a.push($(c).data("id"))
    }), markAsRead(a)
}

function renderCategories(a, b) {
    $(".categories").remove();
    var c = getUniqueCategories(b);
    a.append($("#categories-template").mustache({
        categories: c
    }))
}

function getUniqueCategories(a) {
    var b = [],
        c = [];
    return a.forEach(function (a) {
        a.categories.forEach(function (a) {
            -1 === c.indexOf(a.id) && (b.push(a), c.push(a.id))
        })
    }), b
}

function showLoader() {
    $("body").children("div").hide(), $("#loading").show()
}

function showLogin() {
    $("body").children("div").hide(), $("#login-btn").text(chrome.i18n.getMessage("Login")), $("#login").show()
}

function showEmptyContent() {
    $("body").children("div").hide(), $("#popup-content").show().children("div").hide().filter("#feed-empty").text(chrome.i18n.getMessage("NoUnreadArticles")).show(), $("#feedly").show().find("#popup-actions").hide()
}

function showFeeds() {
    popupGlobal.backgroundPage.appGlobal.options.resetCounterOnClick && popupGlobal.backgroundPage.resetCounter(), $("body").children("div").hide(), $("#popup-content").show().children("div").hide().filter("#feed").show(), $("#feedly").show().find("#popup-actions").show().children().show(), $(".mark-read").attr("title", chrome.i18n.getMessage("MarkAsRead")), $(".show-content").attr("title", chrome.i18n.getMessage("More"))
}

function showSavedFeeds() {
    $("body").children("div").hide(), $("#popup-content").show().children("div").hide().filter("#feed-saved").show().find(".mark-read").hide(), $("#feed-saved").find(".show-content").attr("title", chrome.i18n.getMessage("More")), $("#feedly").show().find("#popup-actions").show().children().hide().filter(".icon-refresh").show()
}

function setPopupExpand(a) {
    if (a) $(".item").css("width", "700px"), $(".article-title, .blog-title").css("width", $("#popup-content").hasClass("tabs") ? "645px" : "660px");
    else {
        var b = $("#popup-content");
        $(".item").css("width", b.hasClass("tabs") ? "380px" : "350px"), $(".article-title, .blog-title").css("width", b.hasClass("tabs") ? "325px" : "310px")
    }
}
var popupGlobal = {
    supportedTimeAgoLocales: ["ru", "fr", "pt-BR", "it", "cs"],
    feeds: [],
    savedFeeds: [],
    backgroundPage: chrome.extension.getBackgroundPage()
};
$(document).ready(function () {
    $("#feed, #feed-saved").css("font-size", popupGlobal.backgroundPage.appGlobal.options.popupFontSize / 100 + "em"), $("#website").text(chrome.i18n.getMessage("FeedlyWebsite")), $("#mark-all-read>span").text(chrome.i18n.getMessage("MarkAllAsRead")), $("#update-feeds>span").text(chrome.i18n.getMessage("UpdateFeeds")), $("#open-all-news>span").text(chrome.i18n.getMessage("OpenAllFeeds")), popupGlobal.backgroundPage.appGlobal.options.abilitySaveFeeds && $("#popup-content").addClass("tabs"), -1 !== popupGlobal.supportedTimeAgoLocales.indexOf(window.navigator.language) ? $.getScript("/scripts/timeago/locales/jquery.timeago." + window.navigator.language + ".js", function () {
        renderFeeds()
    }) : renderFeeds()
}), $("#login").click(function () {
    popupGlobal.backgroundPage.getAccessToken()
}), $("#feed, #feed-saved").on("mousedown", "a", function (a) {
    var b = $(this);
    if (1 === a.which || 2 === a.which) {
        var c = !(a.ctrlKey || 2 === a.which);
        chrome.tabs.create({
            url: b.data("link"),
            active: c
        }, function () {
            popupGlobal.backgroundPage.appGlobal.options.markReadOnClick && b.hasClass("title") && $("#feed").is(":visible") && markAsRead([b.closest(".item").data("id")])
        })
    }
}), $("#popup-content").on("click", "#mark-all-read", markAllAsRead), $("#popup-content").on("click", "#open-all-news", function () {
    $("#feed").find("a.title[data-link]").filter(":visible").each(function (a, b) {
        var c = $(b);
        chrome.tabs.create({
            url: c.data("link"),
            active: !1
        }, function () {})
    }), popupGlobal.backgroundPage.appGlobal.options.markReadOnClick && markAllAsRead()
}), $("#feed").on("click", ".mark-read", function () {
    var a = $(this).closest(".item");
    markAsRead([a.data("id")])
}), $("#feedly").on("click", "#btn-feeds-saved", function () {
    $(this).addClass("active-tab"), $("#btn-feeds").removeClass("active-tab"), renderSavedFeeds()
}), $("#feedly").on("click", "#btn-feeds", function () {
    $(this).addClass("active-tab"), $("#btn-feeds-saved").removeClass("active-tab"), renderFeeds()
}), $("#popup-content").on("click", ".show-content", function () {
    var a = $(this),
        b = a.closest(".item"),
        c = b.find(".content"),
        d = b.data("id");
    if ("" === c.html()) {
        for (var e, f = $("#feed").is(":visible") ? popupGlobal.feeds : popupGlobal.savedFeeds, g = 0; g < f.length; g++) f[g].id === d && (e = f[g].content);
        e && (c.html(e), c.find("a").each(function (a, b) {
            var c = $(b);
            c.data("link", c.attr("href")), c.attr("href", "javascript:void(0)")
        }))
    }
    c.slideToggle(function () {
        a.css("background-position", c.is(":visible") ? "-288px -120px" : "-313px -119px"), c.is(":visible") && c.text().length > 350 ? setPopupExpand(!0) : setPopupExpand(!1)
    })
}), $("#feedly").on("click", "#update-feeds", function () {
    $("#feed").is(":visible") ? renderFeeds(!0) : renderSavedFeeds(!0)
}), $("#popup-content").on("click", ".save-feed", function () {
    var a = $(this),
        b = a.closest(".item"),
        c = b.data("id"),
        d = !a.data("saved");
    popupGlobal.backgroundPage.toggleSavedFeed(c, d), a.data("saved", d), a.toggleClass("saved")
}), $("#popup-content").on("click", "#website", function () {
    popupGlobal.backgroundPage.openFeedlyTab()
}), $("#popup-content").on("click", ".categories > span", function () {
    $(".categories").find("span").removeClass("active");
    var a = $(this).addClass("active"),
        b = a.data("id");
    b ? ($(".item").hide(), $(".item[data-categories~='" + b + "']").show()) : $(".item").show()
}), $("#feedly").on("click", "#feedly-logo", function (a) {
    a.ctrlKey && (popupGlobal.backgroundPage.appGlobal.options.abilitySaveFeeds = !popupGlobal.backgroundPage.appGlobal.options.abilitySaveFeeds, location.reload())
});