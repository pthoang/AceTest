'use strict';

angular.module('myApp.subjects', ['ngRoute', 'ui.checkbox'])


    .controller('subjectsCtrl', function ($scope, $http, $cookies, $base64, $uibModal,$location, subjectService, requestService, apiUrl) {
        $scope.deleteMode = false;
        $scope.mouseOver = {};
        $scope.delete = {};
        $scope.userName = $cookies.getObject('username');
        requestService.httpGet("/subjects")
            .then(function (response) {
                console.log(response);
                subjectService.setUserSubjects(response.map(function (subject) {
                    return subject.id
                }));
                $scope.subjects = response;
        });

        $scope.deleteSubject = function (index) {
            $http({
                url: apiUrl + '/subjects/' + $scope.subjects[index].id,
                method: "DELETE",
                headers: $cookies.getObject('token')
            }).success(function (response, status) {
                $scope.subjects.splice(index, 1);
                delete $scope.delete[index];
                requestService.httpGet("/subjects")
                    .then(function (response) {
                        subjectService.setUserSubjects(response.map(function (subject) {
                            return subject.id
                        }));
                        $scope.subjects = response;
                    });
            })
        };

        $scope.setTargetSubject = function (target) {
            $scope.targetSubject = target.id;
            subjectService.setSubject(target);
            $location.path('subjects/' + $scope.targetSubject)

        };

        $scope.openAddSubjectModal = function () {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'addSubjectModal.html',
                controller: 'addSubjectModalCtrl',
                windowClass: 'app-modal-small'
            });

            modalInstance.result.then(function (insertedId) {
                $location.path('subjects/' + insertedId)
            })
        }

    })

    .controller('addSubjectModalCtrl', function ($scope, $http, $cookies, $uibModalInstance, $timeout, apiUrl, focus, alertify) {
        focus('newSubjectCode');
        $scope.getSubjectSuggestions = function (val) {

            return $http({
                url: apiUrl + "/search/subjects?code=" + val,
                method:'GET',
                ignoreLoadingBar:true
            })
                .then(function (response) {
                    var resultInfoAdded = {};
                    var resultList = [];
                    angular.forEach(response.data, function (subject) {
                        if(!resultInfoAdded[subject.code]) {
                            resultList.push(subject);
                            resultInfoAdded[subject.code] = [subject.name]
                        } else {
                            if(resultInfoAdded[subject.code].indexOf(subject.name) == -1) {
                                resultList.push(subject);
                                resultInfoAdded[subject.code].push(subject.name)
                            }
                        };
                    });
                    return resultList;
                })
        };

        $scope.selectedSubject = function (item) {
            $scope.newSubjectCode = item.code;
            if(!item.new) {
                if(!$scope.newSubjectName) {
                    $scope.newSubjectName = item.name;
                }
            }
            $timeout(function () {
                focus('newSubjectName')

            },0)
        };

        $scope.addSubject = function () {
            $http({
                ignoreLoadingBar:true,
                url: apiUrl +'/subjects',
                method: "POST",
                data: {
                    code: $scope.newSubjectCode.toUpperCase(),
                    name: $scope.newSubjectName,
                    published: 'no',
                    description: "Laget av " + $cookies.getObject('username')
                },
                headers: $cookies.getObject('token')

            }).success(function (response, status) {
                $uibModalInstance.close(response.insertedId);
            }).error(function (response, status) {
                alertify.error("Oops! Noe gikk galt...");
                console.log(response);
            })
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel')
        }
        
    });

