angular.module('myApp.addexercises', ['ngRoute'])
    .controller('addExercisesCtrl', function ($scope, $http, $uibModal, $routeParams, $location,
                                              subjectService, collectionService, requestService, apiUrl) {

        if(!collectionService.getCollection() || collectionService.getCollection().id != $routeParams.collectionId) {
            $location.path('/subjects/' + $routeParams.subjectId)
        }

        $scope.searchPath='exercises';
        $scope.addedExercises = {};
        $scope.currentPage = 1;
        $scope.addDestination = collectionService.getCollection().name;
        $scope.searchTerms = subjectService.getSubject().name;
        $scope.searchItems = function () {
            $http({
                url: apiUrl + "/search?q=" + $scope.searchTerms.replace(/[\s]/g,'_') + "&r=exercises",
                method: 'GET'

            }).success(function (response) {
                console.log(response)
                $scope.currentPage = 1;
                $scope.resultList = response;
            })
        };

        $scope.searchItems();

        $scope.goBack = function () {
            $location.path('/subjects/' + $routeParams.subjectId + '/collections/' + $routeParams.collectionId)
        };

        $scope.getResults = function () {
            return $scope.resultList.slice(10*($scope.currentPage-1), 10*$scope.currentPage)
        };

        $scope.addExercise = function (exercise) {
            var data = {
                type: exercise.type,
                content: exercise.content,
                source_id: exercise.id
            };
            requestService.httpPost('/collections/' + $routeParams.collectionId + '/exercises', data).then(function (response) {
                $scope.addedExercises[exercise.id] = response.insertedId;
                data.id = response.insertedId;
                collectionService.getCollection().exercises.push(data)
            });
        };

        $scope.removeExercise = function (exerciseId) {
            requestService.httpDelete('/exercises/' + $scope.addedExercises[exerciseId]).then(function (response) {
                for(var i=collectionService.getCollection().exercises.length-1; i >= 0 ; i--) {
                    if(collectionService.getCollection().exercises[i].id == $scope.addedExercises[exerciseId]) {
                        collectionService.getCollection().exercises.splice(i,1);
                        break;
                    }
                };
                delete $scope.addedExercises[exerciseId];
            });
        };

        $scope.openExerciseModal = function (exercise) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'exerciseModal.html',
                controller: 'exerciseModalCtrl',
                windowClass: 'app-modal-medium-middle',
                resolve: {
                    exercise: function () {
                        return exercise
                    }
                }
            })
        }
    })
    .controller('exerciseModalCtrl', function ($scope, exercise) {
        $scope.exercise = exercise;
        $scope.exerciseNumber = 0;

        $scope.getExerciseTags = function (exercise) {
            if (!exercise.tags || exercise.tags.length == 0) {
                return
            }

            if (typeof exercise.tags[0] == "string") {
                return exercise.tags
            } else {
                return exercise.tags.map(function (tag) {
                    return tag.text
                })
            }
        };
    });