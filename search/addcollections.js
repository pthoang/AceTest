angular.module('myApp.addcollections', ['ngRoute'])

    .controller('addCollectionsCtrl', function ($scope, $http, $routeParams, $uibModal, $q, $cookies, $location,
                                                subjectService, collectionService, requestService, apiUrl) {
        $scope.searchPath = 'collections';
        $scope.addedCollections = {};
        $scope.currentPage = 1;

        $scope.searchItems = function () {
            $http({
                url: apiUrl + "/search/collections?search=" + $scope.searchTerms.replace(/[\s]/g, '_'),
                method: 'GET'

            }).success(function (response) {
                $scope.currentPage = 1;
                $scope.resultList = response;
            })
        };

        $scope.goBack = function () {
            $location.path('/subjects/' + $routeParams.subjectId)
        };

        $scope.getResults = function () {
            return $scope.resultList.slice(10*($scope.currentPage-1), 10*$scope.currentPage)
        };

        $scope.addCollection = function (collection, addExercises) {
            var data = {
                name: collection.name,
                inOrder: false
            };
            var initAddRequests = [];
            initAddRequests.push(requestService.httpPost('/subjects/'+$routeParams.subjectId + '/collections', data));
            if(!addExercises){
                initAddRequests.push(requestService.httpGet('/collections/' + collection.id + '/exercises'));
            }
            $q.all(initAddRequests).then(function (response) {
                var insertedId = response[0].insertedId;
                if(!addExercises) {
                    addExercises = response[1]
                }
                var exerciseRequests = [];
                angular.forEach(addExercises, function (exercise) {
                    var data = {
                        type: exercise.type,
                        content: exercise.content,
                        source_id: exercise.id
                    };
                    exerciseRequests.push(requestService.httpPost('/collections/'+insertedId+'/exercises',
                        data));
                });
                $q.all(exerciseRequests).then(function (response) {
                    $scope.addedCollections[collection.id] = insertedId
                })

            });
        };

        $scope.removeCollection = function (collection) {
            requestService.httpDelete('/collections/' + $scope.addedCollections[collection.id]).then(function (response) {
                delete $scope.addedCollections[collection.id];
            })
        };

        $scope.openCollectionModal = function (collection) {
            requestService.httpGet('/collections/'+collection.id+'/exercises').then(function (response) {
                $scope.exercises = response;
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'collectionModal.html',
                    controller: 'collectionModalCtrl',
                    windowClass: 'app-modal-medium',
                    resolve: {
                        exercises: function () {
                            return $scope.exercises
                        },
                        collection: function () {
                            return collection
                        }
                    }
                });

                modalInstance.result.then(function (exercises) {
                    console.log(exercises);
                    $scope.addCollection(collection, exercises)
                })
            });
        };
    })
    .controller('collectionModalCtrl', function ($scope, $uibModalInstance, exercises, collection) {
        $scope.exercises = exercises;
        $scope.collection = collection;
        $scope.addExercises = {};

        $scope.chosenExercise = function (exercise) {
            if($scope.addExercises[exercise.id]) {
                delete $scope.addExercises[exercise.id]

            } else {
                $scope.addExercises[exercise.id] = exercise
            }
        };

        $scope.addSelected = function () {
            $uibModalInstance.close(Object.keys($scope.addExercises).map(function (key) {
                return $scope.addExercises[key];
            }));
        };

        $scope.addAll = function () {
            $uibModalInstance.close($scope.exercises);
        };

        $scope.close = function () {
            $uibModalInstance.dismiss('cancel')
        }

    });