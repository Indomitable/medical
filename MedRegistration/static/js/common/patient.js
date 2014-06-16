app.controller("patientsController", ["$scope", '$http', "$modal", function ($scope, $http, $modal) {
    var __self = this;
    $scope.patients = [];
    __self.openPatient = function (id) {
        var patientInstance = $modal.open({
            templateUrl: '/Common/Patient/Add',
            controller: 'patientAddController',
            resolve: {
                id: function () {
                    return id;
                }
            }
        });
        patientInstance.result.then(function () {
            __self.loadPatients();
        });
    }

    __self.loadPatients = function () {
        $http({
            method: 'GET',
            url: '/Common/Patient/GetPatients'
        }).success(function (patients) {
            $scope.patients = patients;
        });
    };

    __self.loadPatients();

    $scope.add = function () {
        __self.openPatient(0);
    };

    $scope.edit = function (id) {
        __self.openPatient(id);
    };
}]);

app.controller("patientAddController", ['$scope', '$http', '$q', '$modalInstance', 'id', function ($scope, $http, $q, $modalInstance, id) {

    var __self = this;

    __self.loadData = function () {
        var waits = [];
        waits.push(__self.loadFunds());
        return $q.all(waits);
    };

    __self.loadFunds = function () {
        return $http({
            method: 'GET',
            url: '/Common/Patient/GetFunds'
        }).success(function (funds) {
            $scope.data.funds.pushAll(funds);
        });
    };

    __self.loadPatient = function () {
        $http({
            method: 'GET',
            url: '/Common/Patient/GetPatient',
            params: {
                id: id
            }
        }).success(function (patient) {
            var model = $scope.model;
            model.firstName = patient.firstName;
            model.middleName = patient.middleName;
            model.lastName = patient.lastName;
            model.identType = $scope.data.identTypes.find(function (x) { return x.id === patient.identNumberTypeId; });
            model.identNumber = patient.identNumber;
            model.gender = $scope.data.genders.find(function (x) { return x.id === patient.genderId; });
            model.email = patient.email;
            model.address = patient.address;
            model.town = patient.town;
            model.postCode = patient.postCode;
            model.note = patient.note;

            model.phones.pushAll(patient.patientPhones, function (phone) {
                return {
                    type: $scope.data.phoneTypes.find(function (x) { return x.id === phone.typeId; }),
                    number: phone.number,
                    isPrimary: phone.isPrimary
                };
            });

            if (patient.patientFundInfo) {
                model.fund = $scope.data.funds.find(function (x) { return x.id === patient.patientFundInfo.fundId; });
                model.fundCardNumber = patient.patientFundInfo.fundCardNumber;
                model.fundCardExpiration = patient.patientFundInfo.fundCardExpiration;
            }
        });
    };

    $scope.data = {
        identTypes: [
                 { id: 1, name: 'ЕГН' },
                 { id: 2, name: 'ЛНЧ' },
                 { id: 3, name: 'Частично ЕГН' }
        ],
        genders: [
                 { id: 1, name: 'Мъж' },
                 { id: 2, name: 'Жена' }
        ],
        phoneTypes: [
                { id: 1, name: 'Домашен' },
                { id: 2, name: 'Работен' },
                { id: 3, name: 'Мобилен' }
        ],
        funds: [
             { id: 0, name: '-- Изберете Фонд --' }
        ]
    };

    $scope.model = {
        id: id,
        firstName: '',
        middleName: '',
        lastName: '',
        identNumber: '',
        email: '',
        town: '',
        postCode: '',
        address: '',
        note: '',
        fund: $scope.data.funds[0],
        fundCardNumber: '',
        fundCardExpiration: '',
        identType: $scope.data.identTypes[0],
        gender: $scope.data.genders[0],
        paymentType: "1",
        errors: [],
        phones: []
    };

    __self.loadData().then(function () {
        if (id > 0)
            __self.loadPatient();
    });

    $scope.addNewPhone = function () {
        var isPrimary = $scope.model.phones.length === 0;
        $scope.model.phones.push({
            type: $scope.data.phoneTypes[2],
            number: "",
            isPrimary: isPrimary
        });
    };

    $scope.removePhone = function (phone) {
        $scope.model.phones.remove(phone);
        if (phone.isPrimary && $scope.model.phones.length > 0) {
            $scope.model.phones[0].isPrimary = true;
        }
    };

    $scope.onSelectPrimaryPhone = function (phone) {
        for (var i = 0; i < $scope.model.phones.length; i++) {
            if ($scope.model.phones[i] != phone)
                $scope.model.phones[i].isPrimary = false;
        }
        phone.isPrimary = true;
    };

    $scope.fundDetailsVisible = function () {
        return $scope.model.paymentType == "2";
    };

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
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

    $scope.$watch('model.fund', function (newVal, oldVal) {
        if (newVal && newVal.id === 0) {
            $scope.model.fundCardNumber = '';
            $scope.model.fundCardExpiration = null;
        }
    });
}]);

app.controller("patientAddFormController", [
    '$scope', '$http', function ($scope, $http) {
        $scope.save = function () {
            $scope.model.errors = [];
            if ($scope.detailsForm.$invalid) {
                $scope.model.errors.push("Моля попълнете всички задължителни полета!");
            }
            if ($scope.model.phones.length === 0 || _.all($scope.model.phones, function (p) { return !p.number || p.number.trim() === ""; })) {
                $scope.model.errors.push("Моля въведете поне един телефонен номер!");
            }
            if ($scope.model.errors.length > 0)
                return false;

            if (_.all($scope.model.phones, function (p) { return !p.isPrimary; })) {
                $scope.model.phones[0].isPrimary = true;
            }

            var patient = {
                id: $scope.model.id,
                firstName: $scope.model.firstName,
                middleName: $scope.model.middleName,
                lastName: $scope.model.lastName,
                identNumberTypeId: $scope.model.identType.id,
                identNumber: $scope.model.identNumber,
                email: $scope.model.email,
                town: $scope.model.town,
                postCode: $scope.model.postCode,
                address: $scope.model.address,
                note: $scope.model.note,
                genderId: $scope.model.gender.id,
                patientPhones: $scope.model.phones,
            };

            for (var i = 0; i < patient.patientPhones.length; i++) {
                patient.patientPhones[i].typeId = patient.patientPhones[i].type.id;
            }

            if ($scope.model.fund.id > 0) {
                patient.patientFundInfo = {
                    fundId: $scope.model.fund.id,
                    fundCardNumber: $scope.model.fundCardNumber,
                    fundCardExpiration: $scope.model.fundCardExpiration
                };
            }

            $http(
            {
                method: 'POST',
                url: '/Common/Patient/Save',
                data: patient
            }).success(function (res) {
                $scope.ok();
            }).error(function (err) {
                $scope.model.errors.push(err);
            });
            return true;
        };

        $scope.delete = function () {
            if (confirm('Сигурни ли сте, че искате да изтриете пациента: ' + $scope.model.firstName + ' ' + $scope.model.lastName)) {
                $http(
                {
                    method: 'POST',
                    url: '/Common/Patient/Delete',
                    data: {
                        id: $scope.model.id
                    }
                }).success(function (res) {
                    $scope.ok();
                }).error(function (err) {
                    $scope.model.errors.push(err);
                });
            }
        }
    }
]);