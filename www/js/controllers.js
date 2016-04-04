var apiURL = "https://rocky-scrubland-25861.herokuapp.com/";
// Expects input as 'nnnnnn' where each nn is a
// 2 character hex number for an RGB color value
// e.g. #3f33c6
// Returns the average as a hex number without leading #
var averageRGB = (function () {

    // Keep helper stuff in closures
    var reSegment = /[\da-z]{2}/gi;

    // If speed matters, put these in for loop below
    function dec2hex(v) {
        return v.toString(16);
    }

    function hex2dec(v) {
        return parseInt(v, 16);
    }

    return function (c1, c2) {

        // Split into parts
        var b1 = c1.match(reSegment);
        var b2 = c2.match(reSegment);
        var t, c = [];

        // Average each set of hex numbers going via dec
        // always rounds down
        for (var i = b1.length; i;) {
            t = dec2hex((hex2dec(b1[--i]) + hex2dec(b2[i])) >> 1);

            // Add leading zero if only one character
            c[i] = t.length == 2 ? '' + t : '0' + t;
        }
        return c.join('');
    }
}());

// var myApp = angular.module('starter.controllers', []);

myApp.controller('AppCtrl', function ($scope, $ionicModal, $timeout) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    // Form data for the login modal
})

myApp.controller('GameCtrl', function ($scope, dataStorage, $cordovaGeolocation, $cordovaDeviceMotion) {

    var user;
    var game;

    $scope.options = {
        frequency: 100, // Measure every 100ms
        deviation: 25  // We'll use deviation to determine the shake event, best values in the range between 25 and 30
    };

    // Current measurements
    $scope.measurements = {
        x: null,
        y: null,
        z: null,
        timestamp: null
    }

    // Previous measurements
    $scope.previousMeasurements = {
        x: null,
        y: null,
        z: null,
        timestamp: null
    }

    $scope.watch = null;

    //Start Watching method
    $scope.startWatching = function (callback) {

        // Device motion configuration
        $scope.watch = $cordovaDeviceMotion.watchAcceleration($scope.options);

        // Device motion initilaization
        $scope.watch.then(null, function (error) {
            console.log('Error');
        }, function (result) {

            // Set current data
            $scope.measurements.x = result.x;
            $scope.measurements.y = result.y;
            $scope.measurements.z = result.z;
            $scope.measurements.timestamp = result.timestamp;

            // Detecta shake
            $scope.detectShake(result, callback);

        });
    };

    // Stop watching method
    $scope.stopWatching = function () {
        $scope.watch.clearWatch();
    }

    // Detect shake method
    $scope.detectShake = function (result, callback) {

        //Object to hold measurement difference between current and old data
        var measurementsChange = {};

        // Calculate measurement change only if we have two sets of data, current and old
        if ($scope.previousMeasurements.x !== null) {
            measurementsChange.x = Math.abs($scope.previousMeasurements.x, result.x);
            measurementsChange.y = Math.abs($scope.previousMeasurements.y, result.y);
            measurementsChange.z = Math.abs($scope.previousMeasurements.z, result.z);
        }

        // If measurement change is bigger then predefined deviation
        if (measurementsChange.x + measurementsChange.y + measurementsChange.z > $scope.options.deviation) {
            $scope.stopWatching();  // Stop watching because it will start triggering like hell
            console.log('shake detected');

            // setTimeout($scope.startWatching(), 1000);  // Again start watching after 1 sex

            // Clean previous measurements after succesfull shake detection, so we can do it next time
            $scope.previousMeasurements = {
                x: null,
                y: null,
                z: null
            }

            callback();

        } else {
            // On first measurements set it as the previous one
            $scope.previousMeasurements = {
                x: result.x,
                y: result.y,
                z: result.z
            }
        }

    }

    $scope.$on('$ionicView.beforeLeave', function () {
        $scope.watch.clearWatch(); // Turn off motion detection watcher
    });


    var updateUser = function (callback) {
        $.ajax({
                method: "GET",
                url: apiURL + 'users/currentUser',
                statusCode: {
                    500: function () {
                        console.log('Het is niet gelukt de user op te halen');
                    },
                    403: function () {
                        window.location.href = "#/app/login";
                    }
                },
                xhrFields: {
                    withCredentials: true
                }
            })
            .done(function (data) {
                // user = data;
                dataStorage.setUser(data);
                callback();
            })
    };

    var posOptions = {timeout: 30000, maximumAge: 2000, enableHighAccuracy: true};
    $cordovaGeolocation
        .getCurrentPosition(posOptions)
        .then(function (position) {
            $scope.lat = position.coords.latitude
            $scope.long = position.coords.longitude
        }, function (err) {
            // error
        });
    $scope.getLoc = function () {
        $cordovaGeolocation
            .getCurrentPosition(posOptions)
            .then(function (position) {
                $scope.lat = position.coords.latitude
                $scope.long = position.coords.longitude
                if ($scope.showYourturn && distance($scope.lat, $scope.long, dataStorage.getCurrentSquare().lat, dataStorage.getCurrentSquare().long) < 25) {
                    $scope.arrived();
                }

            }, function (err) {
                // error
            });
    };

    setInterval($scope.getLoc, 1000);
    var checkImgSrc = "img/check.png";
    var declineImgSrc = "img/decline.png";
    var loadImgSrc = "img/loading-flower.gif";

    $scope.checkSrc = checkImgSrc;
    $scope.declineSrc = declineImgSrc;

    var checkForTurn = function () {

        $.ajax({
                method: "GET",
                url: apiURL + 'games/' + dataStorage.getGame()._id,
                statusCode: {
                    500: function () {
                        console.log('Het is niet gelukt de game op te halen');
                    },
                    403: function () {
                        window.location.href = "#/app/login";
                    }
                },
                xhrFields: {
                    withCredentials: true
                }
            })
            .done(function (data) {
                // user = data;
                dataStorage.setGame(data);
                game = data;
                $scope.game = game;

                console.log('checkorTurn');
                console.log(game);
                console.log(game.turn.user._id);
                console.log(user._id);


                if (game.turn.user._id == user._id) {
                    $scope.showYourturn = true;
                    $scope.showNavigation = false;
                    $scope.showBuy = false;
                    $scope.showPayday = false;
                    $scope.showBuyConfirmation = false;
                    $scope.showPayConfirmation = false;
                    $scope.turnAmount = game.turn.amount;

                    $scope.squares = [];

                    for (var s = 0; s < game.streets.length; s++) {
                        for (var sq = 0; sq < game.streets[s].squares.length; sq++) {

                            var square = game.streets[s].squares[sq];

                            square.userColours = [];

                            for (var u = 0; u < square.users.length; u++) {
                                for (var gu = 0; gu < game.users.length; gu++) {
                                    if (square.users[u]._id == game.users[gu].user._id) {
                                        square.userColours.push(game.users[gu].color);
                                    }
                                }

                                if (square.users[u]._id == dataStorage.getUser()._id) {
                                    dataStorage.setCurrentSquare(square);
                                }
                            }


                            $scope.squares.push(square);
                        }
                    }



                    // if (($scope.squares.indexOf(dataStorage.getCurrentSquare()) + $scope.turnAmount) > $scope.squares.length) {
                    //     //TODO voorbij start
                    //     dataStorage.setCurrentSquare($scope.squares[($scope.squares.indexOf(dataStorage.getCurrentSquare()) + $scope.turnAmount) - $scope.squares.length]);
                    //     console.log('vooruit over start');
                    // } else if ($scope.squares.indexOf(dataStorage.getCurrentSquare()) + $scope.turnAmount < 0) {
                    //     //achteruit over start
                    //     dataStorage.setCurrentSquare($scope.squares[$scope.squares.indexOf(dataStorage.getCurrentSquare()) + $scope.squares.length + $scope.turnAmount]);
                    //     console.log('achteruit over start');
                    // } else {
                    //     dataStorage.setCurrentSquare($scope.squares[$scope.squares.indexOf(dataStorage.getCurrentSquare()) + $scope.turnAmount]);
                    //     console.log('niet over start');
                    // }


                    $scope.currentSquare = dataStorage.getCurrentSquare();

                    $scope.$apply();
                    console.log('je bent aan de beurt');
                }


            })


    };

    $scope.$on('$ionicView.enter', function (e) {

        user = dataStorage.getUser();
        game = dataStorage.getGame();
        $scope.game = game;


        if (game == undefined) {
            window.location.href = "#/app/startGame";
        } else {
            $scope.squares = [];

            for (var s = 0; s < game.streets.length; s++) {
                for (var sq = 0; sq < game.streets[s].squares.length; sq++) {

                    var square = game.streets[s].squares[sq];

                    square.userColours = [];

                    for (var u = 0; u < square.users.length; u++) {
                        for (var gu = 0; gu < game.users.length; gu++) {
                            if (square.users[u]._id == game.users[gu].user._id) {
                                console.log('game users', game.users);
                                square.userColours.push(game.users[gu].color);
                            }
                        }

                        if (square.users[u]._id == dataStorage.getUser()._id) {
                            dataStorage.setCurrentSquare(square);
                        }
                    }

                    console.log('square', square);

                    $scope.squares.push(square);
                }
            }

            for (var u = 0; u < game.users.length; u++) {
                if (game.users[u].user._id == user._id) {
                    //user found
                    $scope.money = game.users[u].money;
                }
            }

            checkForTurn();

            $scope.getStyle = function (key, square) {
                var pixelAmount = 20;
                var borderBottomSquares = [1, 2];
                var borderLeftSquares = [4, 5, 6, 7, 8, 9];
                var borderTopSquares = [11, 12];
                var borderRightSquares = [14, 15, 16, 17, 18, 19];

                if (borderBottomSquares.indexOf(key) != -1) {
                    var returnValue = "border-bottom: " + pixelAmount + "px solid " + square.street.color;
                } else if (borderLeftSquares.indexOf(key) != -1) {
                    var returnValue = "border-left: " + pixelAmount + "px solid " + square.street.color;
                } else if (borderTopSquares.indexOf(key) != -1) {
                    var returnValue = "border-top: " + pixelAmount + "px solid " + square.street.color;
                } else if (borderRightSquares.indexOf(key) != -1) {
                    var returnValue = "border-right: " + pixelAmount + "px solid " + square.street.color;
                }
                if (key == 0) { //bottom right
                    var returnValue = "border-bottom: " + pixelAmount + "px solid " + square.street.color + "; border-right: " + pixelAmount + "px solid " + square.street.color;
                }
                if (key == 3) { //bottom left
                    var returnValue = "border-bottom: " + pixelAmount + "px solid " + square.street.color + "; border-left: " + pixelAmount + "px solid " + square.street.color;
                }
                if (key == 10) { //top left
                    var returnValue = "border-top: " + pixelAmount + "px solid " + square.street.color + "; border-left: " + pixelAmount + "px solid " + square.street.color;
                }
                if (key == 13) { //top right
                    var returnValue = "border-top: " + pixelAmount + "px solid " + square.street.color + "; border-right: " + pixelAmount + "px solid " + square.street.color;
                }

                var ownerColour = undefined;

                for (var gu = 0; gu < game.users.length; gu++) {
                    if (square.owner != undefined && square.owner._id == game.users[gu].user._id) {
                        ownerColour = game.users[gu].color;
                    }
                }

                if (ownerColour != undefined) {
                    return returnValue + ";  background-color: #" + averageRGB(ownerColour, '#ffffff');
                } else {
                    return returnValue;
                }
            };

            $scope.goToNavigation = function () {
                $scope.showYourturn = false;
                $scope.showNavigation = true;
                $scope.showBuy = false;
                $scope.showPayday = false;
                $scope.showBuyConfirmation = true;
                $scope.showPayConfirmation = false;
            };

            $scope.arrived = function () {
                if (dataStorage.getCurrentSquare().owner == undefined) {
                    console.log('kopen');
                    $scope.showYourturn = false;
                    $scope.showNavigation = false;
                    $scope.showBuy = true;
                    $scope.showPayday = false;
                    $scope.showBuyConfirmation = false;
                    $scope.showPayConfirmation = false;
                    $scope.showSelfBuy = false;

                } else if (dataStorage.getCurrentSquare().owner._id == dataStorage.getUser()._id) {
                    console.log('eigen vakje');
                    $scope.showYourturn = false;
                    $scope.showNavigation = false;
                    $scope.showBuy = false;
                    $scope.showPayday = false;
                    $scope.showBuyConfirmation = false;
                    $scope.showPayConfirmation = false;
                    $scope.showSelfBuy = true;

                    $scope.startWatching($scope.acceptNoPay);

                } else {
                    console.log('betalen');
                    $scope.showYourturn = false;
                    $scope.showNavigation = false;
                    $scope.showBuy = false;
                    $scope.showPayday = true;
                    $scope.showBuyConfirmation = false;
                    $scope.showPayConfirmation = false;
                    $scope.showSelfBuy = false;

                    $scope.startWatching($scope.pay);

                }
            };

            $scope.buySquare = function () {
                console.log('buySquare');
                if (dataStorage.getCurrentSquare().price > dataStorage.getUser().money) {
                    alert('Je hebt helaas niet genoeg munten om dit vakje te kopen.');
                    $scope.declineSquare();
                } else {
                    //kopen
                    $scope.checkSrc = loadImgSrc;
                    $scope.$apply();
                    $.ajax({
                            type: "PUT",
                            url: apiURL + 'games/' + dataStorage.getGame()._id + '/squares/' + dataStorage.getCurrentSquare().id,
                            statusCode: {
                                403: function (data) {
                                    window.location.href = "#/app/login";
                                },
                                404: function (data) {
                                    console.log(data);
                                }
                            },
                            xhrFields: {
                                withCredentials: true
                            },
                            data: {
                                owner: dataStorage.getUser()._id
                            }
                        })
                        .done(function (data) {
                            $.ajax({
                                    type: "PUT",
                                    url: apiURL + 'games/' + dataStorage.getGame()._id,
                                    statusCode: {
                                        403: function (data) {
                                            window.location.href = "#/app/login";
                                        },
                                        400: function (data) {
                                            console.log(data);
                                        }
                                    },
                                    xhrFields: {
                                        withCredentials: true
                                    },
                                    data: {
                                        userToChange: dataStorage.getUser()._id,
                                        moneyAmount: (dataStorage.getCurrentSquare().price * -1),
                                        nextTurn: true
                                    }
                                })
                                .done(function (data) {
                                    var game = data;
                                    dataStorage.setGame(game);

                                    updateUser(function () {

                                        $scope.game = dataStorage.getGame();
                                        for (var u = 0; u < game.users.length; u++) {
                                            if (game.users[u].user._id == user._id) {
                                                //user found
                                                $scope.money = game.users[u].money;
                                            }
                                        }

                                        $scope.squares = [];

                                        for (var s = 0; s < game.streets.length; s++) {
                                            for (var sq = 0; sq < game.streets[s].squares.length; sq++) {

                                                var square = game.streets[s].squares[sq];

                                                square.userColours = [];

                                                for (var u = 0; u < square.users.length; u++) {
                                                    for (var gu = 0; gu < game.users.length; gu++) {
                                                        if (square.users[u]._id == game.users[gu].user._id) {
                                                            square.userColours.push(game.users[gu].color);
                                                        }
                                                    }

                                                    if (square.users[u]._id == dataStorage.getUser()._id) {
                                                        dataStorage.setCurrentSquare(square);
                                                    }
                                                }


                                                $scope.squares.push(square);
                                            }
                                        }
                                        $scope.checkSrc = checkImgSrc;
                                        $scope.showYourturn = false;
                                        $scope.showNavigation = false;
                                        $scope.showBuy = false;
                                        $scope.showPayday = false;
                                        $scope.showBuyConfirmation = false;
                                        $scope.showPayConfirmation = false;
                                        $scope.showSelfBuy = false;
                                        $scope.$apply();

                                        socket.emit('nextTurn', game._id);

                                    })


                                })


                        })
                }
            };


            $scope.declineSquare = function () {
                $scope.declineSrc = loadImgSrc;
                $scope.$apply();

                $.ajax({
                        type: "PUT",
                        url: apiURL + 'games/' + dataStorage.getGame()._id,
                        statusCode: {
                            403: function (data) {
                                window.location.href = "#/app/login";
                            },
                            400: function (data) {
                                console.log(data);
                            }
                        },
                        xhrFields: {
                            withCredentials: true
                        },
                        data: {
                            nextTurn: true
                        }
                    })
                    .done(function (data) {
                        var game = data;
                        dataStorage.setGame(game);

                        updateUser(function () {

                            $scope.game = dataStorage.getGame();
                            for (var u = 0; u < game.users.length; u++) {
                                if (game.users[u].user._id == user._id) {
                                    //user found
                                    $scope.money = game.users[u].money;
                                }
                            }

                            $scope.squares = [];

                            for (var s = 0; s < game.streets.length; s++) {
                                for (var sq = 0; sq < game.streets[s].squares.length; sq++) {

                                    var square = game.streets[s].squares[sq];

                                    square.userColours = [];

                                    for (var u = 0; u < square.users.length; u++) {
                                        for (var gu = 0; gu < game.users.length; gu++) {
                                            if (square.users[u]._id == game.users[gu].user._id) {
                                                square.userColours.push(game.users[gu].color);
                                            }
                                        }

                                        if (square.users[u]._id == dataStorage.getUser()._id) {
                                            dataStorage.setCurrentSquare(square);
                                        }
                                    }


                                    $scope.squares.push(square);
                                }
                            }

                            $scope.declineSrc = declineImgSrc;

                            $scope.showYourturn = false;
                            $scope.showNavigation = false;
                            $scope.showBuy = false;
                            $scope.showPayday = false;
                            $scope.showBuyConfirmation = false;
                            $scope.showPayConfirmation = false;
                            $scope.showSelfBuy = false;
                            $scope.$apply();

                            socket.emit('nextTurn', game._id);

                        })


                    })

            };

            $scope.acceptNoPay = function () {
                $scope.checkSrc = loadImgSrc;
                $scope.$apply();

                $.ajax({
                        type: "PUT",
                        url: apiURL + 'games/' + dataStorage.getGame()._id,
                        statusCode: {
                            403: function (data) {
                                window.location.href = "#/app/login";
                            },
                            400: function (data) {
                                console.log(data);
                            }
                        },
                        xhrFields: {
                            withCredentials: true
                        },
                        data: {
                            nextTurn: true
                        }
                    })
                    .done(function (data) {
                        var game = data;
                        dataStorage.setGame(game);

                        updateUser(function () {

                            $scope.game = dataStorage.getGame();
                            for (var u = 0; u < game.users.length; u++) {
                                if (game.users[u].user._id == user._id) {
                                    //user found
                                    $scope.money = game.users[u].money;
                                }
                            }

                            $scope.squares = [];

                            for (var s = 0; s < game.streets.length; s++) {
                                for (var sq = 0; sq < game.streets[s].squares.length; sq++) {

                                    var square = game.streets[s].squares[sq];

                                    square.userColours = [];

                                    for (var u = 0; u < square.users.length; u++) {
                                        for (var gu = 0; gu < game.users.length; gu++) {
                                            if (square.users[u]._id == game.users[gu].user._id) {
                                                square.userColours.push(game.users[gu].color);
                                            }
                                        }

                                        if (square.users[u]._id == dataStorage.getUser()._id) {
                                            dataStorage.setCurrentSquare(square);
                                        }
                                    }


                                    $scope.squares.push(square);
                                }
                            }

                            $scope.checkSrc = checkImgSrck;

                            $scope.showYourturn = false;
                            $scope.showNavigation = false;
                            $scope.showBuy = false;
                            $scope.showPayday = false;
                            $scope.showBuyConfirmation = false;
                            $scope.showPayConfirmation = false;
                            $scope.showSelfBuy = false;
                            $scope.$apply();

                            socket.emit('nextTurn', game._id);

                        })


                    })

            };

            $scope.pay = function () {
                $scope.checkSrc = loadImgSrc;
                $scope.$apply();

                $.ajax({
                        type: "PUT",
                        url: apiURL + 'games/' + dataStorage.getGame()._id,
                        statusCode: {
                            403: function (data) {
                                window.location.href = "#/app/login";
                            },
                            400: function (data) {
                                console.log(data);
                            }
                        },
                        xhrFields: {
                            withCredentials: true
                        },
                        data: {
                            userToChange: dataStorage.getUser()._id,
                            moneyAmount: (dataStorage.getCurrentSquare().rent * -1)
                        }
                    })
                    .done(function (data) {
                        $.ajax({
                                type: "PUT",
                                url: apiURL + 'games/' + dataStorage.getGame()._id,
                                statusCode: {
                                    403: function (data) {
                                        window.location.href = "#/app/login";
                                    },
                                    400: function (data) {
                                        console.log(data);
                                    }
                                },
                                xhrFields: {
                                    withCredentials: true
                                },
                                data: {
                                    userToChange: dataStorage.getCurrentSquare().owner._id,
                                    moneyAmount: dataStorage.getCurrentSquare().rent,
                                    nextTurn: true
                                }
                            })
                            .done(function (data) {
                                var game = data;
                                dataStorage.setGame(game);

                                updateUser(function () {

                                    $scope.game = dataStorage.getGame();
                                    for (var u = 0; u < game.users.length; u++) {
                                        if (game.users[u].user._id == user._id) {
                                            //user found
                                            $scope.money = game.users[u].money;
                                        }
                                    }

                                    $scope.squares = [];

                                    for (var s = 0; s < game.streets.length; s++) {
                                        for (var sq = 0; sq < game.streets[s].squares.length; sq++) {

                                            var square = game.streets[s].squares[sq];

                                            square.userColours = [];

                                            for (var u = 0; u < square.users.length; u++) {
                                                for (var gu = 0; gu < game.users.length; gu++) {
                                                    if (square.users[u]._id == game.users[gu].user._id) {
                                                        square.userColours.push(game.users[gu].color);
                                                    }
                                                }

                                                if (square.users[u]._id == dataStorage.getUser()._id) {
                                                    dataStorage.setCurrentSquare(square);
                                                }
                                            }


                                            $scope.squares.push(square);
                                        }
                                    }

                                    $scope.checkSrc = checkImgSrc;

                                    $scope.showYourturn = false;
                                    $scope.showNavigation = false;
                                    $scope.showBuy = false;
                                    $scope.showPayday = false;
                                    $scope.showBuyConfirmation = false;
                                    $scope.showPayConfirmation = false;
                                    $scope.showSelfBuy = false;
                                    $scope.$apply();

                                    socket.emit('nextTurn', game._id);

                                })


                            })


                    })
            }
        }
    });

    function distance(lat1, lon1, lat2, lon2) {
        var p = 0.017453292519943295;    // Math.PI / 180
        var c = Math.cos;
        var a = 0.5 - c((lat2 - lat1) * p) / 2 +
            c(lat1 * p) * c(lat2 * p) *
            (1 - c((lon2 - lon1) * p)) / 2;

        return 12742000 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }

    socket.on('nextTurn', function (data) {
        if (dataStorage.getGame() != undefined && dataStorage.getGame()._id == data) {
            checkForTurn();
        }

    });
});

myApp.controller('SettingsCtrl', function ($scope) {

})

myApp.controller('StartGameCtrl', function ($scope, dataStorage) {

    var updateUser = function (callback) {
        $.ajax({
                method: "GET",
                url: apiURL + 'users/currentUser',
                statusCode: {
                    500: function () {
                        console.log('Het is niet gelukt de user op te halen');
                    },
                    403: function () {
                        window.location.href = "#/app/login";
                    }
                },
                xhrFields: {
                    withCredentials: true
                }
            })
            .done(function (data) {
                // user = data;
                dataStorage.setUser(data);
                callback();
            })
    }


    var checkForCurrentGame = function () {

        updateUser(function () {
            console.log('checkForCurrentGame');
            // console.log('user', user);

            var user = dataStorage.getUser();
            for (var g = 0; g < user.games.length; g++) {
                var game = user.games[g].game;
                console.log(game);
                if (new Date(game.startTime).getTime() <= new Date().getTime() && new Date(game.endTime).getTime() > new Date().getTime() && game.isStarted) {
                    $.ajax({
                            method: "GET",
                            url: apiURL + 'games/' + game._id,
                            statusCode: {
                                500: function () {
                                    console.log('Het is niet gelukt de game op te halen');
                                },
                                403: function () {
                                    window.location.href = "#/app/login";
                                }
                            },
                            xhrFields: {
                                withCredentials: true
                            }
                        })
                        .done(function (data) {
                            // user = data;
                            dataStorage.setGame(data);
                            window.location.href = "#/app/game";
                            return;
                        })
                }
            }
        })
    }


    socket.on('gameJoined', function (data) {
        if ($scope.showNewGame && dataStorage.getGame() != undefined && dataStorage.getGame()._id == data) {
            $.ajax({
                    method: "GET",
                    url: apiURL + 'games/' + dataStorage.getGame()._id,
                    statusCode: {
                        500: function () {
                            console.log('Het is niet gelukt de game op te halen');
                        },
                        403: function () {
                            window.location.href = "#/app/login";
                        }
                    },
                    xhrFields: {
                        withCredentials: true
                    }
                })
                .done(function (data) {
                    // user = data;
                    dataStorage.setGame(data);
                    $scope.game = data;
                    $scope.$apply();
                    console.log(data);
                })
        }
    });

    socket.on('gameStarted', function (data) {
        if ($scope.showJoinGameWaiting && dataStorage.getGame() != undefined && dataStorage.getGame()._id == data) {
            $.ajax({
                    method: "GET",
                    url: apiURL + 'games/' + dataStorage.getGame()._id,
                    statusCode: {
                        500: function () {
                            console.log('Het is niet gelukt de game op te halen');
                        },
                        403: function () {
                            window.location.href = "#/app/login";
                        }
                    },
                    xhrFields: {
                        withCredentials: true
                    }
                })
                .done(function (data) {
                    // user = data;
                    dataStorage.setGame(data);
                    window.location.href = "#/app/game";
                })
        }
    });


    //TODO check if user is already in a game, if so, redirect

    // console.log(game);
    // console.log(user);

    $.ajax({
            method: "GET",
            url: apiURL + 'weather',
            statusCode: {
                500: function () {
                    console.log('Het is niet gelukt het weer op te halen');
                },
                403: function () {
                    window.location.href = "#/app/login";
                }
            },
            xhrFields: {
                withCredentials: true
            }
        })
        .done(function (data) {
            $scope.weatherMessage = data.message;
            $scope.pictureSrc = "img/" + data.picture;
        })

    if (dataStorage.getUser() == undefined) {
        $.ajax({
                method: "GET",
                url: apiURL + 'users/currentUser',
                statusCode: {
                    500: function () {
                        console.log('Het is niet gelukt de user op te halen');
                    },
                    403: function () {
                        window.location.href = "#/app/login";
                    }
                },
                xhrFields: {
                    withCredentials: true
                }
            })
            .done(function (data) {
                // user = data;
                dataStorage.setUser(data);

                checkForCurrentGame();
            })
    } else {
        checkForCurrentGame();
    }


    $scope.showStartGameButtons = true;
    $scope.showJoinGame = false;
    $scope.showJoinGameWaiting = false;
    $scope.joinGameFailed = false;
    $scope.showJoinGameWaiting = false;

    // $scope.showNewGame = true;
    // $scope.showStartGameButtons = false;
    $scope.startNewGame = function () {
        $.ajax({
                method: "POST",
                url: apiURL + 'games',
                statusCode: {
                    500: function () {
                        console.log('Het aanmaken van de game is helaas niet gelukt');
                    },
                    403: function () {
                        window.location.href = "#/app/login";
                    }
                },
                xhrFields: {
                    withCredentials: true
                },
                data: {}
            })
            .done(function (data) {
                var game = data;

                dataStorage.setGame(game);
                console.log('game', dataStorage.getGame());

                $scope.showNewGame = true;
                $scope.showStartGameButtons = false;
                console.log('game', game);
                $scope.game = game;
                $scope.$apply();
                console.log(game);
                console.log('game is aangemaakt');

            })
    }

    $scope.startGame = function () {
        $.ajax({
                type: "PUT",
                url: apiURL + 'games/' + dataStorage.getGame()._id,
                statusCode: {
                    403: function (data) {
                        window.location.href = "#/app/login";
                    },
                    400: function (data) {
                        console.log(data);
                    }
                },
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    isStarted: true,
                    users: [
                        dataStorage.getUser()
                    ]
                }
            })
            .done(function (data) {
                console.log(game);

                var game = data;

                dataStorage.setGame(game);

                console.log(game);
                socket.emit('gameStarted', game._id);
                window.location.href = "#/app/game";
            })
    }

    $scope.joinGame = function (joinGameId) {
        if (joinGameId != undefined) {
            $.ajax({
                    type: "PUT",
                    url: apiURL + 'games/' + joinGameId,
                    statusCode: {
                        403: function (data) {
                            window.location.href = "#/app/login";
                        },
                        400: function (data) {
                            $scope.joinGameFailed = true;
                            $scope.joinGameId = "";
                            $scope.$apply();
                        },
                        404: function (data) {
                            $scope.joinGameFailed = true;
                            $scope.joinGameId = "";
                            $scope.$apply();
                        }
                    },
                    xhrFields: {
                        withCredentials: true
                    },
                    data: JSON.stringify({
                        users: [
                            dataStorage.getUser()
                        ]
                    })
                })
                .done(function (data) {

                    var game = data;
                    console.log(game);
                    dataStorage.setGame(game);

                    console.log(game);
                    $scope.showStartGameButtons = false;
                    $scope.showJoinGame = false;
                    $scope.showJoinGameWaiting = false;
                    $scope.joinGameFailed = false;
                    $scope.showJoinGameWaiting = true;
                    $scope.$apply();

                    socket.emit('gameJoined', game._id);

                    console.log($scope.showJoinGameWaiting);


                    // window.location.href = "#/app/game";
                })
        } else {
            console.log('dat ging niet goed, joingameId undefined');
        }

    }


    $scope.goToJoinGame = function () {
        $scope.showStartGameButtons = false;
        $scope.showJoinGame = true;
        $scope.showJoinGameWaiting = false;
        $scope.joinGameFailed = false;
    }
})

myApp.controller('LoginCtrl', function ($scope, dataStorage) {
    var screenheight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    $scope.getLoginStyle = function () {
        return "position: absolute; top: " + (screenheight * 0.6) + "px; width: 100%;";
    }

    $scope.getSignupButtonStyle = function () {
        return "position: absolute; top: " + (screenheight * 0.59) + "px;  width: 10%; height: " + (screenheight * 0.15) + "px; left: 19%; ";
    }

    $scope.getLoginButtonStyle = function () {
        return "position: absolute; top: " + (screenheight * 0.59) + "px;  width: 10%; height: " + (screenheight * 0.15) + "px; left: 70%; ";
    }

    $scope.login = function (username, password) {
        console.log('inloggen', username, password);
        $.ajax({
                method: "POST",
                url: apiURL + 'login',
                statusCode: {
                    400: function () {
                        console.log("gebruikersnaam en/of wachtwoord is onjuist");
                    }
                },
                xhrFields: {
                    withCredentials: true
                },
                data: {"username": username, "password": password}
            })
            .done(function (data) {
                if (data.success) {
                    var currentUser = data.user;

                    // user = currentUser;

                    dataStorage.setUser(currentUser);

                    for (var g = 0; g < currentUser.games.length; g++) {
                        var game = currentUser.games[g];

                        if (game.startTime >= new Date() && game.endTime < new Date()) {
                            console.log('game is live at the moment');
                            console.log('active game: ', game);
                            window.location.href = "#/app/game";
                            return;
                        }
                    }

                    console.log('no active game found, start new game');
                    window.open('#/app/startGame', '_self ', 'location=yes');
                    //window.location.href = "#/app/startGame";

                }
                console.log(data);
            });
    }

    $scope.signup = function (username, password) {
        console.log('signup', username, password);
        $.ajax({
                method: "POST",
                url: apiURL + 'signup',
                statusCode: {
                    400: function () {
                        console.log("gebruikersnaam en/of wachtwoord is onjuist");
                    }
                },
                xhrFields: {
                    withCredentials: true
                },
                data: {"username": username, "password": password}
            })
            .done(function (data) {
                if (data.success) {
                    var currentUser = data.user;

                    // user = currentUser;

                    dataStorage.setUser(currentUser);

                    for (var g = 0; g < currentUser.games.length; g++) {
                        var game = currentUser.games[g];

                        if (game.startTime >= new Date() && game.endTime < new Date()) {
                            console.log('game is live at the moment');
                            console.log('active game: ', game);
                            window.location.href = "#/app/game";
                            return;
                        }
                    }

                    console.log('no active game found, start new game');
                    window.open('#/app/startGame', '_self ', 'location=yes');
                    //window.location.href = "#/app/startGame";

                }
                console.log(data);
            });
    }

    $scope.loginGithub = function () {
        var returnUrl = window.location.href.replace('login', '');

        returnUrl = encodeURIComponent(returnUrl);
        window.location.href = apiURL + "login/github?returnURL=" + returnUrl;
    }

    $scope.loginGoogle = function () {
        alert('loginGoogle');


        $scope.username = dataStorage.getUsername();
        $scope.password = dataStorage.getPassword();

        $scope.savePassword = function(password){
            dataStorage.setPassword(password);
            console.log('save password', dataStorage.getPassword());
        }

        $scope.saveUsername = function(username){
            dataStorage.setPassword(username);
            console.log('save username', dataStorage.getUsername());
        }

        var returnUrl = window.location.href.replace('login', '');
        alert(returnUrl);
        returnUrl = encodeURIComponent(returnUrl);
        alert(returnUrl);
        window.location.replace(apiURL + "login/google?returnURL=" + returnUrl);
        // window.location.href = apiURL + "login/google?returnURL=" + returnUrl;
    }

})

myApp.controller('LogoutCtrl', function ($scope, dataStorage) {
    dataStorage.setUser({});
    console.log('user na uitloggen', dataStorage.getUser());
    $.get(apiURL + 'signout', function (data) {
        window.location.href = "#/app/login";
    });

})

