angular.module('myApp.collections', ['ngRoute'])

    .controller('collectionsCtrl', function ($scope, $window, $cookies, $http, $uibModal, $q, $routeParams, $location,
                                             subjectService, collectionService, requestService,alertify, focus) {

        $scope.subject = subjectService.getSubject();
        $scope.deletedCollections = {};
        $scope.admin = $cookies.getObject('admin');

        var initCollections = function (subject) {
            $scope.collections = subject.collections;
        };
        var initReports = function (reportInfo) {
            $scope.reportInfo = reportInfo;
        };
        var refresh = function () {
            requestService.httpGet("/subjects/" + $routeParams.subjectId)
                .then(function (response) {
                    $scope.subject = response;
                    $scope.nameCopy = $scope.subject.name;
                    $scope.descriptionCopy = $scope.subject.description;
                    subjectService.setSubject($scope.subject);
                    initCollections(response);
                    console.log(response);
                    requestService.httpGet('/subjects/' + $routeParams.subjectId + '/reports').then(function (response) {
                        initReports(response)
                    })
                });
        };
        refresh();

        $scope.setTargetCollection = function (index) {
            var targetId = index=='new'? 'new':$scope.subject.collections[index].id;
            subjectService.setSubjectToCopy(subjectService.getSubjectCopy());
            $scope.subject = subjectService.getSubject();
            var collectionIdList = $scope.subject.collections.map(function (collection) {
                return collection.id
            });
            if(index != "new") {
                $scope.targetCollection = $scope.subject.collections[collectionIdList.indexOf(targetId)].id;
                collectionService.setCollection($scope.subject.collections[collectionIdList.indexOf(targetId)])
            }
            $location.path("subjects/" + $scope.subject.id + "/collections/" + targetId)

        };

        $scope.deleteCollection = function (coll, index) {
            $scope.deletedCollections[$scope.subject.collections[index].id] = true;
        };

        $scope.undoDeleteCollection = function (collectionId) {
            delete $scope.deletedCollections[collectionId];
        };

        $scope.saveSubject = function () {
            var data = {
                    name: $scope.subject.name,
                    description: $scope.subject.description,
                    code: $scope.subject.code,
                    order: orderUpdate ? $scope.collections.map(function (collection) {
                        if(!$scope.deletedCollections[collection.id]) {
                            return collection.id
                        }
                    }) : undefined
            };
            var requests = [];
            angular.forEach($scope.deletedCollections, function (value, collectionId) {
                if(value) {
                    requests.push(requestService.httpDelete('/collections/' + collectionId))
                }
            });
            console.log($scope.collections);
            requests.push(requestService.httpPut('/subjects/' + $scope.subject.id, data));
            $q.all(requests)
                .then(function (response) {
                    refresh();
                    alertify.success("Suksess! Endringene dine ble lagret.");
                },function(response){
                    console.log(response);
                    // $scope.errorMsg = response.errors[0].dataPath.split('.');
                    // if($scope.errorMsg.length == 3){
                    //     if($scope.errorMsg[2].indexOf('name') > -1) {
                    //         alertify.error("Fagnavn mangler! Fyll ut og prøv igjen...");
                    //     }
                    //     else{
                    //         alertify.error("Oops, noe gikk galt! Prøv igjen...");
                    //
                    //     }
                    // }
                    // else{
                    //     alertify.error("Oops, noe gikk galt! Prøv igjen...")
                    //
                    // }

                })
        };

        $scope.publishSubject = function (value) {
            var data = {
                published: value

            };
            requestService.httpPut('/subjects/'+$routeParams.subjectId+'/published', data).then(function (response) {
                refresh();
            });
        };

        $scope.previewSubject = function () {
            $window.open('http://acetest.herokuapp.com/#/preview/' + $scope.subject.id + '/' + $scope.subject.hash, '_blank');
        };

        var orderUpdate = false;
        $scope.dragControlListeners = {
            accept: function (sourceItemHandleScope, destSortableScope) {
                return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
            },
            allowDuplicates: true,
            containment: "#collectionsArea",
            orderChanged: function (event) {
                orderUpdate = true;
            }
        };

        $scope.goTo = function(path){
            $location.path(path);
        };

        $scope.unFocus = function () {
            $scope.editSubjectName = false;
            $scope.editSubjectDescription = false;
        };

        $scope.setEditTrue = function (id) {
            if(id=='subjectName') {
                $scope.editSubjectName = true;
            }
            else {
                $scope.editSubjectDescription = true;
            }
            focus(id)
        };

        $scope.openReportModal = function () {
            subjectService.setSubjectToCopy(subjectService.getSubjectCopy());
            $scope.subject = subjectService.getSubject();
            initCollections($scope.subject);
            $scope.changesMade = {};
            $scope.changesMade.value = false;
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'reportModal.html',
                controller: 'reportModalCtrl',
                windowClass: 'app-modal-large',
                resolve: {
                    reportInfo: function () {
                        return $scope.reportInfo
                    },
                    changesMade: function () {
                        return $scope.changesMade
                    }
                }

            });

            modalInstance.result.then(function () {
                if($scope.changesMade.value) {
                    refresh();
                }
            }, function () {
                if($scope.changesMade.value) {
                    refresh();
                }
            });
        };

    })
    .controller('reportModalCtrl', function ($scope, $http, $uibModalInstance, $routeParams,
                                             $q, reportInfo, changesMade, subjectService, requestService, apiUrl) {
        $scope.changesMade = changesMade;
        $scope.reportInfo = reportInfo;
        $scope.extraProperty = {};

        var previewMaxLength = 200;
        var initReportInfo = function (reportInfo) {
            angular.forEach(reportInfo, function (item) {
                item.lastAdded = item.reports[0].created;
                item.preview = item.exercise.content.question.text.length > previewMaxLength ?
                    item.exercise.content.question.text.substr(0, previewMaxLength): item.exercise.content.question.text;
            });
            $scope.reportInfo.sort(function (a, b) {
                return a.lastAdded < b.lastAdded ? -1:1;
            });
        };
        initReportInfo($scope.reportInfo);
        var filterAlternativeArray = function (array) {
            var alternativeRemoveList = [];
            for(var i=0; i < array.length; i++) {
                if(!array[i].answer.length > 0) {
                    alternativeRemoveList.push(i)
                }
            }
            var removedCount = 0;
            angular.forEach(alternativeRemoveList, function (index) {
                array.splice(index-removedCount, 1);
                removedCount += 1;
            });
            if(array.length == 0) {
                array.push({answers:''})
            };
        };

        $scope.onChosenExercise = function (index) {
            console.log($scope.activeExercise);
            $scope.removeElements = {};
            $scope.exerciseInfo = $scope.reportInfo[index];
            $scope.exerciseInfo.index = index;
            $scope.exercise = angular.copy($scope.reportInfo[index].exercise);

            $scope.exerciseReportArrays = [[], []];
            $scope.splitPoint = Math.ceil($scope.exerciseInfo.reports.length / 2);

            for (var i = 0; i < $scope.splitPoint; i++) {
                $scope.exerciseReportArrays[0].push($scope.exerciseInfo.reports[i]);
            }

            for (var j = $scope.splitPoint; j < $scope.exerciseInfo.reports.length; j++) {
                $scope.exerciseReportArrays[1].push($scope.exerciseInfo.reports[j]);
            }

        };

        $scope.closeActiveExercise = function () {
            $scope.extraProperty = {};
            if($scope.activeExercise != undefined) {
                if($scope.exercise.type == 'mc') {
                    filterAlternativeArray($scope.mcAlternatives);
                    $scope.exercise.content.corrects = [];
                    $scope.exercise.content.wrongs = [];
                    angular.forEach($scope.mcAlternatives, function (alternative) {
                        if(alternative.correct) {
                            $scope.exercise.content.corrects.push({answer: alternative.answer});
                        } else {
                            $scope.exercise.content.wrongs.push({answer: alternative.answer})
                        }
                    });


                }

            }
            $scope.activeExercise = undefined;
        };

        $scope.addAlternative = function (exercise) {
            $scope.mcAlternatives.push({answer: "", correct: false});
        };

        $scope.deleteAlternative = function (index) {
            $scope.mcAlternatives.splice(index, 1)
        };

        $scope.initAlternatives = function (exercise) {
            $scope.mcAlternatives = [];
            angular.forEach(exercise.content.corrects, function (correct) {
                var correctCopy = angular.copy(correct);
                correctCopy.correct = true;
                $scope.mcAlternatives.push(correctCopy);
            });
            angular.forEach(exercise.content.wrongs, function (wrong) {
                var wrongCopy = angular.copy(wrong);
                wrongCopy.correct = false;
                $scope.mcAlternatives.push(wrongCopy);
            })
        };

        $scope.focusNextAlternative = function (event, last, index) {
            if(event.keyCode==13 && !event.shiftKey) {
                event.preventDefault();
                if(last) {
                    $scope.addAlternative()
                }
                focus('alt-'+(index+1));
            }
        };

        $scope.makeWrong = function (exercise, index) {
            if(index!=0) {
                $scope.mcAlternatives[index].correct = false;
            };
        };

        $scope.makeCorrect = function (exercise, index) {
            $scope.mcAlternatives[index].correct = true;
        };

        $scope.getImage = function (image) {
            if (!image.url) {
                return ("data:" + image[0].filetype + ";base64, " + image[0].base64);
            } else {
                var imageUrlParts = image.url.split('/');
                imageUrlParts[imageUrlParts.indexOf("upload") + 1] = "h_140";
                imageUrlParts.splice(0, 2);
                var newUrl = "https:/";
                angular.forEach(imageUrlParts, function (part) {
                    newUrl = newUrl + "/" + part
                });
                return newUrl;
            }
        };

        $scope.removeImage = function () {
            delete $scope.exercise.content.question.image;
            if(document.getElementById('0')) {
                document.getElementById('0').value = ''
            }
        };

        $scope.onChangeHandler = function (exercise) {
            return function (e, fileObjects) {
                if (fileObjects) {
                    exercise.content.question.image = fileObjects;
                }
            }
        };

        $scope.saveChanges = function () {
            console.log($scope.exercise);
            $scope.closeActiveExercise();
            var imageUpload =[];
            if($scope.exercise.content.question.image && !$scope.exercise.content.question.image.url) {
                var imageData = {
                    filetype: $scope.exercise.content.question.image[0].filetype,
                    base64: $scope.exercise.content.question.image[0].base64,
                    subjectId: subjectService.getSubject().id
                };
                imageUpload.push(requestService.putImage(imageData, function (response) {
                    $scope.exercise.content.question.image = {url: response.secure_url}
                }))
            }
            $q.all(imageUpload).then(function () {
                if ($scope.exercise.type == "mc") {
                    if($scope.exercise.content.wrongs) {
                        filterAlternativeArray($scope.exercise.content.wrongs)
                    }
                    if($scope.exercise.content.corrects) {
                        filterAlternativeArray($scope.exercise.content.corrects)
                    }
                }
                requestService.httpPut('/exercises/' + $scope.exerciseInfo.exercise.id, $scope.exercise).then(function () {
                    var deleteReportRequests = [];

                    $scope.changesMade.value = true;
                    angular.forEach($scope.removeElements, function (value) {
                        if(value) {
                            deleteReportRequests.push(requestService.httpDelete('/reports/' + value))
                        }
                    });
                    $q.all(deleteReportRequests).then(function (response) {
                        requestService.httpGet('/subjects/' + $routeParams.subjectId + '/reports')
                            .then(function (response) {
                                $scope.reportInfo = response;
                                initReportInfo($scope.reportInfo);
                                $scope.extraProperty = {};
                                $scope.activeExercise = undefined;
                                $scope.exercise = undefined;
                            })
                    });
                })

            });
        };

        $scope.removeAllReports = function (index) {
            var confirmRemoveAll = confirm('Sikker på at du vil slette alle tilbakemeldingene?');
            if(confirmRemoveAll){
                $http({
                    url: apiUrl + '/reports/' + $scope.exercises[index].exerciseId,
                    method: 'PUT',
                    data: {
                        reports: []
                    }
                }).success(function () {
                    $scope.exercises.splice(index, 1);
                });
            }
        };

        $scope.goToOverview = function () {

            $scope.extraProperty = {};
            $scope.exercise = undefined;
            $scope.activeExercise = undefined;
            console.log(subjectService.getSubject())
            
        };
        $scope.cancel = function () {
            $scope.exercise = undefined;
        };
        $scope.close = function () {
            $uibModalInstance.close();
        };

    });