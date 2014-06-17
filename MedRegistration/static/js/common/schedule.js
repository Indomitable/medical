function WorkInterval(interval, nzok) {
    this.interval = interval;
    if (nzok)
        this.nzok = nzok;
    else
        this.nzok = false;
}

app.controller('scheduleController', ['$scope', '$http', 'timeConverter', function ($scope, $http, timeConverter) {
    $scope.months = [];
    $scope.workIntervals = [];
    $scope.note = '';
    $scope.model = {
        errors: []
    };
    var __self = this;

    $scope.init = function (doctor) {
        __self.doctor = doctor;
        __self.getSchedule();

    }

    __self.getSchedule = function () {
        $http({
            method: 'GET',
            url: '/Common/Schedule/Calendar',
            params: {
                months: 3,
                doctorId: __self.doctor
            }
        }).success(function (data) {
            $scope.months = [];
            for (var i = 0; i < data.months.length; i++) {
                $scope.months.push(data.months[i]);
            }
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
        $scope.model.errors = [];
        for (var i = 0; i < $scope.workIntervals.length; i++) {
            if (__self.hasOverlappingInterval(i)) {
                $scope.model.errors.push("Има припокриващи се интервали!"); 
                break;
            }
        }
        if ($scope.model.errors.length > 0)
            return;
        var selectedDays = _.map(_.filter(__self.getDays(), function (x) {
            return x.selected;
        }), function (x) {
            return x.date;
        });
        var intervals = _.map($scope.workIntervals, function (w) {
            if (w.interval[1] === 1440) //Instead of 24:00 write 23:59
                w.interval[1] = 1439;
            return {
                fromTime: timeConverter.convertToHours(w.interval[0]),
                toTime: timeConverter.convertToHours(w.interval[1]),
                nzok: w.nzok
            };
        });
        $http({
            method: 'POST',
            url: '/Common/Schedule/SetHours',
            data: {
                days: selectedDays,
                intervals: intervals,
                note: $scope.note,
                doctorId: __self.doctor
            }
        }).success(function(data) {
            __self.getSchedule();
        });
    }

    $scope.addWorkHours = function () {
        var from = 8 * 60, to = 17 * 60;
        if ($scope.workIntervals.length > 0) {
            var lastInterval = $scope.workIntervals[$scope.workIntervals.length - 1].interval;
            if (lastInterval[1] < 23 * 60) {
                from = lastInterval[1] + 30;
                to = lastInterval[1] + 60;
            }
        }

        $scope.workIntervals.push(new WorkInterval([from, to]));
    }

    $scope.removeHour = function (interval_index) {
        $scope.workIntervals.splice(interval_index, 1);
    }

    $scope.fromHour = function (interval_index) {
        return timeConverter.convertToHours($scope.workIntervals[interval_index].interval[0]);
    }

    $scope.toHour = function (interval_index) {
        return timeConverter.convertToHours($scope.workIntervals[interval_index].interval[1]);
    }

    __self.hasOverlappingInterval = function(interval_index) {
        for (var i = 0; i < $scope.workIntervals.length; i++) {
            if (interval_index == i)
                continue;
            var interval1 = $scope.workIntervals[interval_index].interval;
            var interval2 = $scope.workIntervals[i].interval;
            if (interval2[0] < interval1[1] && interval2[1] > interval1[0]) { //i2.from < i1.to and i2.to > i1.from
                return true;
            }
        }
        return false;
    };

    $scope.is_overlapps = function (interval_index) {
        return __self.hasOverlappingInterval(interval_index);
    }

    __self.load_day_schedules = function (date) {
        $http({
            method: 'GET',
            url: '/Common/Schedule/GetDate',
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