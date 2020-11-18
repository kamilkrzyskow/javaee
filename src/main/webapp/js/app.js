let AppManager = angular.module('AppManager', ["ngRoute", "dndLists"]);

AppManager.factory('userService', function() {
    let userData = {
        id: undefined,
        token: undefined,
        email: undefined,
        projects: undefined
    };
    let loggedIn = false;
    return {
        getAuthorization: function() {
            return userData.token;
        },
        getUserId: function() {
            return userData.id;
        },
        getUserEmail: function() {
            return userData.email;
        },
        getUserProjects: function() {
            return userData.projects;
        },
        getUser: function() {
            return userData;
        },
        setAuthorization: function(token) {
            userData.token = token;
        },
        setUserId: function(id) {
            userData.id = id;
        },
        setUserEmail: function(email) {
            userData.email = email;
        },
        setUserProjects: function(projects) {
            userData.projects = projects;
        },
        toggleLoggedIn: function() {
            loggedIn = !loggedIn;
        },
        clearUser: function() {
            for (property in userData) {
                userData[property] = undefined;
            }
        },
        isLoggedIn: function() {
            return loggedIn;
        }

    }
});

AppManager.config(['$sceDelegateProvider', function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
      'self',
      'https://uz-kanban-backend.herokuapp.com/**'
    ]);
}]);

AppManager.config(["$routeProvider", function($routeProvider) {
    $routeProvider
        .when("/", {
            resolveRedirectTo: ["userService", function(userService) {
                if (userService.getAuthorization()) {
                    return "/dashboard";
                } else {
                    return "/home";
                }
            }]
        })
        .when("/home", {
            templateUrl: "views/home.html"
        })
        .when("/project/:id*", {
            templateUrl: "views/project.html",
            controller: 'ProjectController'
        })
        .when("/404", {
            templateUrl: "views/404.html"
        })
        .when("/403", {
            templateUrl: "views/403.html"
        })
        .when("/changePassword", {
            templateUrl: "views/changePassword.html"
        })
        .when("/400", {
            templateUrl: "views/400.html"
        })
        .when("/registerForm", {
            templateUrl: "views/register.html"
        })
        .when("/loginForm", {
            templateUrl: "views/login.html"
        })
        .when("/login", {
            resolveRedirectTo: ["userService", function(userService) {
                if (userService.getAuthorization()) {
                    return "/dashboard";
                } else {
                    return "/loginForm";
                }
            }]
        })
        .when("/register", {
            resolveRedirectTo: ["userService", function(userService) {
                if (userService.getAuthorization()) {
                    return "/dashboard";
                } else {
                    return "/registerForm";
                }
            }]
        })
        .when("/registerSuccess", {
            templateUrl: "views/registerSuccess.html"
        })
        .when("/dashboard", {
            templateUrl: "views/dashboard.html",
            controller: 'DashboardController'
        })
        .otherwise({
            redirectTo: "/404"
        });
}]);

AppManager.config(["$locationProvider", function($locationProvider){
    $locationProvider.html5Mode(true);
}]);

AppManager.config(["$httpProvider", function($httpProvider) {
    $httpProvider.interceptors.push(function(userService) {
        return {
            request: function(request) {
                request.headers.Authorization = userService.getAuthorization();
                request.headers.Accept = '*/*';
                return request; 
            },
            response: function(response) {
                if (response.status == 200) {
                    if (response.data.token)
                        userService.setAuthorization(response.data.token);
                    if (response.data.id)
                        userService.setUserId(response.data.id);
                    else if (response.data.userId)
                        userService.setUserId(response.data.userId);
                    if (response.data.email)
                        userService.setUserEmail(response.data.email);
                    if (response.data.projects)
                        userService.setUserProjects(response.data.projects);
                }
                if (response.status == 403) {
                    $location.path(response.status.toString());
                }
                return response;
            }
        }
    })
}]);

AppManager.controller(
    'LoginRegisterController', 
    ["$rootScope", "$scope", "$http", "$location", "$sce", "userService",
    function($rootScope, $scope, $http, $location, $sce, userService) {
        $scope.login = function(data) {
            userData = angular.copy(data);
            $http.post("https://uz-kanban-backend.herokuapp.com/users/login", JSON.stringify(userData))
                .then(function(response) {
                    if (response.status == 200) {
                        userService.toggleLoggedIn();
                        $rootScope.$broadcast("toggleLoggedIn");
                        $location.path("dashboard");
                    } else {
                        $location.path(response.status.toString());
                    }
                }, function(response){
                    console.log(response);
                    $location.path(response.status.toString());
                });
            $scope.data = {};
        };
        $scope.register = function(data) {
            userData = angular.copy(data);
            $http.post("https://uz-kanban-backend.herokuapp.com/users", JSON.stringify(userData))
                .then(function(response) {
                    if (response.status == 200) {
                        // $scope.registerSuccess = $sce.trustAsHtml('Registration Successful. You can now <a href="login">login</a>');
                        $location.path("registerSuccess");
                    } else {
                        $location.path(response.status.toString());
                    }
                }, function(response){
                    console.log(response);
                    $location.path(response.status.toString());
                });
            $scope.data = {};
        };
        $scope.checkPass = function(data) {
            if (data.password == $scope.passwordConfirm) {
                angular.element(document.getElementById("submit").disabled = false);
            } else {
                angular.element(document.getElementById("submit").disabled = true);
            }
        };
        $scope.changePassword = function(data) {
            data.email = userService.getUserEmail();
            userData = angular.copy(data);
            $http.put("https://uz-kanban-backend.herokuapp.com/users/" + userService.getUserId(), JSON.stringify(userData))
                .then(function(response) {
                    if (response.status == 200) {
                        $scope.logout();
                        // $scope.registerSuccess = $sce.trustAsHtml('Registration Successful. You can now <a href="login">login</a>');
                        $location.path("/");
                    } else {
                        $location.path(response.status.toString());
                    }
                }, function(response){
                    console.log(response);
                    $location.path(response.status.toString());
                });
            $scope.data = {};
        };
        $scope.logout = function() {
            userService.clearUser();
            userService.toggleLoggedIn();
            $rootScope.$broadcast("toggleLoggedIn");
        }
}]);

AppManager.controller(
    "DashboardController", 
    ["$scope", "$http", "$location", "userService", 
    function($scope, $http, $location, userService) {

        // if (userService.getAuthorization() === undefined)
        //     $location.path("/");
        $scope.users = {};
        let projects = [
            {
                "id": 1,
                "name": "Project 1",
                "desc": "JAVAEE"
            },
            {
                "id": 2,
                "name": "Project 2",
                "desc": "PG3D"
            }
        ]
        userService.setUserProjects(projects);
        $scope.prr = userService.getUserProjects();
        
        console.log(userService.getUser());
        console.log($scope.prr);

        $scope.test = function() {
            $http.get("https://uz-kanban-backend.herokuapp.com/users")
                .then(function(response) {
                    if (response.status == 200) {
                        $scope.users = response.data;
                    } else {
                        $location.path(response.status.toString());
                    }
                }, function(response){
                    console.log(response);
                    $location.path(response.status.toString());
                });
        }

        $scope.addProject = function(data) {
            $scope.prr.unshift(data);
            $scope.data = {};
        }
}]);

AppManager.controller(
    "ProjectController", 
    ["$scope",
    function($scope) {

    $scope.models = {
        selected: null,
        lists: {
            "A": [], 
            "B": [],
            "C": [],
            "D": [],
            "E": [],
            "F": [],
            "G": [],
            "H": [],
            "I": [],
            "J": [],
            "K": [],
        }
    };
    
    // Generate initial model
    for (var i = 1; i <= 3; ++i) {
        $scope.models.lists.A.push({label: "Item A" + i});
        $scope.models.lists.B.push({label: "Item B" + i});
        $scope.models.lists.C.push({label: "Item C" + i});
        $scope.models.lists.D.push({label: "Item D" + i});
        $scope.models.lists.E.push({label: "Item E" + i});
        $scope.models.lists.F.push({label: "Item F" + i});
        $scope.models.lists.G.push({label: "Item G" + i});
        $scope.models.lists.H.push({label: "Item H" + i});
        $scope.models.lists.I.push({label: "Item I" + i});
        $scope.models.lists.J.push({label: "Item J" + i});
        $scope.models.lists.K.push({label: "Item K" + i});
    }

    console.log($scope.models.lists);

}]);

AppManager.controller(
    "SiteController", 
    ["$rootScope", "$scope", "userService", "$http", "$location",
    function($rootScope, $scope, userService, $http, $location) {
    
    $scope.loggedIn = userService.isLoggedIn();

    $scope.setEmail = function() {
        $http.get("https://uz-kanban-backend.herokuapp.com/users/" + userService.getUserId())
            .then(function(response) {
                if (response.status == 200) {
                    userService.setUserEmail(response.data.email);
                } else {
                    console.log(response);
                }
            }, function(response){
                console.log(response);
            });
    }

    $scope.deleteAccount = function() {
        $http.delete("https://uz-kanban-backend.herokuapp.com/users/" + userService.getUserId())
            .then(function(response) {
                if (response.status == 204) {
                    console.log("Account DELETED");
                    userService.clearUser();
                    userService.toggleLoggedIn();
                    $rootScope.$broadcast("toggleLoggedIn");
                    $location.path("/");
                } else {
                    console.log(response);
                }
            }, function(response){
                console.log(response);
            });
    }
    
    $rootScope.$on('toggleLoggedIn', function () {
        $scope.loggedIn = userService.isLoggedIn();
        if ($scope.loggedIn)
            $scope.setEmail();
    });
}]);

// AppManager.controller(
//     "UserNavBarController",
//     ["$rootScope", "$scope", "userService",
//     function($rootScope, $scope, userService) {
//     $scope.logout = function() {
//         userService.setAuthorization(undefined);
//         userService.toggleLoggedIn();
//         $rootScope.$broadcast("toggleLoggedIn");
//     }
    
// }]);