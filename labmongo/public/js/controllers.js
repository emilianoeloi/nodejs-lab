/**
 * Created by emiliano.barbosa on 08/04/14.
 */
var vdcControllers = angular.module('vdcControllers', []);

vdcControllers.controller('TeacherController', ['$scope', 'Teacher', function($scope, Teacher) {
    $scope.teacherList = Teacher.query();

    $scope.save = function () {
        console.debug('save', $scope.newTeacher.id);
        if($scope.newTeacher.id){
            Teacher.update($scope.newTeacher);
        }else{
            Teacher.insert($scope.newTeacher);
        }
    }

    $scope.delete = function (id) {

        Teacher.remove(id);
        if ($scope.newTeacher.id == id) $scope.newTeacher = {};
    }

    $scope.edit = function (id) {
        var editTeacher = Teacher.get({
            _id: id
        }, function(data){ 
            console.log('edit', 'data', data);
            $scope.newTeacher = angular.copy(data);
        });
        
    }

}]);