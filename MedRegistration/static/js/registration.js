app.factory('week', ['$http', 'customFormatter', function ($http, customFormatter) {
    var __self = this;
    var date = new Date();
    date.setDate(date.getDate() - (7 + date.getDay() - 1) % 7);
    __self.from = date;
    date = new Date();
    date.setDate(date.getDate() + (7 - date.getDay() + 7) % 7);
    __self.to = date;
    __self.days = [];
    __self.hours = [];

    __self.buildHours = function (weekMinHour, weekMaxHour, doctor) {
        var sortedSchedules = _.sortBy(doctor.schedule, function (x) { return x.fromTime; });
        doctor.hours = [];

        for (var i = 0; i < sortedSchedules.length; i++) {
            var schedule = sortedSchedules[i];
            if (i == 0) {
                doctor.hours.push({
                    work: 0,
                    from: weekMinHour,
                    to: schedule.fromTime
                });
            } else {
                doctor.hours.push({
                    work: 0,
                    from: sortedSchedules[i - 1].toTime,
                    to: schedule.fromTime
                });
            }

            var time = schedule.fromTime + doctor.examTime;
            while (time < schedule.toTime) {
                doctor.hours.push({
                    work: 1,
                    from: time - doctor.examTime,
                    to: time,
                    isnzok: schedule.isnzok
                });
                time += doctor.examTime;
            }
            if (time - doctor.examTime < schedule.toTime) {
                doctor.hours.push({
                    work: 1,
                    from: time - doctor.examTime,
                    to: schedule.toTime,
                    isnzok: schedule.isnzok
                });
            }

            if (i == sortedSchedules.length - 1) {
                doctor.hours.push({
                    work: 0,
                    from: schedule.toTime,
                    to: weekMaxHour
                });
            }
        }

    };

    __self.getSchedule = function () {
        $http({
            method: 'GET',
            url: '/Registration/GetDoctorsSchedule',
            params: {
                fromDate: customFormatter.dateToString(__self.from),
                toDate: customFormatter.dateToString(__self.to)
            }
        })
        .success(function (data) {
            __self.hours.splice(0, __self.hours.length);
            for (var k = data.weekMinHour; k < data.weekMaxHour; k += 60) {
                __self.hours.push(k / 60);
            }
            __self.days.splice(0, __self.days.length);
            for (var i = 0; i < data.schedule.length; i++) {
                var dt = data.schedule[i].date;
                for (var j = 0; j < data.schedule[i].doctors.length; j++) {
                    var doctor = data.schedule[i].doctors[j];
                    __self.buildHours(data.weekMinHour, data.weekMaxHour, doctor);
                }
                __self.days.push({
                    date: new Date(dt),
                    doctors: data.schedule[i].doctors
                });
            }
        });
    };

    __self.getSchedule();

    return {
        from: __self.from,
        to: __self.to,
        days: __self.days,
        hours: __self.hours,

        name: function () {
            return "От: " + customFormatter.dateToUserString(__self.from) + ", До: " + customFormatter.dateToUserString(__self.to);
        },

        next: function () {
            __self.from.setDate(__self.from.getDate() + 7);
            __self.to.setDate(__self.to.getDate() + 7);
            __self.getSchedule();
        },

        prev: function () {
            __self.from.setDate(__self.from.getDate() - 7);
            __self.to.setDate(__self.to.getDate() - 7);
            __self.getSchedule();
        }
    }
}]);

app.controller('registrationController', ['$scope', '$http', 'customFormatter', 'week', '$modal',
    function ($scope, $http, customFormatter, week, $modal) {
        $scope.week = week;

        $scope.registerHour = function (doctor, day, hour) {
            var addRegistrationInstance = $modal.open({
                templateUrl: '/Registration/Register',
                controller: 'registrationAddController',
                size: 'lg',
                resolve: {
                    info: function() {
                        return {
                            doctor: doctor,
                            day: day,
                            hour: hour
                        };
                    }
                }
            });
            addRegistrationInstance.result.then(function () {

            });
        };
    }
]);

app.controller('registrationAddController', ['$scope', '$http', '$modalInstance', 'timeConverter', 'info', function ($scope, $http, $modalInstance, timeConverter, info) {
    var __self = this;
    $scope.data = {
        funds: [
            { id: 0, name: '-- Изберете Фонд --' }
        ]
    };
    $scope.model = {
        errors: [],
        date: info.day.date,
        fromTime: timeConverter.convertToHours(info.hour.from),
        toTime: timeConverter.convertToHours(info.hour.to),
        nzok: info.hour.isnzok,
        patients: [],
        selectedPatient: 0,
        isNewPatient: 0,
        newPatient: {
            firstName: '',
            lastName: '',
            phoneNumber: ''           
        },
        paymentType: 1,
        fund: $scope.data.funds[0],
        fundCardNumber: '',
        fundCardExpiration: ''
    };
    __self.loadPatients = function () {
        $http({
            method: 'GET',
            url: '/Patient/GetPatients'
        }).success(function (patients) {
            $scope.model.patients = patients;
        });
    };

    __self.loadFunds = function () {
        $http({
            method: 'GET',
            url: '/Registration/GetFunds'
        }).success(function (funds) {
            $scope.data.funds.pushAll(funds);
        });
    };
    __self.loadPatients();

    __self.loadFunds();

    $scope.onSelectPatient = function (patient) {
        $scope.model.selectedPatient = patient.id;
    };

    __self.closeModal = function() {
        $modalInstance.close();
    };

    $scope.select = function () {
        $scope.model.errors = [];
        if ($scope.model.isNewPatient === 0 && !$scope.model.selectedPatient) {
            $scope.model.errors.push('Моля изберете пациент!');
        }
        if ($scope.model.errors.length > 0) {
            return;
        }

        if ($scope.model.isNewPatient === 0) {
            var reservation = {
                patientId: $scope.model.selectedPatient,
                doctorId: info.doctor.doctorId,
                date: $scope.model.date,
                fromTime: $scope.model.fromTime,
                toTime: $scope.model.toTime,
                paymentTypeId: $scope.model.paymentType
            };

            if (reservation.paymentTypeId === 3 && $scope.model.fund.id > 0) {
                reservation.paymentInfo = {
                    fundId: $scope.model.fund.id,
                    fundCardNumber: $scope.model.fundCardNumber,
                    fundCardExpiration: $scope.model.fundCardExpiration
                };
            }

            $http(
            {
                method: 'POST',
                url: '/Registration/RegisterExistingPatient',
                data: reservation
            }).success(function (res) {
                __self.closeModal();
            }).error(function (err) {
                $scope.model.errors.push(err);
            });
        } else {
                
        }
    };

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
}]);

app.filter('nonZeroHour', [function () {
    return function (hours) {
        return _.filter(hours, function (h) {
            return h.to - h.from > 0;
        });
    };
}]);

app.directive('vmQtip', ['timeConverter', function (timeConverter) {
    return {
        link: function (scope, elm, attrs) {
            var content = scope.doctor.title + " " + scope.doctor.firstName + " " + scope.doctor.lastName + "<br/>";
            if (scope.hour.work === 0)
                content += 'Неработи';
            else {
                if (scope.hour.isnzok)
                    content += 'Работи по здравна каса.';
                else
                    content += 'Работи.';
            }
            content += '<br/>';
            content += 'Начало: ' + timeConverter.convertToHours(scope.hour.from);
            content += '<br/>';
            content += 'Край: ' + timeConverter.convertToHours(scope.hour.to);
            elm.qtip({
                content: {
                    text: content
                },
                position: {
                    my: 'bottom left',
                    at: 'top right',
                    //     target: 'mouse',
                    viewport: $(window)
                }
            });
        }
    };
}]);