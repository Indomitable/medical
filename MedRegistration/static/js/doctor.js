app.controller("doctorsController", ["$scope", "$modal", function ($scope, $modal) {
    $scope.add = function () {
        var addDoctorInstance = $modal.open({
            templateUrl: '/Doctor/Add',
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