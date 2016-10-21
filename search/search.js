angular.module('myApp.search', ["ngRoute"])
    .controller('searchCtrl', function ($scope, $http, $uibModal, $timeout, apiUrl) {

        $scope.currentPage = {};
        $scope.searchItems = function () {
            $http({
                url: apiUrl + "/search?q=" + $scope.searchTerms.replace(/[\s]/g, '_') + "&r=subjects+exercises+collections",
                method: 'GET'

            }).success(function (response) {
                $scope.currentPage.value = 1;
                $scope.resultList = response;
                console.log(response);
            })
        };

        $scope.getResults = function (page) {
            return $scope.resultList.slice(10*(page-1), 10*page)
        };

        $scope.scrollTopResult = function () {
            window.scrollTo(0,120);
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
        };
        $scope.openCollectionModal = function (collection) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'collectionModal.html',
                controller: 'collectionModalCtrl',
                windowClass: 'app-modal-medium',
                resolve: {
                    exercises: function () {
                        return collection.exercises
                    },
                    collection: function () {
                        return collection
                    }
                }
            });
        };

        $scope.openSubjectModal = function (subject) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'subjectModal.html',
                controller: 'subjectModalCtrl',
                windowClass: 'app-modal-medium',
                resolve: {
                    subject: function () {
                        return subject
                    }
                }
            })
        }

    })
    .controller('subjectModalCtrl', function ($scope, subject) {
        $scope.subject = subject;
        $scope.openCollection = {};

    });