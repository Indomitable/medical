function WorkInterval(interval, nzok) {
    this.interval = interval;
    if (nzok)
        this.nzok = nzok;
    else
        this.nzok = false;
}

app.service('checkSchedule', ['$http', function ($http) {
    var __self = this;
    __self.interval = null;
    __self.currentVersion = 0;
    __self.onDiff = null;

    __self.start = function (version, onDiff) {
        __self.currentVersion = version;
        __self.onDiff = onDiff;
        __self.interval = setInterval(__self.check, 60 * 1000);
    }

    __self.stop = function () {
        clearInterval(__self.interval);
    }

    __self.refresh_now = function () {
        __self.check()
    }

    __self.check = function () {
        $http({
            method: 'GET',
            url: '/shedule/calendar/version'
        }).success(function (version) {
            if (__self.currentVersion != version && __self.onDiff)
                __self.onDiff();
        });
    }
}]);

app.controller('scheduleController', ['$scope', '$http', 'checkSchedule', function ($scope, $http, checkSchedule) {
    $scope.months = [];
    $scope.workIntervals = [];
    $scope.note = '';
    var __self = this;

    $scope.init = function (doctor) {
        __self.doctor = doctor;
        __self.getSchedule();

    }

    __self.getSchedule = function () {
        $http({
            method: 'GET',
            url: '/schedule/calendar',
            params: {
                months: 3,
                doctorId: __self.doctor
            }
        }).success(function (data) {
            $scope.months = [];
            for (var i = 0; i < data.months.length; i++) {
                $scope.months.push(data.months[i]);
            }
            //checkSchedule.start(data.schedule_version, function () { window.location.reload(true); });
        });
    }

    $scope.onDateClick = function (day) {
        if (day.date) {

            if (day.status > 0) {
                if (!day.selected) {
                    _.each(__self.getDays(), function (d) {
                        d.selected = false;
                    });
                }
            } else {
                _.each(__self.getDays(), function (d) {
                    if (d.status > 0)
                        d.selected = false;
                });
            }

            day.selected = !day.selected;

            if (day.selected) {
                $scope.workIntervals = [];
                $scope.note = '';
                if (day.status > 0) {
                    __self.load_day_schedules(day.date);
                }
            }
        }
    }

    __self.getDays = function () {
        var days = [];
        for (var i = 0; i < $scope.months.length; i++) {
            for (var j = 0; j < $scope.months[i].weeks.length; j++) {
                for (var k = 0; k < $scope.months[i].weeks[j].days.length; k++) {
                    days.push($scope.months[i].weeks[j].days[k]);
                }
            }
        }
        return days;
    }

    $scope.hasSelected = function () {
        return _.any(__self.getDays(), function(x) {
            return x.selected;
        });
    }

    $scope.setWorkHours = function () {
        for (var i = 0; i < $scope.workIntervals.length; i++) {
            if (__self.hasOverlappingInterval(i)) {
                alert("Има припокриващи се интервали!");
                return;
            }
        }
        var selectedDays = _.map(_.filter(__self.getDays(), function (x) {
            return x.selected;
        }), function (x) {
            return x.date;
        });
        $http({
            method: 'POST',
            url: '/schedule/sethours',
            data: {
                days: selectedDays,
                intervals: $scope.workIntervals,
                note: $scope.note,
                doctorId: __self.doctor
            }
        }).success(function(data) {
            alert('Hours were successfuly updated');
            //checkSchedule.refresh_now();
        });
    }

    $scope.addWorkHours = function () {
        var from = 8, to = 18;
        if ($scope.workIntervals.length > 0) {
            var lastInterval = $scope.workIntervals[$scope.workIntervals.length - 1].interval;
            if (lastInterval[1] < 23) {
                from = lastInterval[1] + 0.5;
                to = lastInterval[1] + 1;
            }
        }

        $scope.workIntervals.push(new WorkInterval([from, to]));
    }

    $scope.removeHour = function (interval_index) {
        $scope.workIntervals.splice(interval_index, 1);
    }

    $scope.fromHour = function (interval_index) {
        var part = ($scope.workIntervals[interval_index].interval[0] % 1) * 60;
        if (part < 10)
            part = '0' + part;
        return Math.floor($scope.workIntervals[interval_index].interval[0]) + ":" + part;
    }

    $scope.toHour = function (interval_index) {
        var part = ($scope.workIntervals[interval_index].interval[1] % 1) * 60;
        if (part < 10)
            part = '0' + part;
        return Math.floor($scope.workIntervals[interval_index].interval[1]) + ":" + part;
    }

    __self.hasOverlappingInterval = function (interval_index) {
        for (var i = 0; i < $scope.workIntervals.length; i++) {
            if (interval_index == i)
                continue;
            var interval1 = $scope.workIntervals[interval_index].interval;
            var interval2 = $scope.workIntervals[i].interval;
            if (interval2[0] < interval1[1] && interval2[1] > interval1[0]) {  //i2.from < i1.to and i2.to > i1.from
                return true;
            }
        }
    }

    $scope.is_overlapps = function (interval_index) {
        return __self.hasOverlappingInterval(interval_index);
    }

    __self.load_day_schedules = function (date) {
        $http({
            method: 'GET',
            url: '/schedule/getdate',
            params: {
                date: date,
                doctorId: __self.doctor
            }
        }).success(function (data) {
            if (!data)
                return;
            $scope.note = data.note;
            $scope.workIntervals = [];
            for (var i = 0; i < data.hours.length; i++) {
                var val = data.hours[i];
                $scope.workIntervals.push(new WorkInterval([val.from, val.to], val.nzok));
            }
        });
    }
}]);

app.filter('dayFormat', function () {
    return function (date) {
        if (!date) return '';
        return new Date(date).getDate();
    }
});