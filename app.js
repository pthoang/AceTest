'use strict';

// Declare app level module which depends on views, and components

angular.module('myApp', [
        'ngRoute',
        'myApp.subjects',
        'myApp.add',
        'myApp.login',
        'myApp.collections',
        'myApp.addcollections',
        'myApp.addexercises',
        'myApp.search',
        'myApp.edit',
        'ngAnimate',
        'ui.bootstrap',
        'ngTagsInput',
        'angular-loading-bar',
        'ng-mfb',
        'ngCookies',
        'myApp.services',
        'naif.base64',
        'as.sortable',
        'uiSwitch',
        'ngAlertify',
        'monospaced.elastic',
        'cfp.hotkeys']
    )
    .config(['$locationProvider', '$routeProvider','apiUrl',function ($locationProvider, $routeProvider, apiUrl) {
        $routeProvider
            .when("/login", {
                templateUrl: "login/login.html",
                controller: "loginCtrl"
            })
            .when("/register", {
                templateUrl: "login/register.html",
                controller: "registerCtrl"
            })
            .when("/subjects", {
                templateUrl: "subjects/subjects.html",
                controller: "subjectsCtrl"
            })
            .when("/add", {
                templateUrl: "subjects/add.html",
                controller: "addCtrl"
            }).when("/subjects/:subjectId", {
                templateUrl: "collections/collections.html",
                controller: "collectionsCtrl"
            })
            .when("/subjects/:subjectId/collections/:collectionId", {
                templateUrl: "exercises/edit.html",
                controller: "editCtrl",
                param: 'editParam'
            })
            .when("/subjects/:subjectId/add", {
                templateUrl: "search/add.html",
                controller: "addCollectionsCtrl"
            })
            .when("/subjects/:subjectId/collections/:collectionId/add", {
                templateUrl: "search/add.html",
                controller: "addExercisesCtrl"
            })
            .when("/search", {
                templateUrl: "search/search.html",
                controller: "searchCtrl"
            })
            .otherwise({redirectTo: '/login'});


    }])
    .config(function (hotkeysProvider) {
        hotkeysProvider.includeCheatSheet = false;
    })
    .controller('mainController', function ($scope, $window, $location, $http, $q, Auth, $cookies,$rootScope,PreviousState) {
        $scope.isCollapsed = true;

        $scope.$watch(Auth.isLoggedIn, function (value, oldValue) {

            if (!value && oldValue) {
                console.log("Disconnect");
                $location.path('/login');
            }

            if (value) {
                console.log("Connect");
                //Do something when the user is connected
            }

        }, true);

        $scope.checkLoggedIn = function () {
            return $cookies.getObject('token') ? true: false;
        };

        $scope.logOut = function () {
            if(confirm("Er du sikker på at du vil logge ut?")){
                Auth.setToken(false);
                $cookies.remove('token');
                $cookies.remove('username');
                $cookies.remove('admin');
                $location.path('/login');
            }
        };

    })

    .constant("apiUrl", "https://acepi-test2.herokuapp.com")
    //.constant("apiUrl", "http://10.22.83.180:3000")
    //.constant("apiUrl", "https://acepi.herokuapp.com/subjects")
    .factory('focus', function ($timeout, $window) {
        return function (id) {
            {
                $timeout(function () {
                    var element = $window.document.getElementById(id);
                    if (element) {
                        element.focus()
                    }
                })
            }

        }
    })
    .factory('shuffle', function () {
        return function (array) {
            var m = array.length, t, i;

            while (m) {
                // Pick a remaining element…
                i = Math.floor(Math.random() * m--);

                // And swap it with the current element.
                t = array[m];
                array[m] = array[i];
                array[i] = t;
            }

            return array;
        }
    }).factory('PreviousState', ['$rootScope',
    function ($rootScope) {

        var previousRoute = undefined;


        $rootScope.$on("$routeChangeSuccess", function (event, current,previous) {
            previousRoute = previous
        })

        return {
            getPrevious: function (){ return previousRoute;},
        }

    }]).service('RestService', function () {
    })
    .run(['$rootScope','$location', 'Auth','PreviousState', function ($rootScope, $location, Auth,PreviousState) {

    $rootScope.$on('$routeChangeStart', function (event, current) {
        if (current.$$route.originalPath.indexOf('register') > -1) {
            console.log('ALLOW LOGIN/REGISTER');
        }
        else if (!Auth.isLoggedIn()) {
            console.log('DENY');
            //event.preventDefault();
            $location.path('/login');
        }

        else {
            console.log('ALLOW');
        }
    });

    $rootScope.PreviousState = PreviousState;

    }])
    .run((function ($rootScope, $uibModalStack) {
        $rootScope.$on('$routeChangeSuccess', function () {
            $uibModalStack.dismissAll()
        });
        $uibModalStack.dismissAll()
    }))

    .directive('stickyScroll', function ($window) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                angular.element($window).bind('scroll', function () {
                    if($window.pageYOffset > document.getElementById('toolbar').offsetTop) {
                        scope.showStickyToolbar = true;
                    } else {
                        scope.showStickyToolbar = false;
                    }
                    scope.$apply();
                });
                scope.$on('$destroy', function () {
                    angular.element($window).unbind('scroll')
                });
                
            }
        }
    });




