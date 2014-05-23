var app = angular.module("app", ['ui.bootstrap', 'ui.slider', 'ngCookies']);

app.config(['$httpProvider', function ($httpProvider) {
    //  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
}]);

app.run(['$http', '$cookies', function ($http, $cookies) {
    $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
}]);


app.service('customFormatter', function () {

    this.dateToString = function (date) {
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        if (month < 10)
            month = "0" + month;
        if (day < 10)
            day = "0" + day;
        return year + "-" + month + "-" + day;
    }

});

app.controller("doctorsController", ["$scope", "$modal", function ($scope, $modal) {
    $scope.add = function () {
        var addDoctorInstance = $modal.open({
            templateUrl: 'add',
            controller: doctorAddController
        });
        addDoctorInstance.result.then(function () {

        });
    };
}]);

var doctorAddController = function ($scope, $modalInstance) {
    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};