<%--
  Created by IntelliJ IDEA.
  User: markar
  Date: 26.10.2020
  Time: 15:55
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="pl" ng-app="AppManager" ng-controller="SiteController">
    <head>
        <base href="/">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <meta charset="UTF-8">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <title>Heroku - NotATrelloCopy</title>
        <!-- SCRIPTS -->
        <script src="js/lib/angular.min.js"></script>
        <script src="js/lib/angular-route.min.js"></script>
        <script src="js/lib/angular-drag-and-drop-lists.min.js"></script>
        <script src="bootstrap/js/jquery-3.5.1.slim.min.js"></script>
        <script src="bootstrap/js/popper.min.js"></script>
        <script src="bootstrap/js/bootstrap.min.js"></script>
        <script src="js/app.js"></script>
        <!-- CSS -->
        <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
        <link href="bootstrap/css/bootstrap.min.css" rel="stylesheet" type="text/css">
        <link href="css/styles.css" rel="stylesheet" type="text/css">
        <link href="css/customBootstrap.css" rel="stylesheet" type="text/css">
    </head>
    <body>
        <header ng-include="'publicHeader.html'" ng-if="!loggedIn"></header>
        <header ng-include="'userHeader.html'" ng-if="loggedIn"></header>
        <main ng-view></main>
        <div class="modal fade" id="deleteAccount" tabindex="-1" aria-labelledby="deleteAccountLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" id="deleteAccountLabel">Delete Account</h5>
                  <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div class="modal-body">
                  Are you sure you want to delete your account? You can't reverse this action. All projects you own will be deleted as well.
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                  <button type="button" ng-click="deleteAccount()" class="btn btn-danger" data-dismiss="modal">Delete Account</button>
                </div>
              </div>
            </div>
          </div>
    </body>
</html>