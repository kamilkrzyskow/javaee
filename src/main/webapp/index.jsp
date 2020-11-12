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
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta charset="UTF-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>Heroku - NotATrelloCopy</title>
    <link href="css/styles.css" rel="stylesheet" type="text/css">
    <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet"> 
    <script src="js/lib/angular.min.js"></script>
    <script src="js/lib/angular-route.min.js"></script>
    <script src="js/lib/angular-drag-and-drop-lists.min.js"></script>
    <script src="js/app.js"></script>
  </head>
  <body>
    <header ng-include="'publicHeader.html'" ng-if="!loggedIn"></header>
    <header ng-include="'userHeader.html'" ng-if="loggedIn"></header>
    <main ng-view></main>
  </body>
</html>