let AppManager = angular.module('AppManager', ["ngRoute", "dndLists"]);

AppManager.factory('userService', function() {
    let userData = {
        id: undefined,
        email: undefined,
        projects: undefined
    };
    let token = undefined;
    let loggedIn = false;
    let currentProject = undefined;
    return {
        getAuthorization: function() {
            return token;
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
        getCurrentProject: function() {
            return currentProject;
        },
        getUser: function() {
            return userData;
        },
        setUser: function(data) {
            userData = data;
        },
        setAuthorization: function(ltoken) {
            token = ltoken;
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
        setCurrentProject: function(project) {
            currentProject = angular.copy(project);
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
                if (userService.isLoggedIn()) {
                    return "/dashboard";
                } else {
                    return "/home";
                }
            }]
        })
        .when("/home", {
            templateUrl: "views/home.html"
        })
        .when("/error/:context/:code", {
            templateUrl: "views/error.html",
            controller: 'errorController'
        })
        .when("/project/:id", {
            templateUrl: "views/project.txt",
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
                if (userService.isLoggedIn()) {
                    return "/dashboard";
                } else {
                    return "/loginForm";
                }
            }]
        })
        .when("/register", {
            resolveRedirectTo: ["userService", function(userService) {
                if (userService.isLoggedIn()) {
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
            templateUrl: "views/dashboard.txt",
            controller: 'DashboardController'
        })
        .otherwise({
            redirectTo: "/error/route/404"
        });
}]);

AppManager.config(["$locationProvider", function($locationProvider){
    $locationProvider.html5Mode(true);
}]);

AppManager.config(["$httpProvider", function($httpProvider) {
    $httpProvider.interceptors.push(function(userService) {
        return {
            request: function(request) {
                if (userService.getAuthorization())
                    request.headers.Authorization = userService.getAuthorization();
                request.headers.Accept = '*/*';
                // console.log(request);
                return request; 
            },
            response: function(response) {
                if (response.status == 200) {
                    if (response.data.token)
                        userService.setAuthorization(response.data.token);
                    if (response.data.id && (userService.getUserId() === undefined))
                        userService.setUserId(response.data.id);
                    else if (response.data.userId)
                        userService.setUserId(response.data.userId);
                    if (response.data.email)
                        userService.setUserEmail(response.data.email);
                    if (response.data.projects)
                        userService.setUserProjects(response.data.projects);
                }
                if (response.status == 403) {
                    console.log(response);
                    $location.path(`error/default/${response.status}`);
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
        let context = undefined;
        $scope.login = function(data) {
            userData = angular.copy(data);
            context = "login";
            $http.post("https://uz-kanban-backend.herokuapp.com/users/login", JSON.stringify(userData))
                .then(function(response) {
                    if (response.status == 200) {
                        userService.toggleLoggedIn();
                        $rootScope.$broadcast("toggleLoggedIn");
                    } else {
                        console.log(response);
                        $location.path(`error/${context}/${response.status}`);
                    }
                }, function(response){
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
                });
            $scope.data = {};
        };
        $scope.register = function(data) {
            userData = angular.copy(data);
            context = "register";
            $http.post("https://uz-kanban-backend.herokuapp.com/users", JSON.stringify(userData))
                .then(function(response) {
                    if (response.status == 200) {
                        // $scope.registerSuccess = $sce.trustAsHtml('Registration Successful. You can now <a href="login">login</a>');
                        $location.path("registerSuccess");
                    } else {
                        console.log(response);
                        $location.path(`error/${context}/${response.status}`);
                    }
                }, function(response){
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
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
            context = "changePassword";
            $http.put("https://uz-kanban-backend.herokuapp.com/users/" + userService.getUserId(), JSON.stringify(userData))
                .then(function(response) {
                    if (response.status == 200) {
                        $scope.logout();
                        $location.path("/");
                    } else {
                        console.log(response);
                        $location.path(`error/${context}/${response.status}`);
                    }
                }, function(response){
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
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

        if (userService.getAuthorization() === undefined) {
            $location.path("error/DashboardController/403");
            return;
        }

        let context = undefined;
        let userData = undefined;
        $scope.users = {};
        $scope.edit = {};
        $scope.currentProject = {};
        
        // let projects = [
        //     {
        //         "project": {
        //             "id": 1,
        //             "name": "Project 1",
        //         },
        //         "role": "CREATOR"
        //     },
        //     {
        //         "project": {
        //             "id": 2,
        //             "name": "Project 2",
        //         },
        //         "role": "USER"
        //     }
        // ]
        // userService.setUserProjects(projects);
        $scope.prr = userService.getUserProjects();
        console.log(userService.getUser());
        console.log($scope.prr);
        
        $scope.test = function() {
            context = "test";
            $http.get("https://uz-kanban-backend.herokuapp.com/users")
                .then(function(response) {
                    if (response.status == 200) {
                        $scope.users = response.data;
                    } else {
                        console.log(response);
                        $location.path(`error/default/${response.status}`);
                    }
                }, function(response){
                    console.log(response);
                    $location.path(`error/default/${response.status}`);
                });
        }

        $scope.addProject = function(data) {
            userData = angular.copy(data);
            context = "addProject";
            $http.post("https://uz-kanban-backend.herokuapp.com/projects/" + userService.getUserId(), JSON.stringify(userData))
                .then(function(response) {
                    if (response.status == 200) {
                        let project = {};
                        project.id = response.data.id;
                        project.role = response.data.users[0].role;
                        delete response.data.users;
                        project.project = response.data;
                        $scope.prr.push(project);
                        userService.setUserProjects($scope.prr);
                    } else {
                        console.log(response);
                        $location.path(`error/${context}/${response.status}`);
                    }
                }, function(response){
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
                });
            $scope.data = {};
        }

        $scope.openProject = function(projectId) { 
            context = "openProject";
            $http.get("https://uz-kanban-backend.herokuapp.com/projects/" + projectId)
            .then(function(response) {
                if (response.status == 200) {
                    userService.setCurrentProject(response.data);
                    $location.path(`project/${projectId}`);
                } else {
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
                }
            }, function(response){
                console.log(response);
                $location.path(`error/${context}/${response.status}`);
            });
        }

        $scope.deleteProject = function (edit) {
            context = "deleteProject";
            $http.delete("https://uz-kanban-backend.herokuapp.com/projects/" + edit.id)
            .then(function(response) {
                if (response.status == 204) {
                    console.log("Project DELETED");
                    $scope.prr.splice(edit.index, 1);
                } else {
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
                }
            }, function(response){
                console.log(response);
                $location.path(`error/${context}/${response.status}`);
            });
            
            $scope.edit = {};
        }

        $scope.editProject = function(data, edit) {
            userData = angular.copy(data);
            context = "editProject";
            $http.put("https://uz-kanban-backend.herokuapp.com/projects/" + edit.id, JSON.stringify(userData))
                .then(function(response) {
                    if (response.status == 200) {
                        $scope.prr[edit.index].project.name = userData.name;
                    } else {
                        console.log(response);
                        $location.path(`error/${context}/${response.status}`);
                    }
                }, function(response){
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
                });
            $scope.data = {};
            $scope.edit = {};
        }

        $scope.beginEdit = function(project) {
            let currentProjectIndex = $scope.prr.indexOf(project);
            $scope.edit.index = currentProjectIndex;
            $scope.edit.id = project.project.id;
            $scope.edit.name = project.project.name;
        }

        $scope.loadMembers = function (id) {
            context = "loadMembers";
            $http.get("https://uz-kanban-backend.herokuapp.com/projects/" + id)
            .then(function(response) {
                if (response.status == 200) {
                    $scope.currentProject = response.data;
                    console.log($scope.currentProject);
                } else {
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
                }
            }, function(response){
                console.log(response);
                $location.path(`error/${context}/${response.status}`);
            });
        }

        $scope.addMember = function(data, edit) {
            userData = angular.copy(data);
            context = "addMember";
            $http.post("https://uz-kanban-backend.herokuapp.com/projects/member", null, {
                params: {
                    "projectId": edit.id, 
                    "userEmail": userData.email, 
                    "role": userData.select
                }
            })
            .then(function(response) {
                if (response.status == 200) {
                    console.log(response);
                } else {
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
                }
            }, function(response){
                console.log(response);
                $location.path(`error/${context}/${response.status}`);
            });
            $scope.data = {};
        }

        $scope.deleteMember = function (data, edit) {
            userData = angular.copy(data);
            context = "deleteMember";
            $http.delete("https://uz-kanban-backend.herokuapp.com/projects/member", {
                params: {
                    "projectId": edit.id, 
                    "userEmail": userData.email
                }
            })
            .then(function(response) {
                if (response.status == 204) {
                    console.log("Member DELETED");
                } else {
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
                }
            }, function(response){
                console.log(response);
                $location.path(`error/${context}/${response.status}`);
            });
            
            $scope.edit = {};
        }
        
}]);

AppManager.controller(
    "ProjectController", 
    ["$scope", "userService", "$location", "$routeParams", "$http",
    function($scope, userService, $location, $routeParams, $http) {

        if (userService.getAuthorization() === undefined) {
            $location.path("error/ProjectController/403");
            return;
        }

        $scope.addContainer = function(data) {
            userData = angular.copy(data);
            context = "addContainer";
            $http.post("https://uz-kanban-backend.herokuapp.com/containers/" + $routeParams.id, JSON.stringify(userData))
                .then(function(response) {
                    if (response.status == 200) {
                        delete response.data.project;
                        $scope.models.containers.push(response.data);
                    } else {
                        console.log(response);
                        $location.path(`error/${context}/${response.status}`);
                    }
                }, function(response){
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
                });
            $scope.data = {};
        }

        $scope.beginAddTask = function(container) {
            let currentContainerIndex = $scope.models.containers.indexOf(container);
            $scope.edit.containerIndex = currentContainerIndex;
            $scope.edit.containerId = container.id;
            $scope.edit.containerName = container.name;
        }

        $scope.addTask = function(data, edit) {
            userData = angular.copy(data);
            context = "addTask";
            $http.post("https://uz-kanban-backend.herokuapp.com/tasks/" + edit.containerId, JSON.stringify(userData))
                .then(function(response) {
                    if (response.status == 200) {
                        delete response.data.container;
                        $scope.models.containers[edit.containerIndex].tasks.push(response.data);
                    } else {
                        console.log(response);
                        $location.path(`error/${context}/${response.status}`);
                    }
                }, function(response){
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
                });
            $scope.data = {};
            $scope.edit = {};
        }

        $scope.beginMoveTask = function(container, task) {
            $scope.insert.containerId = container.id;
            $scope.insert.container = container;
            $scope.insert.taskId = task.id;
            $scope.insert.position = container.tasks.indexOf(task);
            
            // container.tasks.forEach(function(t, i) {
            //     if (t.containerPosition >= position)
            //         t.containerPosition++;
            // });
            // task.containerPosition = position;
        }

        $scope.moveTask = function(container, taskIndex) {
            context = "moveTask";
            if (container.id === $scope.insert.containerId) {
                // if (container.tasks.length-1 !== taskIndex)
                // if (($scope.insert.position - taskIndex) === 1)
                //     $scope.insert.position--;
                if ((container.tasks.length === taskIndex))
                    taskIndex--;
                else
                    $scope.insert.position--;
                // console.log($scope.insert.position)
                // console.log(taskIndex)
                if ($scope.insert.position === taskIndex) {
                    return;
                }
            }

            $http.put(`https://uz-kanban-backend.herokuapp.com/tasks/${$scope.insert.taskId}/position`, null, {
                params: {
                    "containerId": $scope.insert.containerId, 
                    "position": $scope.insert.position
                }
            })
            .then(function(response) {
                if (response.status == 200) {
                    console.log("move position")
                    $scope.organizeTasks(container);
                } else {
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
                }
            }, function(response){
                console.log(response);
                $location.path(`error/${context}/${response.status}`);
            })
            .then(function(result) {
                $scope.insert = {};
            });
            
        }

        $scope.organizeTasks = function(container) {
            $scope.insert.container.tasks.forEach(function(t, i) {
                if (t.containerPosition >= $scope.insert.position)
                    t.containerPosition++;
            });
            $scope.insert.container.tasks[$scope.insert.position].containerPosition = $scope.insert.position;
            container.tasks.forEach(function(t, i) {
                if (t.containerPosition >= $scope.insert.position)
                    t.containerPosition--;
            });
        }

        $scope.edit = {};
        $scope.insert = {};

        currentProject = angular.copy(userService.getCurrentProject());
        userService.setCurrentProject(undefined);
        let containers = currentProject.containers;

        $scope.showTask = function(task) {
            console.log(task);
            // console.log($scope.models.containers);
        };

        $scope.models = {
            // selected: null,
            containers: [
                // {
                //     name: "A",
                //     tasks: []
                // },
                // {
                //     name: "B",
                //     tasks: []
                // },
                // {
                //     name: "C",
                //     tasks: []
                // },
                // {
                //     name: "D",
                //     tasks: []
                // },
                // {
                //     name: "E",
                //     tasks: []
                // }
            ]
        };

        containers.sort(function(a, b){return a.projectPosition - b.projectPosition});
        containers.forEach(function (container, i) {
            container.tasks.sort(function(a, b){return a.containerPosition - b.containerPosition});
            $scope.models.containers.push(container);
            // container.tasks.forEach(function (task, i) {
            //     $scope.models.containers[container.id].items.push({label: task.name});
            // });
        });
        
        // Generate initial model
        // for (var i = 1; i <= 3; ++i) {
        //     $scope.models.containers.A.tasks.push({name: "Item A" + i, containerPosition: 5});
        //     $scope.models.containers.B.tasks.push({name: "Item B" + i, containerPosition: 5});
        //     $scope.models.containers.C.tasks.push({name: "Item C" + i, containerPosition: 5});
        //     $scope.models.containers.D.tasks.push({name: "Item D" + i, containerPosition: 5});
        //     $scope.models.containers.E.tasks.push({name: "Item D" + i, containerPosition: 5});
        // }

        console.log($scope.models.containers);
        console.log($routeParams.id);
        console.log($location.path());
        console.log(currentProject);

        
}]);

AppManager.controller(
    "errorController", 
    ["$scope", "$routeParams",
    function($scope, $routeParams) {
        
        dict = {
            "login": {
                "404": "There is no such user in our database or the login servers are currently down",
                "400": "The provided password was wrong"
            },
            "register": {
                "404": "The registration servers are currently down",
                "400": "The provided email is already in our database"
            },
            "route": {
                "404": "This page does not exist"
            },
            "default": {
                "403": "You are unauthorized to do this action",
                "-1": "A connection with the backend server could not be established",
                "500": "The backend server could not process your request",
                "404": "The requested resource was not found",
                "default": "We don't know what happend"
            }
        }

        let context = $routeParams.context;
        let code = $routeParams.code;

        if (!(dict.hasOwnProperty(context)))
            context = "default";
        if (!(dict[context].hasOwnProperty(code))) {
            context = "default";
            if (!(dict[context].hasOwnProperty(code))) {
                code = "default";
            }
        }

        $scope.err = `${$routeParams.code} - ${$routeParams.context.toUpperCase()} ERROR`;
        $scope.mes = dict[context][code];
}]);

AppManager.controller(
    "SiteController", 
    ["$rootScope", "$scope", "userService", "$http", "$location",
    function($rootScope, $scope, userService, $http, $location) {
    
    $scope.loggedIn = userService.isLoggedIn();
    $scope.userEmail = "@";
    let context = undefined;

    $scope.setUser = function() {
        return $http.get("https://uz-kanban-backend.herokuapp.com/users/" + userService.getUserId())
            .then(function(response) {
                if (response.status == 200) {
                    userService.setUser(response.data);
                    $scope.userEmail = userService.getUserEmail();
                    return response.status;
                } else {
                    console.log(response);
                    return response.status;
                }
            }, function(response){
                console.log(response);
                return response.status;
            });
    }

    $scope.deleteAccount = function() {
        context = "deleteAccount"
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
                    $location.path(`error/${context}/${response.status}`);
                }
            }, function(response){
                console.log(response);
                $location.path(`error/${context}/${response.status}`);
            });
    }
    
    $rootScope.$on('toggleLoggedIn', function () {
        $scope.loggedIn = userService.isLoggedIn();
        if ($scope.loggedIn) {
            let r = $scope.setUser();
            r.then(function(result){
                if (result == 200) {
                    $location.path("dashboard");
                } else {
                    $location.path(`error/toggleLogin/${result}`);
                }
            });
        }
            
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