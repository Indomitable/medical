angular.module('ui.med', [])
	.directive('medDateInput', function (dateFilter) {
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
	})
	.filter('dateDisplay', ['customFormatter', function (formatter) {
		return function (input) {
			return formatter.dateToUserString(input);
		};
	}])
	.filter('skip', [function () {
		return function (collection, cnt) {
			var buf = [];
			for (var i = 0; i < collection.length; i++) {
				if (i < cnt)
					continue;
				buf.push(collection[i]);
			}
			return buf;
		};
	}]);