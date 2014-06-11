var app = angular.module("app", ['ui.bootstrap', 'ui.slider', 'ngCookies', 'ui.med']);

app.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = '__RequestVerificationToken';
    $httpProvider.defaults.cache = false;
    $httpProvider.interceptors.push(function () {
        return {
            'request': function (config) {
                if (config.method === 'POST') {
                    var antiForgery = angular.element('input[name="__RequestVerificationToken"]');
                    if (antiForgery.length > 0) {
                        config.headers['X-Request-Verification-Token'] = antiForgery.val();
                    }
                }
                return config;
            }
        };
    });

}]);

app.service('customFormatter', function () {
    var __self = this;

    __self.getDayParts = function (date) {
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        if (month < 10)
            month = "0" + month;
        if (day < 10)
            day = "0" + day;
        return {
            year: year,
            month: month,
            day: day
        };
    };

    __self.dateToString = function (date) {
        var parts = __self.getDayParts(date);
        return parts.year + "-" + parts.month + "-" + parts.day;
    };

    __self.dateToUserString = function (date) {
        var parts = __self.getDayParts(date);
        return parts.day + "." + parts.month + "." + parts.year;
    };

});