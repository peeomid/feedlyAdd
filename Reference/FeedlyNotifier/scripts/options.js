"use strict";

function loadProfileData() {
    chrome.extension.getBackgroundPage().apiRequestWrapper("profile", {
        useSecureConnection: chrome.extension.getBackgroundPage().appGlobal.options.useSecureConnection,
        onSuccess: function (a) {
            var b = $("#userInfo");
            b.find("[data-locale-value]").each(function () {
                var a = $(this),
                    b = a.data("locale-value");
                a.text(chrome.i18n.getMessage(b))
            }), b.show();
            for (var c in a) b.find("span[data-value-name='" + c + "']").text(a[c])
        },
        onAuthorizationRequired: function () {
            $("#userInfo, #filters-settings").hide()
        }
    })
}

function loadUserCategories() {
    chrome.extension.getBackgroundPage().apiRequestWrapper("categories", {
        onSuccess: function (a) {
            a.forEach(function (a) {
                appendCategory(a.id, a.label)
            }), appendCategory(chrome.extension.getBackgroundPage().appGlobal.globalUncategorized, "Uncategorized"), chrome.storage.sync.get("filters", function (a) {
                var b = a.filters || [];
                b.forEach(function (a) {
                    $("#categories").find("input[data-id='" + a + "']").attr("checked", "checked")
                })
            })
        }
    })
}

function appendCategory(a, b) {
    var c = $("#categories"),
        b = $("<span class='label' />").text(b),
        d = $("<input type='checkbox' />").attr("data-id", a);
    c.append(b), c.append(d), c.append("<br/>")
}

function parseFilters() {
    var a = [];
    return $("#categories").find("input[type='checkbox']:checked").each(function (b, c) {
        var d = $(c);
        a.push(d.data("id"))
    }), a
}

function saveOptions() {
    var a = {};
    $("#options").find("input[data-option-name]").each(function (b, c) {
        var d, e = $(c);
        d = "checkbox" === e.attr("type") ? e.is(":checked") : "number" === e.attr("type") ? Number(e.val()) : e.val(), a[e.data("option-name")] = d
    }), a.filters = parseFilters(), setBackgroundMode($("#enable-background-mode").is(":checked")), chrome.storage.sync.set(a, function () {
        alert(chrome.i18n.getMessage("OptionsSaved"))
    })
}

function loadOptions() {
    chrome.permissions.contains(optionsGlobal.backgroundPermission, function (a) {
        $("#enable-background-mode").prop("checked", a)
    }), chrome.storage.sync.get(null, function (a) {
        var b = $("#options");
        for (var c in a) {
            var d = b.find("input[data-option-name='" + c + "']");
            "checkbox" === d.attr("type") ? d.attr("checked", a[c]) : d.val(a[c])
        }
        b.find("input").trigger("change")
    }), $("#header").text(chrome.i18n.getMessage("FeedlyNotifierOptions")), $("#options").find("[data-locale-value]").each(function () {
        var a = $(this),
            b = a.data("locale-value");
        a.text(chrome.i18n.getMessage(b))
    })
}

function setBackgroundMode(a) {
    a ? chrome.permissions.request(optionsGlobal.backgroundPermission, function () {}) : chrome.permissions.remove(optionsGlobal.backgroundPermission, function () {})
}
var optionsGlobal = {
    backgroundPermission: {
        permissions: ["background"]
    }
};
$(document).ready(function () {
    loadOptions(), loadUserCategories(), loadProfileData()
}), $("body").on("click", "#save", function (a) {
    var b = document.getElementById("options");
    b.checkValidity() && (a.preventDefault(), saveOptions())
}), $("body").on("click", "#logout", function () {
    chrome.extension.getBackgroundPage().appGlobal.options.accessToken = "", chrome.extension.getBackgroundPage().appGlobal.options.refreshToken = "", chrome.storage.sync.remove(["accessToken", "refreshToken"], function () {}), $("#userInfo, #filters-settings").hide()
}), $("#options").on("change", "input", function () {
    $("[data-disable-parent]").each(function (a, b) {
        var c = $(b),
            d = $("input[data-option-name='" + c.data("disable-parent") + "']");
        d.is(":checked") ? c.attr("disabled", "disable") : c.removeAttr("disabled")
    }), $("[data-enable-parent]").each(function (a, b) {
        var c = $(b),
            d = $("input[data-option-name='" + c.data("enable-parent") + "']");
        d.is(":checked") ? c.removeAttr("disabled") : c.attr("disabled", "disable")
    })
});