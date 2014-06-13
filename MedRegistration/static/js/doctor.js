app.controller("doctorsController", ["$scope", '$http', "$modal", function ($scope, $http, $modal) {
    var __self = this;
    $scope.doctors = [];

    __self.loadDoctors = function () {
        $http({
            method: 'GET',
            url: '/Doctor/GetDoctors'
        }).success(function (doctors) {
            $scope.doctors = doctors;
        });
    };

    __self.loadDoctors();


    __self.openDoctor = function (id) {
        var addDoctorInstance = $modal.open({
            templateUrl: '/Doctor/Add',
            controller: 'doctorAddController',
            resolve: {
                id: function () {
                    return id;
                }
            }
        });
        addDoctorInstance.result.then(function () {
            __self.loadDoctors();
        });
    };

    $scope.edit = function (id) {
        __self.openDoctor(id);
    };

    $scope.add = function () {
        __self.openDoctor(0);
    };
}]);

app.controller('doctorAddController', [
    '$scope', '$http', '$q', '$modalInstance', 'id', function ($scope, $http, $q, $modalInstance, id) {
        var __self = this;
        $scope.data = {
            titles: [],
            specialities: [
                { id: 0, description: '-- Избери Специалност --' }
            ]
        };


        $scope.model = {
            id: id,
            title: {},
            firstName: '',
            lastName: '',
            defaultExamTime: 20,
            specialities: [],
            errors: []
        };

        __self.loadTitles = function () {
            return $http({
                method: 'GET',
                url: '/Doctor/GetTitles'
            }).success(function (titles) {
                $scope.data.titles.pushAll(titles);
                $scope.model.title = titles[0];
            });
        };

        __self.loadSpecialities = function () {
            return $http({
                method: 'GET',
                url: '/Doctor/GetSpecialities'
            }).success(function (specialities) {
                $scope.data.specialities.pushAll(specialities);
            });
        };

        __self.loadData = function () {
            var waits = [];
            waits.push(__self.loadTitles());
            waits.push(__self.loadSpecialities());
            return $q.all(waits);
        };

        __self.loadDoctor = function () {
            $http({
                method: 'GET',
                url: '/Doctor/GetDoctor',
                params: {
                    id: id
                }
            }).success(function (doctor) {
                $scope.model.title = $scope.data.titles.find(function (t) { return t.id === doctor.titleId; });
                $scope.model.firstName = doctor.firstName;
                $scope.model.lastName = doctor.lastName;
                $scope.model.defaultExamTime = doctor.defaultExamTime;

                for (var i = 0; i < doctor.specialities.length; i++) {
                    var specialty = doctor.specialities[i];
                    $scope.model.specialities.push({
                        type: $scope.data.specialities.find(function(x) { return x.id == specialty.id; }),
                        types: _.filter($scope.data.specialities, function (s) {
                            if (s.id === 0)
                                return true;
                            return !_.any($scope.model.specialities, function (ms) { return ms.type.id === s.id; });
                        })
                    });
                }
            });
        };

        __self.loadData().then(function () {
            if (id > 0)
                __self.loadDoctor();
        });

        $scope.save = function () {
            $scope.model.errors.clear();
            if (!$scope.model.firstName) {
                $scope.model.errors.push("Моля въведете първо име!");
            }
            if (!$scope.model.lastName) {
                $scope.model.errors.push("Моля въведете фамилия!");
            }
            if ($scope.model.errors.length > 0)
                return false;

            var doctor = {
                id: $scope.model.id,
                titleId: $scope.model.title.id,
                firstName: $scope.model.firstName,
                lastName: $scope.model.lastName,
                defaultExamTime: $scope.model.defaultExamTime
            };
            var specialities = [];
            for (var i = 0; i < $scope.model.specialities.length; i++) {
                var speciality = $scope.model.specialities[i];
                if (speciality.type.id > 0)
                    specialities.push(speciality.type);
            }
            $http(
            {
                method: 'POST',
                url: '/Doctor/Save',
                data: {
                    doctor: doctor,
                    specialities: specialities
                }
            }).success(function (res) {
                __self.ok();
            }).error(function (err) {
                $scope.model.errors.push(err);
            });

            return true;
        };

        __self.ok = function () {
            $modalInstance.close();
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.delete = function () {
            if (confirm('Сигурни ли сте, че искате да изтриете лекаря: ' + $scope.model.firstName + ' ' + $scope.model.lastName)) {
                $http(
                {
                    method: 'POST',
                    url: '/Doctor/Delete',
                    data: {
                        id: $scope.model.id
                    }
                }).success(function (res) {
                    __self.ok();
                }).error(function (err) {
                    $scope.model.errors.push(err);
                });
            }
        }

        $scope.addNewSpeciality = function () {
            if (_.any($scope.model.specialities, function (s) { return s.type.id === 0; }))
                return;
            $scope.model.specialities.push({
                type: $scope.data.specialities[0],
                types: _.filter($scope.data.specialities, function (s) {
                    if (s.id === 0)
                        return true;
                    return !_.any($scope.model.specialities, function (ms) { return ms.type.id === s.id; });
                })
            });
        };

        $scope.removeSpeciality = function (speciality) {
            $scope.model.specialities.remove(speciality);
        };
    }
]);