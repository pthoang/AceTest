var mc = {
    question: true,
    wrongs: true,
    corrects: true,
    explanation:true

};
var pd = {
    question: true,
    correct: true,
    explanation:true,
    tags: true
};
var tf = {
    question: true,
    correct: true,
    explanation: true
};

angular.module('myApp.edit', ['ngRoute'])
    .controller('editCtrl', function ($scope, $cookies, $window, $document, $http, $routeParams, $timeout, $location, $q, $uibModal,
                                      $rootScope, collectionService, subjectService, requestService, focus, apiUrl, alertify, hotkeys) {
        var ajv = new Ajv({removeAdditional: true});
        var validateExercise = function (schema, object) {
            return ajv.validate(schema, object);
        };

        if (!subjectService.getSubject()) {
            window.localStorage.setItem('refreshed', true);

            $location.path("/subjects/" + $routeParams.subjectId)
        }

        $scope.types = [{desc: "Phrase-Definition", type: "pd"},
            {desc: "Multiple Choice", type: "mc"},
            {desc: "True/False", type: "tf"}];
        $scope.typeDesc = {
            pd: "Phrase-Definition",
            mc: "Multiple Choice",
            tf: "True/False"
        };
        $scope.defaultType = "mc";
        $scope.exercises = [];
        $scope.files = [];
        $scope.clickedSave = false;
        $scope.extraProperty = {};
        $scope.editCollectionName = {};
        $scope.showRemChar = {};
        $scope.showLimitAlt = {};
        $scope.maxLengthAlternatives = 200;
        $scope.maxLengthQuestion = 500;
        if(subjectService.getSubject()) {
            $scope.subject = subjectService.getSubject();
        }
        //window.localStorage.setItem('refreshed', false);

        $scope.collection = $routeParams.collectionId == 'new' ? undefined : collectionService.getCollection();

        if (!$scope.collection || collectionService.getCollection().id != $routeParams.collectionId) {
            if ($routeParams.collectionId == 'new') {
                $scope.collection = {
                    name: '',
                    exercises: [],
                    public: true,
                    web_only: false
                };
                collectionService.setCollection($scope.collection);
                $scope.editCollectionName.value = true;
                focus('collectionName')
            } else {
                $location.path('/subjects/' + $routeParams.subjectId)
            }
        }
        if($routeParams.collectionId != "new") {
            requestService.httpGet("/collections/" + $routeParams.collectionId + "/exercises").then(function (response) {
                console.log(response)
                $scope.exercises = response
                if ($scope.exercises.length) {
                    var index = parseInt($scope.exercises.length) - 1;
                    $scope.defaultType = $scope.exercises[index].type;
                }
            });
        }







        //handles refresh
        // window.onbeforeunload = function (evt) {
        //     var message = 'Er du sikker på at du vil forlate?';
        //     if (typeof evt == 'undefined') {
        //         evt = window.event;
        //     }
        //     if (evt) {
        //         evt.returnValue = message;
        //     }
        //     return message;
        // };
        // window.onunload = function () {
        //     window.localStorage.setItem('refreshed', true);
        // };
        //
        // $scope.$on("$routeChangeStart", function (event, next, current) {
        //     if (!$scope.clickedSave) {
        //         if (!(next.$$route.originalPath.indexOf('/login') > -1)) {
        //             if(window.localStorage.getItem('refreshed') == 'false') {
        //                 if (!confirm("Alle endringer vil bli forkastet. Er du sikker på at du vil forlate denne siden? ")) {
        //                     event.preventDefault();
        //                 }
        //             }
        //         }
        //
        //     }
        // });

        $scope.onChangeHandler = function (exercise) {
            return function (e, fileObjects) {
                if (fileObjects) {
                    exercise.content.question.image = fileObjects;
                }
            }
        };

        $scope.backToSubjectPage = function(){
            $location.path('/subjects/' + $routeParams.subjectId);
        };
        //************************MC-specific functions***************************
        $scope.addAlternative = function (exercise) {
           exercise.content.alternatives.push({text: "", correct: false});
        };

        $scope.deleteAlternative = function (exercise, index) {
            exercise.content.alternatives.splice(index, 1)
        };


        $scope.changeAlternativeValue = function (event, exercise, index) {
            if(event.keyCode==13 && !event.shiftKey) {
                event.preventDefault();
                if(exercise.content.alternatives[index].correct) {
                    $scope.makeWrong(exercise, index)
                } else {
                    $scope.makeCorrect(exercise, index)
                }
                focus('alt-' + index)
            }
        };

        $scope.makeWrong = function (exercise, index) {
            if(index!=0) {
                exercise.content.alternatives[index].correct = false;
            };
        };

        $scope.makeCorrect = function (exercise, index) {
            exercise.content.alternatives[index].correct = true;
        };
        //******************************************************************************

        //************************TF-specific functions***************************
        $scope.changeAnswer = function (event, exercise) {
            if(event.keyCode==13 && !event.shiftKey) {
                event.preventDefault();
                exercise.content.correct = !exercise.content.correct
            }
        };


        // $scope.changeDefault = function (exercise, index) {
        //     $scope.defaultType = exercise.type;
        //     if(exercise.type == 'mc') {
        //         if(!exercise.content.alternatives) {
        //             exercise.content.alternatives = [{text: "", correct: true }];
        //         }
        //         if(!exercise.content.wrongs) {
        //             exercise.content.wrongs = [{answer: ""}];
        //         }
        //     } else if(exercise.type =='tf') {
        //         exercise.content.correct = {answer: true};
        //     }
        // };


        var orderUpdate = false;

        $scope.addExercise = function (type) {
            orderUpdate = true;
            var exercise = {
                content: {
                    type: type,
                    question: {}
                }
            };
            if(exercise.content.type == 'mc') {
                exercise.content.alternatives = [{text: "", correct: true}];
                for(var i=0; i < 2; i++) {
                    exercise.content.alternatives.push({text: "", correct: false})
                }
            } else if(exercise.content.type == 'tf') {
                exercise.content.correct = true;
            }
            $scope.exercises.push(exercise);
            $timeout(function () {
                window.scrollTo(0, document.body.scrollHeight);
            }, 0);
            $scope.choseActiveExercise($scope.exercises.length - 1);
            focus('activeQuestion');
            $scope.defaultType = type
        };

        $scope.confirmDelete = {};

        $scope.deleteExercise = function (index) {
            if($scope.confirmDelete[index]) {
                if($scope.exercises[index].id){
                    requestService.httpDelete('/exercises/' + $scope.exercises[index].id)
                        .then(function (response) {
                            $scope.exercises.splice(index, 1);
                            $scope.activeExercise = undefined;
                            alertify.success('Oppgaven er slettet')
                        }, function (response) {
                            console.log(response);
                            alertify.error('En feil oppstod under sletting av oppgaven')
                        })
                } else {
                    $scope.exercises.splice(index, 1);
                    $scope.activeExercise = undefined;
                    alertify.success('Oppgaven er slettet')
                }
                delete $scope.confirmDelete[index];
            } else {
                $scope.confirmDelete[index] = true;
            }
        };


        var filterAlternativeArray = function (array) {
            var alternativeRemoveList = [];
            for(var i=0; i < array.length; i++) {
                if(!array[i].text.length > 0) {
                    alternativeRemoveList.push(i)
                }
            }
            var removedCount = 0;
            angular.forEach(alternativeRemoveList, function (index) {
                array.splice(index-removedCount, 1);
                removedCount += 1;
            });
        };

        var updateCollection = function () {
            var updateData = {
                name: $scope.collection.name,
                order: orderUpdate? $scope.exercises.map(function (exercise) {
                    return exercise.id
                }) : undefined,
                web_only: $scope.collection.web_only
            };
            requestService.httpPut('/collections/' + $scope.collection.id, updateData)
                .then(function (response) {
                    console.log(updateData);
                    alertify.success('Endringer lagret');
                    orderUpdate = false;
                    console.log(response)
                }, function (response) {
                    console.log(response);
                    alertify.error('En feil oppstod ved lagring av endringene')
                });
        };
        $scope.choseActiveExercise = function (index) {
            if(index != $scope.activeExercise) {
                $scope.extraProperty = {};
                if($scope.activeExercise != undefined) {
                    var exercise = $scope.exercises[$scope.activeExercise];
                    var activeIndex = $scope.activeExercise;
                    if(exercise.content.type == 'mc') {
                        filterAlternativeArray(exercise.content.alternatives);
                        if(exercise.content.alternatives.length == 0) {
                            exercise.content.alternatives.push({text: 'Riktig', correct: true});
                            exercise.content.alternatives.push({text: "Galt", correct: false})
                        }

                    }
                    if(exercise.id) {
                        if(!angular.equals(exercise, $scope.exerciseCopy)) {
                            requestService.httpPut('/exercises/' + exercise.id, exercise.content)
                                .then(function (response) {
                                    console.log(response);
                                    alertify.success('Oppgaven lagret');
                                    delete exercise.error
                                }, function (response) {
                                    console.log(response);
                                    console.log(exercise);
                                    alertify.error('En feil oppstod ved lagring av oppgaven');
                                    exercise.error = true
                                })
                        }
                    } else {
                        requestService.httpPost('/collections/' + $scope.collection.id + '/exercises', exercise.content)
                            .then(function (response) {
                                exercise.id = response.insertedId;
                                alertify.success('Oppgaven lagret');
                                delete exercise.error;
                            }, function (response) {
                                console.log(response);
                                alertify.error('En feil oppstod ved lagring av oppgaven');
                                exercise.error = true
                            })
                    }

                }
            }
            if($scope.activeExercise != index) {
                $scope.activeExercise = index;
                $scope.exerciseCopy = $scope.activeExercise != undefined? angular.copy($scope.exercises[$scope.activeExercise]):{};
                focus('activeQuestion');
            }
            if($scope.editCollectionName.value) {
                if($scope.collection.id == undefined) {
                    $scope.collection.name = $scope.collection.name.length > 0 ? $scope.collection.name: "Oppgavesett uten navn";
                    var data = {
                                    name: $scope.collection.name,
                                    public: true
                                };
                    requestService.httpPost('/subjects/'+$routeParams.subjectId + "/collections", data)
                        .then(function (response) {
                            $scope.collection.id = response.insertedId;
                            alertify.success('Navn lagret');
                            console.log(response)
                        }, function (response) {
                            console.log(response);
                            alertify.error('En feil oppstod ved oppretting av oppgavesettet')
                        })
                } else {
                    if(!angular.equals($scope.collection.name, $scope.collectionNameCopy)) {
                        updateCollection()
                    }
                }
                $scope.editCollectionName.value = false;
            }
        };

        $scope.tabNextExercise = function () {
            $scope.choseActiveExercise(undefined);
        };

        $scope.setEditCollectionNameTrue = function () {
            $scope.choseActiveExercise(undefined);
            $scope.editCollectionName.value = true;
            $scope.collectionNameCopy = angular.copy($scope.collection.name);
            focus('collectionName')

        };

        $scope.changeWebOnly = function (value) {
            $scope.collection.web_only=value;
            $scope.editCollectionName.value = false;
            updateCollection()
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

        $scope.removeImage = function (index) {
            delete $scope.exercises[index].content.question.image;
            if(document.getElementById(index)) {
                document.getElementById(index).value = ''
            }
        };

        $scope.goToAddExercises = function () {
            $location.path('/subjects/' + $routeParams.subjectId + '/collections/' + $scope.collection.id + '/add')
        };

        hotkeys.bindTo($scope)
            .add({
                combo: '1',
                callback: function () {
                    $scope.addExercise('mc')
                }
            })
            .add({
                combo: '2',
                callback: function () {
                    $scope.addExercise('tf')
                }
            });

        $scope.dragControlListeners = {
            accept: function (sourceItemHandleScope, destSortableScope) {
                return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id
            },
            containment: "#editArea",
            allowDuplicate: true,
            orderChanged: function (event) {
                orderUpdate = true;
                // if (event.source.index == $scope.activeExercise) {
                //     $scope.extraProperty[event.dest.index] = $scope.extraProperty[event.source.index];
                //     $scope.activeExercise = event.dest.index;
                // } else {
                //     $scope.activeExercise = undefined
                // }
                updateCollection()
            },
            dragMove: function (itemPosition, containment, eventObj) {
                if (eventObj) {
                    var targetY = eventObj.pageY - ($window.pageYOffset || $document[0].documentElement.scrollTop);
                    if (targetY + 150 > $window.innerHeight) {
                        $window.scrollBy(0, 40);
                    } else if (targetY < 150) {
                        $window.scrollBy(0, -40);
                    }
                }
            }

        };


    });