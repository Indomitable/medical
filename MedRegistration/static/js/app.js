var app = angular.module("app", ['ui.bootstrap', 'ui.slider', 'ngCookies', 'ui.med']);

//app.config(['$httpProvider', function ($httpProvider) {
//    //  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
//    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
//}]);

//app.run(['$http', '$cookies', function ($http, $cookies) {
//    $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
//}]);


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