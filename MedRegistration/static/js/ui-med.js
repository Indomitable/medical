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
                    elm.datepicker(
                    {
                        prevText: "",
                        nextText: "",
                        changeMonth: true,
                        changeYear: true,
                        firstDay: 1,
                        dateFormat: "dd/mm/yy",
                        dayNamesMin: ['Нед', 'Пон', 'Вт', 'Ср', 'Чет', 'Пет', 'Съб'],
                        monthNamesShort: ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември']
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
    .directive('medTimeInput', [function () {
        return {
            require: 'ngModel',
            template: '<input type="time"></input>',
            replace: true,
            link: function (scope, elm, attrs, ngModelCtrl) {
                if (!Modernizr.inputtypes.time) {
                    elm.timepicker(
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
    .directive('medWeekInput', [function () {
        return {
            require: 'ngModel',
            template: '<input type="week"></input>',
            replace: true,
            link: function (scope, elm, attrs, ngModelCtrl) {
                if (Modernizr.inputtypes.week) {
                    ngModelCtrl.$formatters.unshift(function (modelValue) {
                        if (modelValue) {
                            var weekStartDate = modelValue;
                            var onejan = new Date(weekStartDate.getFullYear(), 0, 1);
                            var weekNumber = Math.ceil((((weekStartDate - onejan) / (24 * 60 * 60 * 1000)) + onejan.getDay() + 1) / 7);
                            return weekStartDate.getFullYear() + "-W" + weekNumber;
                        }
                        return "";
                    });

                    ngModelCtrl.$parsers.unshift(function (viewValue) {
                        if (viewValue) {
                            var x = viewValue.split('-');
                            var year = parseInt(x[0]);
                            var week = parseInt(x[1].substr(1));
                            var firstJanuary = new Date(year, 0, 1); //Get 1st January
                            firstJanuary.setDate(firstJanuary.getDate() - (7 + firstJanuary.getDay() - 1) % 7); //Get First Monday
                            var d = (week - 1) * 7;
                            firstJanuary.setDate(firstJanuary.getDate() + d);
                            return firstJanuary;
                        }
                        return null;
                    });
                } else {
                    elm.datepicker(
                    {
                        prevText: "",
                        nextText: "",
                        changeMonth: true,
                        changeYear: true,
                        firstDay: 1,
                        dateFormat: "dd.mm.yy",
                        dayNamesMin: ['Нед', 'Пон', 'Вт', 'Ср', 'Чет', 'Пет', 'Съб'],
                        monthNamesShort: ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември']
                    });
                    ngModelCtrl.$formatters.unshift(function (modelValue) {
                        if (modelValue) {
                            modelValue.setDate(modelValue.getDate() - (7 + modelValue.getDay() - 1) % 7);
                            var day = modelValue.getDate() < 10 ? '0' + modelValue.getDate() : modelValue.getDate();
                            var month = (modelValue.getMonth() + 1) < 10 ? '0' + (modelValue.getMonth() + 1) : (modelValue.getMonth() + 1);
                            return day + '.' + month + '.' + modelValue.getFullYear();
                        }
                        return '';
                    });

                    ngModelCtrl.$parsers.unshift(function (viewValue) {
                        if (viewValue) {
                            var dateValue = viewValue.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
                            if (dateValue) {
                                var selectedDate = new Date(parseInt(dateValue[3]), parseInt(dateValue[2] - 1), parseInt(dateValue[1]));
                                selectedDate.setDate(selectedDate.getDate() - (7 + selectedDate.getDay() - 1) % 7);
                                return selectedDate;
                            } else
                                return null;
                        } else {
                            return null;
                        }
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
        'dateHelper', function (dateHelper) {
            return function (input) {
                return dateHelper.dateToUserString(input);
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
                return _.filter(collection, function (x) {
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
            var minutes = parseInt(parts[1]);
            return (hour * 60) + minutes;
        };
    }])
    .service('dateHelper', function () {
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

        __self.copyDate = function (date) {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        };

        __self.isDatesEqual = function (date1, date2) {
            return date1.getFullYear() === date2.getFullYear() && date1.getMonth() == date2.getMonth() && date1.getDate() === date2.getDate();
        };

        __self.parseDate = function (dateStr) {
            var dateValue = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
            return new Date(parseInt(dateValue[1]), parseInt(dateValue[2] - 1), parseInt(dateValue[3]));
        };
    });
