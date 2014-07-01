app.controller('usersController', ['$scope', '$modal', '$http', function ($scope, $modal, $http) {
    var __self = this;
    $scope.users = [];
    __self.openUser = function (id) {
        var userInstance = $modal.open({
            templateUrl: '/Configuration/UserAdministration/Add',
            controller: 'userAddController',
            resolve: {
                id: function () {
                    return id;
                }
            }
        });
        userInstance.result.then(function () {
            __self.loadUsers();
        });
    }

    __self.loadUsers = function () {
        $http({
            method: 'GET',
            url: '/Configuration/UserAdministration/GetUsers'
        }).success(function (users) {
            $scope.users = users;
        });
    };

    __self.loadUsers();


    $scope.add = function () {
        __self.openUser(-1);
    }

    $scope.edit = function (id) {
        __self.openUser(id);
    }
}]);

app.controller('userAddController', [
    '$scope', '$http', '$q', '$modalInstance', 'id', function ($scope, $http, $q, $modalInstance, id) {
        var __self = this;
        $scope.data = {
            roles: []
        };

        $scope.model = {
            id: 0,
            userName: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            email: '',
            errors: []
        };

        __self.loadRoles = function () {
            return $http({
                method: 'GET',
                url: '/Configuration/UserAdministration/GetRoles'
            }).success(function (roles) {
                $scope.data.roles.pushAll(_.map(roles, function (r) {
                    return {
                        id: r.id,
                        name: r.name,
                        checked: false
                    }
                }));
            });
        };

        __self.loadData = function () {
            var waits = [];
            waits.push(__self.loadRoles());
            return $q.all(waits);
        };

        __self.loadUser = function () {
            $http({
                method: 'GET',
                url: '/Configuration/UserAdministration/GetUser',
                params: {
                    id: id
                }
            }).success(function (user) {
                $scope.model.userName = user.userName;
                $scope.model.firstName = user.firstName;
                $scope.model.lastName = user.lastName;
                $scope.model.email = user.email;

                if (user.roles) {
                    for (var i = 0; i < user.roles.length; i++) {
                        var role = $scope.roles.find(function(r) { return r.id == user.roles[i].id; });
                        if (role)
                            role.checked = true;
                    }
                }
            });
        };

        __self.loadData().then(function () {
            if (id > 0)
                __self.loadUser();
        });

        $scope.save = function () {
            $scope.model.errors.clear();
            if (!$scope.model.userName) {
                $scope.model.errors.push("Моля въведете потребителско име!");
            }
            if ($scope.model.password != $scope.model.confirmPassword) {
                $scope.model.errors.push("Двете пароли не са еднакви!");
            }
            if (!$scope.model.firstName) {
                $scope.model.errors.push("Моля въведете първо име!");
            }
            if (!$scope.model.lastName) {
                $scope.model.errors.push("Моля въведете фамилия!");
            }
            if (!$scope.model.email) {
                $scope.model.errors.push("Моля въведете електронна поща!");
            }
            if ($scope.model.errors.length > 0)
                return false;

            var user = {
                id: $scope.model.id,
                userName: $scope.model.userName,
                passwordName: $scope.model.password,
                firstName: $scope.model.firstName,
                lastName: $scope.model.lastName,
                email: $scope.model.email
            };
            var roles = [];
            for (var i = 0; i < $scope.data.roles.length; i++) {
                var role = $scope.data.roles[i];
                if (role.checked)
                    roles.push(role.id);
            }
            $http(
            {
                method: 'POST',
                url: '/Configuration/UserAdministration/Save',
                data: {
                    user: user,
                    roles: roles
                }
            }).success(function (res) {
                __self.ok();
            }).error(function (err) {
                $scope.model.errors.push(err);
            });

            return true;
        };

        __self.ok = function () {
            $modalInstance.close();
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.delete = function () {
            if (confirm('Сигурни ли сте, че искате да изтриете потребителя: ' + $scope.model.firstName + ' ' + $scope.model.lastName)) {
                $http(
                {
                    method: 'POST',
                    url: '/Configuration/UserAdministration/Delete',
                    data: {
                        id: $scope.model.id
                    }
                }).success(function (res) {
                    __self.ok();
                }).error(function (err) {
                    $scope.model.errors.push(err);
                });
            }
        }
    }
]);