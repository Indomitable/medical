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
        var sortedSchedules = _.sortBy(doctor.Schedule, function (x) { return x.FromTime; });
        doctor.hours = [];

        for (var i = 0; i < sortedSchedules.length; i++) {
            var schedule = sortedSchedules[i];
            if (i == 0) {
                doctor.hours.push({
                    work: 0,
                    from: weekMinHour,
                    to: schedule.FromTime
                });
            } else {
                doctor.hours.push({
                    work: 0,
                    from: sortedSchedules[i - 1].ToTime,
                    to: schedule.FromTime
                });
            }

            var time = schedule.FromTime + doctor.ExamTime;
            while (time < schedule.ToTime) {
                doctor.hours.push({
                    work: 1,
                    from: time - doctor.ExamTime,
                    to: time,
                    isNZOK: schedule.IsNZOK
                });
                time += doctor.ExamTime;
            }
            if (time - doctor.ExamTime < schedule.ToTime) {
                doctor.hours.push({
                    work: 1,
                    from: time - doctor.ExamTime,
                    to: schedule.ToTime,
                    isNZOK: schedule.IsNZOK
                });
            }

            if (i == sortedSchedules.length - 1) {
                doctor.hours.push({
                    work: 0,
                    from: schedule.ToTime,
                    to: weekMaxHour
                });
            }
        }

    };

    __self.getSchedule = function() {
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
            for (var k = data.WeekMinHour; k < data.WeekMaxHour; k+=60) {
                __self.hours.push(k/60);
            }
            __self.days.splice(0, __self.days.length);
            for (var i = 0; i < data.Schedule.length; i++) {
                var dt = data.Schedule[i].Date;
                for (var j = 0; j < data.Schedule[i].Doctors.length; j++) {
                    var doctor = data.Schedule[i].Doctors[j];
                    __self.buildHours(data.WeekMinHour, data.WeekMaxHour, doctor);
                }
                __self.days.push({
                    date: new Date(dt),
                    doctors: data.Schedule[i].Doctors
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

        name: function() {
            return "От: " + customFormatter.dateToUserString(__self.from) + ", До: " + customFormatter.dateToUserString(__self.to);
        },

        next: function() {
            __self.from.setDate(__self.from.getDate() + 7);
            __self.to.setDate(__self.to.getDate() + 7);
            __self.getSchedule();
        },

        prev: function() {
            __self.from.setDate(__self.from.getDate() - 7);
            __self.to.setDate(__self.to.getDate() - 7);
            __self.getSchedule();
        }
    }
}]);

app.controller('registrationController', ['$scope', '$http', 'customFormatter', 'week', '$modal',
    function ($scope, $http, customFormatter, week, $modal) {
        $scope.week = week;

        $scope.registerHour = function(doctor, hour) {
            var addRegistrationInstance = $modal.open({
                templateUrl: '/Registration/Register',
                controller: registrationAddController
            });
            addRegistrationInstance.result.then(function () {

            });
        };
    }
]);

var registrationAddController = function ($scope, $modalInstance) {
    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};

app.filter('nonZeroHour', [function () {
    return function (hours) {
        return _.filter(hours, function(h) {
            return h.to - h.from > 0;
        });
    };
}]);

app.directive('vmQtip', function () {
    return {
        link: function (scope, elm, attrs) {
            var content = scope.doctor.Title + " " + scope.doctor.FirstName + " " + scope.doctor.LastName + "<br/>"; 
            if (scope.hour.work === 0)
                content += 'Неработи';
            else {
                if (scope.hour.isNZOK)
                    content += 'Работи по здравна каса.';
                else
                    content += 'Работи.';
            }
            content += '<br/>';
            var hour = Math.floor(scope.hour.from / 60);
            if (hour < 10)
                hour = '0' + hour;
            var minute = Math.round(((scope.hour.from / 60) % 1) * 60);
            if (minute < 10)
                minute = '0' + minute;
            content += 'Начало: ' + hour + ":" + minute;
            content += '<br/>';

            hour = Math.floor(scope.hour.to / 60);
            if (hour < 10)
                hour = '0' + hour;
            minute = Math.round(((scope.hour.to / 60) % 1) * 60);
            if (minute < 10)
                minute = '0' + minute;
            content += 'Край: ' + hour + ":" + minute;
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
});