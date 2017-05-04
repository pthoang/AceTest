angular.module('myApp.collections', ['ngRoute', 'ngjsColorPicker'])

    .controller('collectionsCtrl', function ($scope, $window, $cookies, $http, $uibModal, $q, $routeParams, $location,
                                             subjectService, collectionService, requestService,alertify, focus) {

        $scope.subject = subjectService.getSubject();
        $scope.confirmDelete = {};
        $scope.admin = $cookies.getObject('admin');
        $scope.customColors = ['#00B16A','#03C9A9','#049372','#16A085', '#1ba39c',
            '#2574a9','#61B1D5','#5c97bf','#6C7A89','#89c4f4','#22A7F0','#045B9E','#38365E','#674172','#663399',
            '#913D88','#D2527F','#DB0A5B','#D24D57','#F14743','#F64747','#D8270E','#AF4203','#9C2100','#FE4210','#d35400',
            '#F2784B','#E88B0A','#FFA800','#F7C511','#F3D610','#FFB860'];
        $scope.colorPickerOptions = {
            columns: 8,
            size: 30
        };

        var initCollections = function (collections) {
            $scope.collections = collections;
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
                    console.log(response);

                    requestService.httpGet("/subjects/" + $routeParams.subjectId + "/collections").then(function (response) {
                        initCollections(response);
                    });
                    requestService.httpGet('/subjects/' + $routeParams.subjectId + '/reports').then(function (response) {
                        console.log(response)
                        initReports(response)
                    })
                });
        };
        refresh();

        $scope.setTargetCollection = function (index) {
            var targetId = index=='new'? 'new':$scope.collections[index].id;
            subjectService.setSubjectToCopy(subjectService.getSubjectCopy());
            $scope.subject = subjectService.getSubject();
            var collectionIdList = $scope.collections.map(function (collection) {
                return collection.id
            });
            if(index != "new") {
                $scope.targetCollection = $scope.collections[collectionIdList.indexOf(targetId)].id;
                console.log($scope.collections[collectionIdList.indexOf(targetId)])
                collectionService.setCollection($scope.collections[collectionIdList.indexOf(targetId)])
            }
            $location.path("subjects/" + $scope.subject.id + "/collections/" + targetId)

        };

        $scope.deleteCollection = function (coll, index) {
            if($scope.confirmDelete[$scope.collections[index].id]) {
                requestService.httpDelete('/collections/' + $scope.collections[index].id)
                    .then(function (response) {
                        refresh();
                        alertify.success('Oppgavesett slettet')
                    }, function (response) {
                         alertify.success('En feil oppstod under slettingen')
                    })
            } else {
                $scope.confirmDelete[$scope.collections[index].id] = true;
            }
        };

        $scope.undoDeleteCollection = function (collectionId) {
            delete $scope.confirmDelete[collectionId];
        };

        $scope.saveSubject = function () {
            var data = {
                    name: $scope.subject.name,
                    description: $scope.subject.description,
                    code: $scope.subject.code,
                    color: $scope.subject.color ? $scope.subject.color: undefined,
                    order: orderUpdate ? $scope.collections.map(function (collection) {
                            return collection.id;
                    }) : undefined
            };
            requestService.httpPut('/subjects/' + $scope.subject.id, data)
                .then(function (response) {
                    refresh();
                    alertify.success("Alle endringer lagret");
                }, function (response) {
                    console.log(response);
                    alertify.error('En feil oppstod under lagringen')
                });
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
                $scope.saveSubject();
            }
        };

        $scope.goTo = function(path){
            $location.path(path);
        };

        $scope.unFocus = function () {
            if(($scope.editSubjectName || $scope.editSubjectDescription || $scope.editSubjectCode) &&
                (!angular.equals($scope.subject.name, $scope.subjectNameCopy) ||
                !angular.equals($scope.subject.description, $scope.descriptionCopy) ||
                !angular.equals($scope.subject.code, $scope.codeCopy))) {

                $scope.saveSubject();
            }
            $scope.editSubjectName = false;
            $scope.editSubjectDescription = false;
            $scope.editSubjectCode = false;
        };

        $scope.setEditTrue = function (id) {
            $scope.unFocus();
            $scope.subjectNameCopy = angular.copy($scope.subject.name);
            $scope.descriptionCopy = angular.copy($scope.subject.description)
            $scope.codeCopy = angular.copy($scope.subject.code)
            if(id=='subjectName') {
                $scope.editSubjectName = true;
            } else if(id=='subjectDescription'){
                $scope.editSubjectDescription = true;
            } else if(id =='subjectCode') {
                $scope.editSubjectCode = true;
            }
            focus(id)
        };

        $scope.selectColor = function (color) {
            $scope.subject.color = color;
            $scope.saveSubject();
        };

        //****************Sort colors*************
        var Color = function Color(hexVal) { //define a Color class for the color objects
            this.hex = hexVal;
        };

        var constructColor = function(colorObj){
            var hex = colorObj.hex.substring(1);
            /* Get the RGB values to calculate the Hue. */
            var r = parseInt(hex.substring(0, 2), 16) / 255;
            var g = parseInt(hex.substring(2, 4), 16) / 255;
            var b = parseInt(hex.substring(4, 6), 16) / 255;

            /* Getting the Max and Min values for Chroma. */
            var max = Math.max.apply(Math, [r, g, b]);
            var min = Math.min.apply(Math, [r, g, b]);


            /* Variables for HSV value of hex color. */
            var chr = max - min;
            var hue = 0;
            var val = max;
            var sat = 0;


            if (val > 0) {
                /* Calculate Saturation only if Value isn't 0. */
                sat = chr / val;
                if (sat > 0) {
                    if (r == max) {
                        hue = 60 * (((g - min) - (b - min)) / chr);
                        if (hue < 0) {
                            hue += 360;
                        }
                    } else if (g == max) {
                        hue = 120 + 60 * (((b - min) - (r - min)) / chr);
                    } else if (b == max) {
                        hue = 240 + 60 * (((r - min) - (g - min)) / chr);
                    }
                }
            }
            colorObj.chroma = chr;
            colorObj.hue = hue;
            colorObj.sat = sat;
            colorObj.val = val;
            colorObj.luma = 0.3 * r + 0.59 * g + 0.11 * b;
            colorObj.red = parseInt(hex.substring(0, 2), 16);
            colorObj.green = parseInt(hex.substring(2, 4), 16);
            colorObj.blue = parseInt(hex.substring(4, 6), 16);
            return colorObj;
        };

        var sortColorsByHue = function (colors) {
            return colors.sort(function (a, b) {
                return a.hue - b.hue;
            });
        };

        var sortColors  = function () {
            var colors = [];
            angular.forEach($scope.customColors, function (color) {
                var color = new Color(color);
                constructColor(color);
                colors.push(color)
            });
            sortColorsByHue(colors);
            $scope.customColors = colors.map(function (color) {
                return color.hex
            });
        };
        sortColors();



        $scope.openReportModal = function () {
            subjectService.setSubjectToCopy(subjectService.getSubjectCopy());
            $scope.subject = subjectService.getSubject();
            initCollections($scope.collections);
            $scope.changesMade = {};
            $scope.changesMade.value = false;
            console.log($scope.reportInfo)
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
                                             $q, reportInfo, changesMade, subjectService, requestService, apiUrl, focus, alertify) {
        $scope.changesMade = changesMade;
        $scope.reportInfo = reportInfo;
        $scope.extraProperty = {};
        $scope.limitReports = 3;
        $scope.showLimitAlt = {};
        $scope.inDeleteReportList = {};
        $scope.maxLengthAlternatives = 200;
        $scope.maxLengthQuestion = 500;
        //var previewMaxLength = 200;
        var initReportInfo = function (reportInfo) {
            angular.forEach(reportInfo, function (item) {
                item.lastAdded = item.reports[0].created;
                // item.preview = item.exercise.content.question.text.length > previewMaxLength ?
                //     item.exercise.content.question.text.substr(0, previewMaxLength): item.exercise.content.question.text;
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

        $scope.choseActiveExercise = function (index) {
            if(index != $scope.activeExercise) {
                $scope.extraProperty = {};
                $scope.limitReports = 3;
                if($scope.activeExercise != undefined) {
                    var exercise = $scope.reportInfo[$scope.activeExercise];
                    var activeIndex = $scope.activeExercise;
                    if(exercise.type == 'mc') {
                        filterAlternativeArray(exercise.content.alternatives);
                        if(exercise.content.alternatives.length == 0) {
                            exercise.content.alternatives.push({text: 'Riktig', correct: true});
                            exercise.content.alternatives.push({text: "Galt", correct: false})
                        }
                    }
                    if(!angular.equals(exercise, $scope.exerciseCopy)){
                        requestService.httpPut('/exercises/' + exercise.id, exercise.content)
                            .then(function (response) {
                                console.log(response);
                                $scope.changesMade.value = true;
                                alertify.success('Oppgaven lagret');
                                delete exercise.error
                            }, function (response) {
                                console.log(response);
                                console.log(exercise);
                                alertify.error('En feil oppstod ved lagring av oppgaven');
                                exercise.error = true
                            })
                    } else {
                        console.log('jada')
                    }
                }
            }
            $scope.activeExercise = index;
            $scope.exerciseCopy = $scope.activeExercise != undefined? angular.copy($scope.reportInfo[$scope.activeExercise]):{};
        };

        //************************MC-specific functions***************************
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
        //******************************************************************************

        //************************TF-specific functions***************************
        $scope.changeAnswer = function (event, exercise) {
            if(event.keyCode==13 && !event.shiftKey) {
                event.preventDefault();
                exercise.content.correct.answer = !exercise.content.correct.answer
            }
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
            $scope.choseActiveExercise(undefined);
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
                    angular.forEach($scope.removeElements, function (value) {
                        if(value) {
                            deleteReportRequests.push(requestService.httpDelete('/reports/' + value))
                        }
                    });
                    $q.all(deleteReportRequests).then(function (response) {
                        requestService.httpGet('/subjects/' + $routeParams.subjectId + '/reports')
                            .then(function (response) {
                            })
                    });
                    $scope.changesMade.value = true;
                    $scope.reportInfo = response;
                    initReportInfo($scope.reportInfo);
                    $scope.extraProperty = {};
                    $scope.activeExercise = undefined;
                    $scope.exercise = undefined;
                })

            });
        };

        $scope.deleteReport = function (reports, index) {
            if(!$scope.inDeleteReportList[index]) {
                $scope.inDeleteReportList[index] = true;
            } else {
                requestService.httpDelete('/reports/' + reports[index].id)
                    .then(function (response) {
                        delete $scope.inDeleteReportList[index];
                        reports.splice(index, 1);
                        console.log(response)
                    });
            }
        };

        $scope.cancel = function () {
            $scope.exercise = undefined;
        };
        $scope.close = function () {
            $uibModalInstance.close();
        };

    });