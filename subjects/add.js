angular.module('myApp.add', ['ngRoute'])
    .controller('addCtrl', function ($scope, $http, $cookies,$location, $uibModal, subjectService, requestService, apiUrl, focus, shuffle,alertify) {
        if(!subjectService.getUserSubjects()) {
            $location.path("/subjects")
        } else {
            requestService.httpGet("/subjects")
                .then(function (response) {
                    $scope.items = [];
                    for(var subject in response) {
                        $scope.items.push(response[subject]);
                    }
                    shuffle($scope.items)
                });
            $scope.addSubject = function (subject) {
                $http({
                    ignoreLoadingBar:true,
                    url: apiUrl +'/subjects/mine',
                    method: "POST",
                    data: {
                        "subject": {
                            code: subject.code,
                            name: subject.name,
                            published: 'no',
                            collections: subject.collections,
                            description: "Laget av ekte tælling " + $cookies.getObject('username')
                        }
                    },
                    headers: $cookies.getObject('token')

                }).success(function (response, status) {
                    $location.path("/subjects");
                }).error(function (status) {
                    alertify.error("Oops! Noe gikk galt...");
                    console.log({error: status});
                })
            };
            $scope.searchSubjects = function (val) {
                return $http({
                    url: apiUrl + "/subjects?search=" + val,
                    method:'GET',
                    ignoreLoadingBar:true
                })
                    .then(function (response) {
                        var resultList = [];
                        var resultInfoAdded = {};
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
                        resultList.push({
                            code: val.toUpperCase(),
                            name: "Opprett ny",
                            new: true
                        });
                        return resultList
                    })
            };
            $scope.selectedSubject = function (item) {
                if(item.new) {
                    $scope.editNew = true;
                    $scope.newCode = item.code;
                    $scope.newName = "";
                    focus('newName')

                }
                else {
                    $scope.openAddSubjectModal(item);
                }

            };
            $scope.cancelNew = function () {
                $scope.editNew = false;
                $scope.newCode = "";
                $scope.newName = "";
                $scope.searchTerm = "";
            };
            $scope.saveNew = function () {
                var newSubject = {
                    code: $scope.newCode,
                    name: $scope.newName,
                    collections: []

                };
                $scope.addSubject(newSubject)
            };

            $scope.quantity = 5;

            $scope.openAddSubjectModal = function (subject) {
                requestService.httpGet('/subjects/mine/' + subject._id).then(function (response) {
                    var modalInstance = $uibModal.open({
                        animation: true,
                        templateUrl: 'addSubjectModal.html',
                        controller: 'subjectModalCtrl',
                        windowClass: 'app-modal-window',
                        resolve: {
                            subject: function () {
                                return response;
                            }
                        }
                    });

                    modalInstance.result.then(function (subject) {
                        $scope.addSubject(subject)
                    }, function () {
                        $scope.searchTerm = "";
                    })
                });


            }
        }


    })
    .controller('subjectModalCtrl', function ($scope, $uibModalInstance, subject) {
        $scope.subject = subject;

        $scope.addSubject = function(includeSets) {
            if(!includeSets) {
                $scope.subject.collections = [];
            }
            angular.forEach(subject.collections, function (collection) {
                angular.forEach(collection.exercises, function (exercise) {
                    delete exercise._id
                })
                delete collection._id
            });

            $uibModalInstance.close($scope.subject)
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel')
        }
    });