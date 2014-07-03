var app = angular.module("app", ['ui.bootstrap', 'ngCookies', 'ui.med']);

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

app.controller('rootController', [
    '$scope', function ($scope) {
        $scope.init = function(currentUserId) {
            $scope.currentUserId = currentUserId;
        }
    }
]);