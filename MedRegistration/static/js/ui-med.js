angular.module('ui.med', [])
    .directive('medDateInput', ['dateFilter', function (dateFilter) {
        return {
            require: 'ngModel',
            template: '<input type="date"></input>',
            replace: true,
            link: function (scope, elm, attrs, ngModelCtrl) {
                if (Modernizr.inputtypes.date) {

                    ngModelCtrl.$formatters.unshift(function (modelValue) {
                        return dateFilter(modelValue, 'yyyy-MM-dd');
                    });

                    ngModelCtrl.$parsers.unshift(function (viewValue) {
                        return new Date(viewValue);
                    });
                } else {
                    $(elm[0]).datepicker(
                    {
                        prevText: "",
                        nextText: "",
                        changeMonth: true,
                        changeYear: true,
                        dateFormat: "dd/mm/yy"
                    });
                    ngModelCtrl.$formatters.unshift(function (modelValue) {
                        return dateFilter(modelValue, 'dd/MM/yyyy');
                    });

                    ngModelCtrl.$parsers.unshift(function (viewValue) {
                        if (viewValue) {
                            var dateValue = viewValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                            if (dateValue)
                                return new Date(parseInt(dateValue[3]), parseInt(dateValue[2] - 1), parseInt(dateValue[1]));
                            else
                                return new Date();
                        } else {
                            return new Date();
                        }
                    });
                }
            },
        };
    }])
    .directive('medTimeInput', ['dateFilter', function (dateFilter) {
        return {
            require: 'ngModel',
            template: '<input type="time"></input>',
            replace: true,
            link: function (scope, elm, attrs, ngModelCtrl) {
                if (!Modernizr.inputtypes.time) {
                    $(elm[0]).timepicker(
                    {
                        timeOnlyTitle: 'Изберете час',
                        timeText: 'Време:',
                        hourText: 'Час:',
                        minuteText: 'Минути:',
                        closeText: 'Избор',
                        currentText: 'Сега',
                        timeFormat: 'HH:mm',

                    });
                }
            },
        };
    }])
    .directive('uiRangeSlider', [function () {
        return {
            require: 'ngModel',
            link: function (scope, elm, attrs, ngModelCtrl) {
                var options = {
                    range: true,
                    rangeDrag: true,
                    slide: function (event, ui) {
                        ngModelCtrl.$setViewValue(ui.values);
                        scope.$apply();
                    }
                };
                if (attrs.min)
                    options.min = parseInt(attrs.min);
                if (attrs.max)
                    options.max = parseInt(attrs.max);
                if (attrs.step)
                    options.step = parseInt(attrs.step);

                ngModelCtrl.$formatters.unshift(function (modelValue) {
                    if (options.min && options.min > modelValue[0])
                        modelValue[0] = options.min;
                    if (options.max && options.max < modelValue[1])
                        modelValue[1] = options.max;
                    options.values = modelValue;
                    elm.dragslider(options);
                });
            }
        };
    }])
    .filter('dateDisplay', [
        'customFormatter', function (formatter) {
            return function (input) {
                return formatter.dateToUserString(input);
            };
        }
    ])
    .filter('skip', [
        function () {
            return function (collection, cnt) {
                var buf = [];
                for (var i = 0; i < collection.length; i++) {
                    if (i < cnt)
                        continue;
                    buf.push(collection[i]);
                }
                return buf;
            };
        }
    ])
    .filter('multiSearch', [
        function () {
            var searchMethod = function (item, queryText) {
                if (!queryText)
                    return true;
                var subQueries = queryText.split(' ');
                var test = 0;
                for (var i = 0; i < subQueries.length; i++) {
                    var subQuery = subQueries[i];
                    for (var p in item) {
                        if (p === "$$hashKey" || p === "id" || !item[p])
                            continue;
                        if (item[p].toLocaleLowerCase().indexOf(subQuery.toLocaleLowerCase()) > -1) {
                            test++;
                            break;
                        }
                    }
                }
                return test == subQueries.length;
            }

            return function (collection, queryString) {
                if (collection.length == 0 || !queryString)
                    return collection;
                return _.filter(collection, function(x) {
                    return searchMethod(x, queryString);
                });
            };
        }
    ])
    .service('timeConverter', [function () {
        var __self = this;
        __self.convertToHours = function (val) {
            var hour = Math.floor(val / 60);
            if (hour < 10)
                hour = '0' + hour;
            var minute = Math.round(((val / 60) % 1) * 60);
            if (minute < 10)
                minute = '0' + minute;
            return hour + ':' + minute;
        };

        __self.convertFromDecimal = function (val) {
            return __self.convertToHours(val * 60);
        };

        __self.convertToMinutes = function (val) {
            var parts = val.split(':');
            var hour = parseInt(parts[0]);
            var minutes = parseInt(parseInt[0]);
            return (hour * 60) + minutes;
        };
    }])
    .service('customFormatter', function () {
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
