app.factory('week', ['$http', '$q', 'customFormatter', function ($http, $q, customFormatter) {
    var __self = this;
    __self.days = [];
    __self.reservations = [];

    __self.setWeekByDate = function (date) {
        date.setDate(date.getDate() - (7 + date.getDay() - 1) % 7);
        __self.from = date;
        date = new Date(__self.from.getFullYear(), __self.from.getMonth(), __self.from.getDate());
        date.setDate(date.getDate() + (7 - date.getDay() + 7) % 7);
        __self.to = date;
    };

    __self.buildHours = function (dayMinHour, dayMaxHour, doctor) {
        var sortedSchedules = _.sortBy(doctor.schedule, function (x) { return x.fromTime; });
        doctor.hours = [];

        for (var i = 0; i < sortedSchedules.length; i++) {
            var schedule = sortedSchedules[i];
            if (schedule.toTime === 1439)
                schedule.toTime = 1440;
            if (i == 0) {
                doctor.hours.push({
                    work: 0,
                    from: dayMinHour,
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
                    to: dayMaxHour
                });
            }
        }

    };

    __self.getSchedule = function () {
        __self.days.clear();
        return $http({
            method: 'GET',
            url: '/Registration/Registration/GetDoctorsSchedule',
            params: {
                fromDate: customFormatter.dateToString(__self.from),
                toDate: customFormatter.dateToString(__self.to)
            }
        })
        .success(function (data) {
            for (var i = 0; i < data.length; i++) {
                var schedule = data[i];
                var hours = [];
                for (var k = schedule.dayMinHour; k < schedule.dayMaxHour; k += 60) {
                    hours.push(k / 60);
                }

                for (var j = 0; j < schedule.doctors.length; j++) {
                    var doctor = schedule.doctors[j];
                    __self.buildHours(schedule.dayMinHour, schedule.dayMaxHour, doctor);
                }
                __self.days.push({
                    date: new Date(schedule.date),
                    hours: hours,
                    doctors: schedule.doctors
                });
            }
        });
    };

    __self.getReservations = function (date) {
        __self.reservations.clear();
        var paramsData = {};
        if (date) {
            paramsData.fromDate = customFormatter.dateToString(date);
            paramsData.toDate = customFormatter.dateToString(date);
        } else {
            paramsData.fromDate = customFormatter.dateToString(__self.from);
            paramsData.toDate = customFormatter.dateToString(__self.to);
        }

        return $http({
            method: 'GET',
            url: '/Registration/Registration/GetReservations',
            params: paramsData
        }).success(function (data) {
            __self.reservations.pushAll(data);
        });
    };

    __self.applyReservations = function () {
        for (var i = 0; i < __self.days.length; i++) {
            var day = __self.days[i];
            var reservationsForDay = _.filter(__self.reservations, function (x) { return new Date(x.date).valueOf() === day.date.valueOf(); });
            if (reservationsForDay.length === 0)
                continue;
            for (var j = 0; j < day.doctors.length; j++) {
                var doctor = day.doctors[j];
                var reservationsForDoctor = reservationsForDay.find(function (x) { return x.doctorId === doctor.doctorId; });
                if (!reservationsForDoctor)
                    continue;
                for (var k = 0; k < reservationsForDoctor.hours.length; k++) {
                    var reservationHour = reservationsForDoctor.hours[k];
                    if (reservationHour.toTime === 0 && reservationHour.fromTime > 0)
                        reservationHour.toTime = 1440;
                    var hour = doctor.hours.find(function (h) { return h.from === reservationHour.fromTime && h.to === reservationHour.toTime; });
                    if (!hour)
                        continue;
                    hour.isReserved = true;
                    hour.reservation = {
                        id: reservationHour.id,
                        patientId: reservationHour.patientId,
                        firstName: reservationHour.patientFirstName,
                        lastName: reservationHour.patientLastName,
                        phone: reservationHour.patientPhone,
                        note: reservationHour.note
                    };
                }
            }
        }
    }

    __self.reloadResevations = function (date) {
        for (var i = 0; i < __self.days.length; i++) {
            if (!date || __self.days[i].date.valueOf() === date.valueOf()) {
                for (var j = 0; j < __self.days[i].doctors.length; j++) {
                    for (var k = 0; k < __self.days[i].doctors[j].hours.length; k++) {
                        var hour = __self.days[i].doctors[j].hours[k];
                        hour.isReserved = false;
                        hour.reservation = {};
                    }
                }
            }
        }
        __self.getReservations(date).then(__self.applyReservations);
    };

    __self.getData = function () {
        var waits = [];
        waits.push(__self.getSchedule());
        waits.push(__self.getReservations());
        $q.all(waits).then(__self.applyReservations);
    };

    return {
        from: __self.from,
        to: __self.to,
        days: __self.days,

        setDate: function (date) {
            __self.setWeekByDate(date);
        },

        reload: function () {
            __self.getData();
        },

        reloadResevations: function (date) {
            __self.reloadResevations(date);
        },

        name: function () {
            return customFormatter.dateToUserString(__self.from) + " - " + customFormatter.dateToUserString(__self.to);
        },

        next: function () {
            __self.from.setDate(__self.from.getDate() + 7);
            __self.to.setDate(__self.to.getDate() + 7);
            __self.getData();
        },

        prev: function () {
            __self.from.setDate(__self.from.getDate() - 7);
            __self.to.setDate(__self.to.getDate() - 7);
            __self.getData();
        }
    }
}]);

app.controller('registrationController', ['$scope', '$http', 'customFormatter', 'week', '$modal',
    function ($scope, $http, customFormatter, week, $modal) {
        $scope.week = week;
        var _date = new Date();
        $scope.currentDate = new Date(_date.getFullYear(), _date.getMonth(), _date.getDate());
        $scope.week.setDate($scope.currentDate);
        $scope.week.reload();

        $scope.registerHour = function (doctor, date, hour) {
            var addRegistrationInstance = $modal.open({
                templateUrl: '/Registration/Registration/Register',
                controller: 'registrationAddController',
                //size: 'lg',
                resolve: {
                    info: function () {
                        return {
                            doctor: doctor,
                            date: date,
                            hour: hour
                        };
                    }
                }
            });
            addRegistrationInstance.result.then(function () {
                $scope.week.reloadResevations(date);
            });
        };

        $scope.unRegisterHour = function (id, date) {
            $http({
                method: 'POST',
                url: '/Registration/Registration/UnRegisterHour',
                data: {
                    id: id
                }
            })
            .success(function (data) {
                $scope.week.reloadResevations(date);
            });
        };

        $scope.viewPatient = function (patientId) {
            $modal.open({
                templateUrl: '/Common/Patient/Add',
                controller: 'patientAddController',
                resolve: {
                    id: function () {
                        return patientId;
                    }
                }
            });
        };

        $scope.$watch("currentDate", function (newVal, oldVal) {
            if (newVal && oldVal && newVal.valueOf() != oldVal.valueOf()) {
                var oldDate = new Date(oldVal.getFullYear(), oldVal.getMonth(), oldVal.getDate());
                var newDate = new Date(newVal.getFullYear(), newVal.getMonth(), newVal.getDate());

                oldDate.setDate(oldDate.getDate() - (7 + oldDate.getDay() - 1) % 7);
                newDate.setDate(newDate.getDate() - (7 + newDate.getDay() - 1) % 7);

                if (oldDate.valueOf() != newDate.valueOf()) {
                    $scope.week.setDate(newDate);
                    $scope.week.reload();
                }
            }
        });
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
        date: info.date,
        doctor: info.doctor,
        fromTime: timeConverter.convertToHours(info.hour.from),
        toTime: timeConverter.convertToHours(info.hour.to),
        nzok: info.hour.isnzok,
        patients: [],
        selectedPatient: 0,
        note: '',
        isNewPatient: 0,
        newPatient: {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            note: ''
        },
        paymentType: 1,
        fund: $scope.data.funds[0],
        fundCardNumber: '',
        fundCardExpiration: null
    };
    __self.loadPatients = function () {
        $http({
            method: 'GET',
            url: '/Common/Patient/GetPatients'
        }).success(function (patients) {
            $scope.model.patients = patients;
        });
    };

    __self.loadFunds = function () {
        $http({
            method: 'GET',
            url: '/Registration/Registration/GetFunds'
        }).success(function (funds) {
            $scope.data.funds.pushAll(funds);
        });
    };
    __self.loadPatients();

    __self.loadFunds();

    $scope.onSelectPatient = function (patient) {
        $scope.model.selectedPatient = patient.id;
        $http({
            method: 'GET',
            url: '/Common/Patient/GetPatientFundInfo',
            params: {
                id: patient.id
            }
        }).success(function (res) {
            if (res) {
                $scope.model.paymentType = 3;
                $scope.model.fund = $scope.data.funds.find(function (f) {
                    return f.id === res.fundId;
                });
                $scope.model.fundCardNumber = res.fundCardNumber;
                $scope.model.fundCardExpiration = res.fundCardExpiration;
            } else {
                $scope.model.paymentType = 1;
                $scope.model.fund = $scope.data.funds[0];
                $scope.model.fundCardNumber = '';
                $scope.model.fundCardExpiration = null;
            }
        });
    };

    __self.closeModal = function () {
        $modalInstance.close();
    };

    $scope.select = function () {
        $scope.model.errors = [];
        if ($scope.model.isNewPatient === 0 && !$scope.model.selectedPatient) {
            $scope.model.errors.push('Моля изберете пациент!');
        }
        if ($scope.model.paymentType === 3 && $scope.model.fund.id > 0 && (!$scope.model.fundCardNumber || !$scope.model.fundCardExpiration)) {
            $scope.model.errors.push("Моля въведете номер и/или валидност на фондовата карта!");
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
                paymentTypeId: $scope.model.paymentType,
                note: $scope.model.note
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
                url: '/Registration/Registration/RegisterExistingPatient',
                data: reservation
            }).success(function (res) {
                __self.closeModal();
            }).error(function (err) {
                $scope.model.errors.push(err);
            });
        } else {
            var newReservation = {
                doctorId: info.doctor.doctorId,
                date: $scope.model.date,
                fromTime: $scope.model.fromTime,
                toTime: $scope.model.toTime,
                paymentTypeId: $scope.model.paymentType,
                note: $scope.model.note
            };

            if (newReservation.paymentTypeId === 3 && $scope.model.fund.id > 0) {
                newReservation.paymentInfo = {
                    fundId: $scope.model.fund.id,
                    fundCardNumber: $scope.model.fundCardNumber,
                    fundCardExpiration: $scope.model.fundCardExpiration
                };
            }

            var patient = {
                firstName: $scope.model.newPatient.firstName,
                lastName: $scope.model.newPatient.lastName,
                identNumberTypeId: 1,
                genderId: 1,
                note: $scope.model.newPatient.note,
                patientPhones: [
                    {
                        typeId: 3,
                        number: $scope.model.newPatient.phoneNumber,
                        isPrimary: true
                    }
                ]
            };

            $http(
            {
                method: 'POST',
                url: '/Registration/Registration/RegisterNewPatient',
                data: {
                    reservation: newReservation,
                    patient: patient
                }
            }).success(function (res) {
                __self.closeModal();
            }).error(function (err) {
                $scope.model.errors.push(err);
            });
        }
    };

    $scope.cancel = function () {
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

app.directive('vmQtip', ['timeConverter', 'customFormatter', function (timeConverter, customFormatter) {
    return {
        link: function (scope, elm, attrs) {
            var setTip = function () {

                var content = "<div style='font-size: 12px'>";
                content += scope.doctor.title + " " + scope.doctor.firstName + " " + scope.doctor.lastName + "<br/>";
                if (scope.hour.work === 0)
                    content += 'Неработи';
                else {
                    if (scope.hour.isReserved) {
                        content += "Запазен";
                    } else {
                        if (scope.hour.isnzok)
                            content += 'Работи по здравна каса.';
                        else
                            content += 'Работи.';
                    }
                }
                content += '<br/>';
                content += 'Дата: ' + customFormatter.dateToUserString(scope.day.date) + ", Час: " + timeConverter.convertToHours(scope.hour.from) + " - " + timeConverter.convertToHours(scope.hour.to);
                if (scope.hour.isReserved) {
                    content += '<br/>';
                    content += 'Пациент: ' + scope.hour.reservation.firstName + ' ' + scope.hour.reservation.lastName;
                    content += '<br/>';
                    content += 'Телефон: ' + scope.hour.reservation.phone;
                    if (scope.hour.reservation.note) {
                        content += '<br/>';
                        content += 'Забележка: ' + scope.hour.reservation.note;
                    }
                }

                content += "</div>";
                elm.qtip({
                    content: {
                        text: content
                    },
                    position: {
                        my: 'bottom left',
                        at: 'top right',
                        //     target: 'mouse',
                        viewport: $(window)
                    },
                    show: {
                        solo: true
                    }
                });
            };

            var removeTip = function () {
                elm.qtip('destroy', true);
            };

            setTip();

            scope.$watch('hour.isReserved', function () {
                removeTip();
                setTip();
            });
        }
    };
}]);
