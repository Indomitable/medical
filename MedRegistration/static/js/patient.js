app.controller("patientsController", ["$scope", "$modal", function ($scope, $modal) {
    $scope.add = function () {
        var addPatientInstance = $modal.open({
            templateUrl: '/Patient/Add',
            controller: 'patientAddController'
        });
        addPatientInstance.result.then(function () {

        });
    };
}]);

app.controller("patientAddController", ['$scope', '$http', '$modalInstance', function ($scope, $http, $modalInstance) {
    $scope.data = {};
    $scope.data.identTypes = [
                 { id: 1, name: 'ЕГН' },
                 { id: 2, name: 'ЛНЧ' },
                 { id: 3, name: 'Частично ЕГН' }
    ];

    $scope.data.genders = [
                 { id: 1, name: 'Мъж' },
                 { id: 2, name: 'Жена' }
    ];

    $scope.data.phoneTypes = [
                 { id: 1, name: 'Домашен' },
                 { id: 2, name: 'Работен' },
                 { id: 3, name: 'Мобилен' }
    ];

    $scope.model = {
        identType: $scope.data.identTypes[0],
        gender: $scope.data.genders[0],
        paymentType: "1",
        errors: [],
        phones: {
            data: [],
            primary: ""
        }
    };

    $scope.addNewPhone = function () {
        $scope.model.phones.data.push({
            phoneType: $scope.data.phoneTypes[2],
            number: ""
        });
    };

    $scope.removePhone = function (phone) {
        var indx = $scope.model.phones.data.indexOf(phone);
        $scope.model.phones.data.splice(indx, 1);
    };

    $scope.fundDetailsVisible = function() {
        return $scope.model.paymentType == "2";
    };

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.getLocation = function (val) {

        function extractCountry(item) {
            for (var i = 0; i < item.address_components.length; i++) {
                var component = item.address_components[i];
                if (_.any(component.types, function (t) { return t == "country"; }))
                    return component.long_name;
            }
            return "";
        }

        function extractPostCode(item) {
            for (var i = 0; i < item.address_components.length; i++) {
                var component = item.address_components[i];
                if (_.any(component.types, function (t) { return t == "postal_code"; }))
                    return component.long_name;
            }
            return "";
        }

        function extractTown(item) {
            //Get first administrative area level
            for (var i = 0; i < item.address_components.length; i++) {
                var component = item.address_components[i];
                if (_.any(component.types, function (t) { return t.indexOf("administrative_area_level") == 0; }))
                    return component.long_name;
            }
            return "";
        }

        return $http.get('http://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: val,
                sensor: false
            }
        }).then(function (res) {
            var addresses = [];
            angular.forEach(res.data.results, function (item) {
                addresses.push(
                {
                    address: item.formatted_address,
                    country: extractCountry(item),
                    postCode: extractPostCode(item),
                    town: extractTown(item)
                });
            });
            return addresses;
        });
    };

    $scope.addressSelected = function ($item, address) {
        address.country = $item.country;
        address.postCode = $item.postCode;
        address.town = $item.town;
    };

    $scope.$watch('model.identNumber', function (newVal, oldVal) {
        if (newVal && newVal.length === 10 && $scope.model.identType.id === 1) {
            var num = parseInt(newVal.charAt(8));
            if (!isNaN(num)) {
                if (num % 2 === 0) {
                    $scope.model.gender = $scope.data.genders[0];
                } else {
                    $scope.model.gender = $scope.data.genders[1];
                }
            }
        }
    });
}]);

app.controller("patientAddFormController", [
    '$scope', '$http', function ($scope, $http) {
        $scope.save = function() {
            $scope.model.errors = [];
            if ($scope.detailsForm.$invalid) {
                $scope.model.errors.push("Моля попълнете всички задължителни полета!");
            }
            if ($scope.model.phones.data.length === 0 || _.all($scope.model.phones.data, function(p) { return !p.number || p.number.trim() === ""; })) {
                $scope.model.errors.push("Моля въведете поне един телефонен номер!");
            }
            if ($scope.model.errors.length > 0)
                return false;
            var patient = {
                firstName: $scope.model.firstName,
                middleName: $scope.model.middleName,
                lastName: $scope.model.lastName,
                identNumberTypeId: $scope.model.identType.id,
                identNumber: $scope.model.identNumber,
                email: $scope.model.email,
                town: $scope.model.town,
                postCode: $scope.model.postCode,
                address: $scope.model.address,
                genderId: $scope.model.gender.id
            };

            $http(
            {
                method: 'POST',
                url: '/Patient/Save',
                data: patient
            }).success(function() {
                $scope.ok();
            }).fail(function(err) {
                $scope.model.errors.push(err);
            });
            return true;
        };
    }
]);