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
    .controller('editCtrl', function ($scope, $cookies, $window, $document, $http, $routeParams, $timeout,
                                      $location, $q, $uibModal, $rootScope, collectionService, subjectService, requestService, focus, apiUrl,alertify) {
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
        $scope.files = [];
        $scope.clickedSave = false;
        $scope.extraProperty = {};
        $scope.editCollectionName = {};
        if(subjectService.getSubject()) {
            $scope.subjectName = subjectService.getSubject().name;
        }
        window.localStorage.setItem('refreshed', false);

        $scope.collection = $routeParams.collectionId == 'new' ? undefined : collectionService.getCollection();


        if (!$scope.collection || collectionService.getCollection().id != $routeParams.collectionId) {
            if ($routeParams.collectionId == 'new') {
                $scope.collection = {
                    name: '',
                    exercises: [],
                    public: true
                };
                collectionService.setCollection($scope.collection);
                $scope.editCollectionName.value = true;
                focus('collectionName')
            } else {
                $location.path('/subjects/' + $routeParams.subjectId)
            }
        }

        $scope.exercises = $scope.collection.exercises;

        if ($scope.exercises.length) {
            var index = parseInt($scope.exercises.length) - 1;
            $scope.defaultType = $scope.exercises[index].type;
        }





        //handles refresh
        window.onbeforeunload = function (evt) {
            var message = 'Er du sikker på at du vil forlate?';
            if (typeof evt == 'undefined') {
                evt = window.event;
            }
            if (evt) {
                evt.returnValue = message;
            }
            return message;
        };
        window.onunload = function () {
            window.localStorage.setItem('refreshed', true);
        };

        $scope.$on("$routeChangeStart", function (event, next, current) {
            if (!$scope.clickedSave) {
                if (!(next.$$route.originalPath.indexOf('/login') > -1)) {
                    if(window.localStorage.getItem('refreshed') == 'false') {
                        if (!confirm("Alle endringer vil bli forkastet. Er du sikker på at du vil forlate denne siden? ")) {
                            event.preventDefault();
                        }
                    }
                }

            }
        });

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
            });
            if($scope.mcAlternatives.length == 0) {
                $scope.mcAlternatives.push({answer: '', correct: true});
                $scope.mcAlternatives.push({answer: '', correct: false})
            }
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

        $scope.changeDefault = function (exercise, index) {
            $scope.defaultType = exercise.type;
            if(exercise.type == 'mc') {
                if(!exercise.content.corrects) {
                    exercise.content.corrects = [{answer: ""}];
                }
                if(!exercise.content.wrongs) {
                    exercise.content.wrongs = [{answer: ""}];
                }
            } else if(exercise.type == 'pd') {
                if(!exercise.content.tags) {
                    exercise.content.tags = [{text: $scope.collection.name.replace(/[\s]/g, '-')}]
                }
            } else if(exercise.type =='tf') {
                exercise.content.correct = {answer: true};
            }
        };

        var orderUpdate = false;

        $scope.addExercise = function () {
            orderUpdate = true;
            var exercise = {
                "type": $scope.defaultType,
                "content": {question: {}}
            };
            if(exercise.type == 'mc') {
                exercise.content.corrects = [{answer: ""}];
                exercise.content.wrongs = [{answer: ""}];
            } else if (exercise.type == 'pd') {
                exercise.content.correct = {};
                exercise.content.tags = [{text: $scope.collection.name.replace(/[\s]/g, '-')}]
            } else if(exercise.type == 'tf') {
                exercise.content.correct = {answer: true};
            }
            $scope.collection.exercises.push(exercise);
            $timeout(function () {
                window.scrollTo(0, document.body.scrollHeight);
            }, 0);
            $scope.choseActiveExercise($scope.collection.exercises.length - 1);
            focus('activeQuestion')
        };

        var deleteList = [];

        $scope.deleteExercise = function (index) {
            if($scope.exercises[index].id){
                deleteList.push($scope.exercises[index].id);
            }
            if (index > -1) {
                $scope.exercises.splice(index, 1);
            }
            $scope.activeExercise = undefined
        };

        var errorList = {};
        $scope.saveCollection = function (nextAction) {
            errorList = {};
            $scope.saveClicked = true;
            $scope.clickedSave = true;
            $scope.choseActiveExercise(undefined);
            var validateExercises = function (exercise) {
                exercise.collaborators = exercise.collaborators || [$cookies.getObject('username')];
                if (exercise.collaborators.indexOf($cookies.getObject('username')) == -1) {
                    exercise.collaborators.push($cookies.getObject('username'))
                };

                if (exercise.type == "mc") {
                    //exercise.wrongs = exercise.wrongs.filter(Boolean);
                    for(var property in exercise.content) {
                        if(!mc[property]) {
                            delete exercise.content[property]
                        }
                    }
                    validateExercise(mcSchema, exercise.content);
                } else if (exercise.type == "pd") {
                    if (!exercise.content.tags) {
                        exercise.content.tags = [];
                    }
                    for(var property in exercise.content) {
                        if(!pd[property]) {
                            delete exercise.content[property]
                        }
                    }
                    exercise.content.correct.answer = exercise.content.correct.answer.toString();
                    validateExercise(pdSchema, exercise.content)
                } else if (exercise.type == "tf") {
                    for(var property in exercise.content) {
                        if(!tf[property]) {
                            delete exercise.content[property]
                        }
                    }
                    validateExercise(tfSchema, exercise.content)
                };

            };
            var initHttpRequests = [];
            if ($scope.collection.id == undefined) {
                var data = {
                    name: $scope.collection.name,
                    inOrder: $scope.collection.inOrder? true:false,
                    public: true
                };
                initHttpRequests.push(requestService.httpPost('/subjects/'+$routeParams.subjectId + "/collections",
                    data, function (response) {
                    $scope.collection.id = response.insertedId;
                }));
            };

            var sendExercises = [];
            angular.forEach($scope.exercises, function (exercise) {
                validateExercises(exercise);
                if (exercise.content.question.image && !exercise.content.question.image.url) {
                    var data = {
                        filetype: exercise.content.question.image[0].filetype,
                        base64: exercise.content.question.image[0].base64,
                        subjectId: subjectService.getSubject().id
                    };
                    initHttpRequests.push(requestService.putImage(data, function (response) {
                        exercise.content.question.image = {
                            url: response.secure_url
                        }
                    }))
                }
            });
            $q.all(initHttpRequests).then(function () {
                angular.forEach($scope.exercises, function (exercise, index) {
                    if(!exercise.id) {
                        sendExercises.push(requestService.httpPost('/collections/' + $scope.collection.id + '/exercises'
                            , exercise, function (response) {
                                exercise.id = parseInt(response.insertedId)
                            },errorList, index))
                    } else {
                        sendExercises.push(requestService.httpPut('/exercises/' + exercise.id, exercise, errorList, index))
                    }
                });
                angular.forEach(deleteList, function (exerciseId) {
                    sendExercises.push(requestService.httpDelete('/exercises/' + exerciseId))
                });
                $q.all(sendExercises).then(function (response) {
                    var data = {
                        name: $scope.collection.name,
                        inOrder: $scope.collection.inOrder,
                        order: orderUpdate? $scope.collection.exercises.map(function (exercise) {
                            return exercise.id
                        }) : undefined
                    };
                    requestService.httpPut('/collections/'+ $scope.collection.id, data).then(function (response) {
                        if(nextAction == 'goToSubject') {
                            $location.path('/subjects/' + $routeParams.subjectId);
                        }
                        else if(nextAction == 'goToAdd') {
                            if($routeParams.collectionId == 'new') {
                                $location.replace();
                            }
                            $location.path('/subjects/' + $routeParams.subjectId + '/collections/' + $scope.collection.id + '/add')
                        }
                    }, function (response) {
                        if(response.status==400) {
                            alertify.error('En feil oppstod. Kontroller navnet på settet')
                        }
                        $scope.saveClicked = false;
                    })
                }, function (response) {
                    console.log(response);
                    alertify.error('En eller flere feil oppstod. Kontroller markerte oppgaver');
                    $scope.saveClicked = false;
                });
            }, function (response) {
                console.log(response);
                $scope.saveClicked = false;
            });

        };

        $scope.isInErrorList = function (index) {
            return errorList[index];
        };

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
        };

        $scope.choseActiveExercise = function (index) {
            if(index != $scope.activeExercise) {
                $scope.extraProperty = {};
                if($scope.activeExercise != undefined) {
                    if($scope.exercises[$scope.activeExercise].type == 'mc') {
                        filterAlternativeArray($scope.mcAlternatives);
                        $scope.exercises[$scope.activeExercise].content.corrects = [];
                        $scope.exercises[$scope.activeExercise].content.wrongs = [];
                        angular.forEach($scope.mcAlternatives, function (alternative) {
                            if(alternative.correct) {
                                $scope.exercises[$scope.activeExercise].content.corrects.push({answer: alternative.answer});
                            } else {
                                $scope.exercises[$scope.activeExercise].content.wrongs.push({answer: alternative.answer})
                            }
                        });


                    }

                }
            }
            $scope.activeExercise = index;
            $scope.editCollectionName.value = false;
        };

        $scope.tabNextExercise = function () {
            if($scope.activeExercise+1 < $scope.exercises.length) {
                $scope.choseActiveExercise($scope.activeExercise+1);
                focus('activeQuestion')
            } else {
                $scope.addExercise()
            }
        };

        $scope.setEditCollectionNameTrue = function () {
            $scope.editCollectionName.value = true;
            focus('collectionName')

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
            delete $scope.collection.exercises[index].content.question.image;
            if(document.getElementById(index)) {
                document.getElementById(index).value = ''
            }
        };


        $scope.dragControlListeners = {
            accept: function (sourceItemHandleScope, destSortableScope) {
                return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id
            },
            containment: "#editArea",
            allowDuplicate: true,
            orderChanged: function (event) {
                orderUpdate = true;
                if (event.source.index == $scope.activeExercise) {
                    $scope.extraProperty[event.dest.index] = $scope.extraProperty[event.source.index];
                    $scope.activeExercise = event.dest.index;
                } else {
                    $scope.activeExercise = undefined
                }
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