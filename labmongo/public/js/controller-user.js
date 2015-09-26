controllers.controller('UserController', ['$scope', 'User', function($scope, User) {
    $scope.userList = User.query();

    $scope.save = function () {
        if($scope.newUser.id){
            User.update($scope.newUser);
        }else{
            User.insert($scope.newUser);
        }
    }

    $scope.delete = function (id) {

        User.remove(id);
        if ($scope.newUser.id == id) $scope.newUser = {};
    }

    $scope.edit = function (id) {
        var editUser = User.get({
            _id: id
        }, function(data){
            $scope.newUser = angular.copy(data);
        });

    }

}]);