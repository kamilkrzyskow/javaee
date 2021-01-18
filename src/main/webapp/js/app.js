let AppManager = angular.module('AppManager', ["ngRoute", "dndLists"]);

AppManager.factory('userService', function() {
    let userData = {};
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
        getUserNotifications: function() {
            return userData.notifications;
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
        setUserNotifications: function(notifications) {
            userData.notifications = notifications;
        },
        setCurrentProject: function(project) {
            currentProject = angular.copy(project);
        },
        toggleLoggedIn: function() {
            loggedIn = !loggedIn;
            // if (!loggedIn) token = undefined;
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

AppManager.directive('myInclude', function() {
    return {
        restrict: 'AE',
        templateUrl: function(ele, attrs) {
            return attrs.templatePath;
        }
    };
});

AppManager.directive('myNotification', function($compile) {
    return {
        restrict: 'AE',
        templateUrl: function(ele, attrs) {
            return attrs.templatePath;
        },
        link: function(scope, elements, attrs) {
            $(".popper").popover({
                trigger: 'click',
                placement: 'bottom',
                html: true,
                container: '.navbar',
                content: function() {
                    return $compile($(".popper-content").html())(scope);
                }
            });
  
            scope.markAsRead = function() {
                alert("it works");
                console.log("maybe");
            }

        }
    }
});

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
        .when("/forgotForm", {
            templateUrl: "views/forgotForm.html"
        })
        .when("/registerForm", {
            templateUrl: "views/register.html"
        })
        .when("/loginForm", {
            templateUrl: "views/login.html"
        })
        .when("/forgot-pass", {
            resolveRedirectTo: ["userService", function(userService) {
                if (userService.isLoggedIn()) {
                    return "/dashboard";
                } else {
                    return "/forgotForm";
                }
            }]
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
            templateUrl: "views/dashboard.html",
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
                    if (response.data.notifications)
                        userService.setUserNotifications(response.data.notifications)
                }
                if (response.status == 403) {
                    userService.clearUser();
                    userService.toggleLoggedIn();
                    $rootScope.$broadcast("toggleLoggedIn");
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
        $scope.tokenRequestSent = false;
        $scope.data = {};
        $scope.login = function(data) {
            userData = angular.copy(data);
            context = "login";
            $http.post("https://uz-kanban-backend.herokuapp.com/users/login", JSON.stringify(userData))
                .then(function(response) {
                    if (response.status == 200) {
                        userService.toggleLoggedIn();
                        $scope.$emit("toggleLoggedIn");
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
            if ((data.password == data.passwordConfirm) || (data.password == $scope.passwordConfirm)) {
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
            $scope.$emit("toggleLoggedIn");
        }
        $scope.getRecoveryToken = function(data) {
            console.log("recoveryToken");
            userData = angular.copy(data);
            context = "getRecoveryToken";
            $http.post(`https://uz-kanban-backend.herokuapp.com/users/${userData.email}/token`, JSON.stringify(userData))
                .then(function(response) {
                    if (response.status == 200) {
                        console.log(response);
                        $scope.tokenRequestSent = true;
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
        $scope.recoverPassword = function (data) {
            context = "recoverPassword";
            delete data.passwordConfirm;
            userData = angular.copy(data);
            console.log("recoverPassword");
            $http.put("https://uz-kanban-backend.herokuapp.com/users/restartPassword", JSON.stringify(userData))
                .then(function(response) {
                    if (response.status == 200) {
                        console.log(response);
                        $location.path("/loginForm");
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
                        $scope.$emit("loadNotification");
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

        let context = undefined;

        // $scope.setDataDate = function() {
        //     let date = new Date();

        //     let day = date.getDate();
        //     let month = date.getMonth() + 1;
        //     let year = date.getFullYear();
        //     let hour = date.getHours();
        //     let min  = date.getMinutes();

        //     month = (month < 10 ? "0" : "") + month;
        //     day = (day < 10 ? "0" : "") + day;
        //     hour = (hour < 10 ? "0" : "") + hour;
        //     min = (min < 10 ? "0" : "") + min;

        //     let today = year + "-" + month + "-" + day;
        //     let time = hour + ":" + min;

        //     $scope.data.deadlineDate = today;
        //     $scope.data.deadlineTime = time;
        // }

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
            $scope.setDateTime(userData);
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
            console.log("beginLength", container.tasks.length);
            
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
                // if (container.tasks.length === taskIndex)
                //     taskIndex--;
                if ($scope.insert.position > taskIndex)
                    $scope.insert.position--;
                if ($scope.insert.position < taskIndex)
                    taskIndex--;
                // if (taskIndex > 0) taskIndex--;
                // if ($scope.insert.position > 0) $scope.insert.position--;
                
                if ($scope.insert.position === taskIndex) {
                    return;
                }

            }
            console.log("position to put", $scope.insert.position)
            console.log("taskIndex taken from", taskIndex)

            $http.put(`https://uz-kanban-backend.herokuapp.com/tasks/${$scope.insert.taskId}/position`, null, {
                params: {
                    "containerId": $scope.insert.containerId, 
                    "position": $scope.insert.position
                }
            })
            .then(function(response) {
                if (response.status == 200) {
                    console.log("move position")
                    $scope.organizeMoveTasks(container);
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

        $scope.beginEditTask = function(task, container) {
            $scope.edit.currentTask = task;
            $scope.edit.currentContainer = container;
            
            $scope.data.name = $scope.edit.currentTask.name;
            $scope.data.description = $scope.edit.currentTask.description;

            if ($scope.edit.currentTask.deadlineDate !== null) {
                let datetime = $scope.edit.currentTask.deadlineDate.split(".")[0];
                $scope.data.deadlineDate = new Date(datetime);
                $scope.data.deadlineTime = new Date(datetime);
            }
            $scope.data.done = $scope.edit.currentTask.done;
            console.log(task);
        }

        $scope.editTask = function(data, edit) {
            userData = angular.copy(data);
            context = "editTask";
            $scope.setDateTime(userData);
            $http.put("https://uz-kanban-backend.herokuapp.com/tasks/" + edit.currentTask.id, JSON.stringify(userData))
                .then(function(response) {
                    if (response.status == 200) {
                        console.log(edit);
                        edit.currentTask.name = userData.name;
                        edit.currentTask.description = userData.description;
                        edit.currentTask.done = userData.done;
                        edit.currentTask.deadlineDate = userData.deadlineDate;
                    } else {
                        console.log(response);
                        $location.path(`error/${context}/${response.status}`);
                    }
                }, function(response){
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
                });
            console.log(userData);

            $scope.data = {};
            $scope.edit = {};
        }

        $scope.setDateTime = function(userData) {
            if (userData.deadlineDate) {
                let date = userData.deadlineDate;
                let time;
                if (userData.deadlineTime)
                    time = userData.deadlineTime;
                else
                    time = userData.deadlineDate;
                
                userData.deadlineDate = 
                    date.getFullYear() + 
                    "-" + 
                    ("0"+(date.getMonth()+1)).slice(-2) + 
                    "-" + 
                    ("0" + date.getDate()).slice(-2) + 
                    "T" + 
                    ("0" + ((time.getHours()) >= 0 ? (time.getHours()) : 0)).slice(-2) + 
                    ":" + 
                    ("0" + time.getMinutes()).slice(-2) + 
                    ":" + 
                    ("0" + time.getSeconds()).slice(-2);
            } else {
                userData.deadlineDate = null;
            }
            if (userData.deadlineTime) delete userData.deadlineTime;
            
        }

        $scope.deleteTask = function(edit) {
            let containerIndex = $scope.models.containers.indexOf(edit.currentContainer);
            console.log(containerIndex);
            let taskIndex = $scope.models.containers[containerIndex].tasks.indexOf(edit.currentTask);
            context = "deleteTask";
            $http.delete("https://uz-kanban-backend.herokuapp.com/tasks/" + edit.currentTask.id)
            .then(function(response) {
                if (response.status == 204) {
                    console.log("Task DELETED");
                    $scope.models.containers[containerIndex].tasks.splice(taskIndex, 1);
                    $scope.organizeDeleteTasks(containerIndex, taskIndex);
                } else {
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
                }
            }, function(response){
                console.log(response);
                $location.path(`error/${context}/${response.status}`);
            });
            
            $scope.edit = {};
            $scope.data = {};
        }

        $scope.organizeMoveTasks = function(container) {
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

        $scope.organizeDeleteTasks = function(containerIndex, taskIndex) {
            $scope.models.containers[containerIndex].tasks.forEach(function (t, i) {
                if (t.containerPosition >= taskIndex)
                    t.containerPosition--;
            });
        }

        $scope.edit = {};
        $scope.insert = {};
        $scope.data = {};

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
    ["$rootScope", "$scope", "userService", "$http", "$location", "$interval",
    function($rootScope, $scope, userService, $http, $location, $interval) {
    
    $scope.loggedIn = userService.isLoggedIn();
    $scope.notificationsRead = true; 
    $scope.userEmail = "@";
    $scope.notifications = userService.getUserNotifications();
    let context = undefined;

    let notificationInterval;
    $scope.updateNotifications = function() {
        if ( angular.isDefined(notificationInterval) ) return;

        notificationInterval = $interval(function() {
            console.log("interval running");
            if ($scope.loggedIn) {
                $scope.$broadcast("loadNotification");
            }
        }, 5000);
    };

    angular.element(document).ready(function(){
        $scope.updateNotifications();
    });

    $scope.stopNotifications = function() {
        if (angular.isDefined(notificationInterval)) {
            $interval.cancel(notificationInterval);
            notificationInterval = undefined;
        }
    };

    $scope.$on('$destroy', function() {
        console.log("destroy");
        $scope.stopNotifications();
    });

    $scope.setUser = function() {
        return $http.get("https://uz-kanban-backend.herokuapp.com/users/" + userService.getUserId())
            .then(function(response) {
                if (response.status == 200) {
                    userService.setUser(response.data);
                    $scope.userEmail = userService.getUserEmail();
                    $scope.notifications = userService.getUserNotifications();
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

    $scope.setNotification = function() {
        return $http.get("https://uz-kanban-backend.herokuapp.com/users/" + userService.getUserId())
            .then(function(response) {
                if (response.status == 200) {
                    userService.setUserNotifications(response.data.notifications);
                    $scope.notifications = userService.getUserNotifications();
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

    $scope.markAsRead = function() {
        context = "markNotificationsAsRead"
        $http.put(`https://uz-kanban-backend.herokuapp.com/users/${userService.getUserId()}/read`)
            .then(function(response) {
                if (response.status == 204) {
                    console.log("Notifications read");
                    $scope.notifications.forEach(element => {
                        element.read = true;
                    });
                    $scope.$broadcast("checkReadNotification");
                } else {
                    console.log(response);
                    $location.path(`error/${context}/${response.status}`);
                }
            }, function(response){
                console.log(response);
                $location.path(`error/${context}/${response.status}`);
            });
    }

    $scope.$on('checkReadNotification', function () {
        console.log("checkReadNotification");
        $scope.notificationsRead = !$scope.notifications.some((val) => val.read == false);
    });

    $scope.$on('loadNotification', function () {
        $scope.loggedIn = userService.isLoggedIn();
        if ($scope.loggedIn) {
            let r = $scope.setNotification();
            r.then(function(result){
                if (result == 200) {
                    console.log("notificationLoad Success", result)
                    $scope.$broadcast("checkReadNotification");
                } else {
                    // userService.toggleLoggedIn();
                    // $scope.loggedIn = userService.isLoggedIn();
                    // $location.path(`error/loadNotification/${result}`);
                    console.log("notificationLoad Error", result)
                }
            });
        }     
    });

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
                    userService.toggleLoggedIn();
                    $scope.loggedIn = userService.isLoggedIn();
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