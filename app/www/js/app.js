// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
var myApp = angular.module('starter', ['ionic', 'ngCordova'])

    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);

            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });
    })

myApp.config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider

            .state('app', {
                url: '/app',
                abstract: true,
                templateUrl: 'templates/menu.html',
                controller: 'AppCtrl'
            })

            .state('app.game', {
                url: '/game',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/game.html',
                        controller: 'GameCtrl'
                    }
                }
            })

            .state('app.startGame', {
                url: '/startGame',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/startGame.html',
                        controller: 'StartGameCtrl'
                    }
                }
            })

            .state('app.login', {
                url: '/login',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/inloggen.html',
                        controller: 'LoginCtrl'
                    }
                }
            })

            .state('app.settings', {
                url: '/settings',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/settings.html',
                        controller: 'SettingsCtrl'
                    }
                }
            })
            .state('app.logout', {
                url: '/logout',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/logout.html',
                        controller: 'LogoutCtrl'
                    }
                }
            })


        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/game');
    });
