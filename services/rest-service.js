angular.module("myApp.services", ['ngRoute'])
    .service("subjectService", function() {
        var subject;
        var userSubjects;
        var subjectCopy;

        var setSubject= function(targetSubject) {
            subject = targetSubject;
            subjectCopy = angular.copy(targetSubject)
        };
        var setSubjectToCopy = function(subjectCopy) {
            subject = angular.copy(subjectCopy)

        }
        var getSubject = function() {
            return subject
        };
        var getSubjectCopy = function() {
          return subjectCopy;
        };
        var setUserSubjects = function (subjects) {
            userSubjects = subjects;
        };
        var getUserSubjects = function () {
            return userSubjects;
        };
        return {
            setSubject: setSubject,
            getSubject: getSubject,
            setUserSubjects: setUserSubjects,
            getUserSubjects: getUserSubjects,
            getSubjectCopy : getSubjectCopy,
            setSubjectToCopy: setSubjectToCopy
        }

    })
    .service("collectionService",function(){
        var collection;

        var setCollection = function(targetCollection){
            collection = targetCollection
        };
        var getCollection = function(){
            return collection;
        };



        return{
            setCollection : setCollection,
            getCollection : getCollection

        }


    })
    .service("requestService", function ($http, $q, $cookies, apiUrl, alertify) {
        this.httpPut = function (path, data, errorList, index) {
            return $q(function (resolve, reject) {
                $http({
                    ignoreLoadingBar:true,
                    url: apiUrl + path,
                    method: 'PUT',
                    headers: $cookies.getObject("token"),
                    data: data
                }).success(function (response, status) {
                    resolve(response);
                    console.log(response);
                }).error(function (response, status, header, config) {
                    console.log(response);
                    console.log(status);
                    console.log(header);
                    console.log(config);
                    if(status==500) {
                        alertify.error('Problemer med server')
                    };
                    if(status==400 && errorList) {
                        errorList[index] = true
                    }
                    console.log(status);
                    reject({
                        response: response,
                        status: status
                    })

                })
            })
        };
        this.httpGet = function (path) {
            return $q(function (resolve, reject) {
                $http({
                    url: apiUrl + path,
                    method: "GET",
                    headers: $cookies.getObject("token")
                }).success(function (response) {
                    resolve(response)
                }).error(function (response, status, header, config) {
                    console.log(response);
                    console.log(status);
                    console.log(header);
                    console.log(config);
                    if(status==500) {
                        alertify.error('Problemer med server')
                    };
                    reject(response)
                })
            })
        }

        this.putImage = function(data, callback){
            return $q(function (resolve, reject) {
                $http({
                    url: apiUrl + "/images",
                    method: "POST",
                    headers: $cookies.getObject("token"),
                    data:data
                }).success(function (response) {
                    resolve(response);
                    callback(response)

                }).error(function (response, status, header, config) {
                    console.log(response);
                    console.log(status);
                    console.log(header);
                    console.log(config);
                    reject(response)
                })
            })
        };
        this.httpPost = function (path, data, callback, errorList, index) {
            return $q(function (resolve, reject) {
                $http({
                    url: apiUrl + path,
                    method: 'POST',
                    headers: $cookies.getObject("token"),
                    data: data
                }).success(function (response) {
                    resolve(response);
                    if(callback){
                        callback(response)
                    }
                }).error(function (response, status) {
                    if(status==500) {
                        alertify.error('Problemer med server')
                    };
                    if(status==400 && errorList) {
                        errorList[index] = true
                    };
                    reject({
                        response: response,
                        status: status
                    });
                })
            })
        };
        this.httpDelete = function (path) {
            return $q(function (resolve, reject) {
                $http({
                    url: apiUrl + path,
                    method: 'DELETE',
                    headers: $cookies.getObject('token')
                }).success(function (response) {
                    resolve(response)
                }).error(function (response) {
                    if(status==500) {
                        alertify.error('Problemer med server')
                    };
                    reject(response)
                })
            })
        }

        
    });
    