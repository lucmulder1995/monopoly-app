// myApp.factory('user', function(){
//     return {};
// });
//
// myApp.factory('game', function(){
//     return {};
// });
//
// myApp.factory('user', function () {
//
//     var data = {
//         'user': {}
//     }
//
//     return {
//         getUser: function () {
//             return data.user;
//         },
//         setUser: function (user) {
//             data.user = user;
//         }
//     };
// });

myApp.factory('dataStorage', function () {

    var data;

    if(window.localStorage['dataStorage'] != undefined){
        data = JSON.parse(window.localStorage['dataStorage']);
    }else{
        data = {};
    }

    var saveData = function(){
        window.localStorage['dataStorage'] = JSON.stringify(data);
    }

    return {
        getGame: function () {
            return data.game;
        },
        setGame: function (game) {
            data.game = game;
            saveData();
        },
        getUser: function () {
            return data.user;
        },
        setUser: function (user) {
            data.user = user;
            saveData();
        },
        setCurrentSquare: function(square){
            data.currentSquare = square;
            saveData();
        },
        getCurrentSquare: function () {
            return data.currentSquare;
        },
        setUsername: function(username){
            data.username = username;
            saveData();
        },
        getUsername: function(){
            return data.username;
        },setPassword: function(password){
            data.password = password;
            saveData();
        },
        getPassword: function(){
            return data.password;
        },setShake: function(shake){
            data.shake = shake;
            saveData();
        },
        getShake: function(){
            return data.shake;
        }
    };
});


/*
 ===========================================================================
 G O O G L E   M A P S
 ===========================================================================
 */
myApp.factory('GoogleMapsService', ['$rootScope', '$ionicLoading', '$timeout', '$window', '$document', 'ConnectivityService', function($rootScope, $ionicLoading, $timeout, $window, $document, ConnectivityService){

    var apiKey = false,
        map = null,
        mapDiv = null,
        directionsService,
        directionsDisplay,
        routeResponse;

    function initService(mapEl, key) {
        mapDiv = mapEl;
        if (typeof key !== "undefined") {
            apiKey = key;
        }
        if (typeof google == "undefined" || typeof google.maps == "undefined") {
            disableMap();
            if (ConnectivityService.isOnline()) {
                $timeout(function() {
                    loadGoogleMaps();
                },0);
            }
        } else {
            if (ConnectivityService.isOnline()) {
                initMap();
                enableMap();
            } else {
                disableMap();
            }
        }
    }

    function initMap() {
        if (mapDiv) {
            var mapOptions = {
                zoom: 10,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            map = new google.maps.Map(mapDiv, mapOptions);
            directionsService = new google.maps.DirectionsService();
            directionsDisplay = new google.maps.DirectionsRenderer();
            directionsDisplay.setMap(map);
            // Wait until the map is loaded
            google.maps.event.addListenerOnce(map, 'idle', function(){
                enableMap();
            });
        }
    }

    function enableMap() {
// For demonstration purposes we’ll use a $rootScope variable to enable/disable the map.
// However, an alternative option would be to broadcast an event and handle it in the controller.
        $rootScope.enableMap = true;
    }

    function disableMap() {
        $rootScope.enableMap = false;
    }

    function loadGoogleMaps() {
        // This function will be called once the SDK has been loaded
        $window.mapInit = function() {
            initMap();
        };

        // Create a script element to insert into the page
        var script = $document[0].createElement("script");
        script.type = "text/javascript";
        script.id = "googleMaps";

        // Note the callback function in the URL is the one we created above
        if (apiKey) {
            script.src = 'https://maps.google.com/maps/api/js?key=' + apiKey + '&sensor=true&callback=mapInit';
        } else {
            script.src = 'https://maps.google.com/maps/api/js?sensor=true&callback=mapInit';
        }
        $document[0].body.appendChild(script);
    }

    function checkLoaded() {
        if (typeof google == "undefined" || typeof google.maps == "undefined") {
            $timeout(function() {
                loadGoogleMaps();
            },2000);
        } else {
            enableMap();
        }
    }

    function addRoute(origin, destination, waypts, optimizeWaypts) {
        routeResponse = null;
        if (typeof google !== "undefined") {
            var routeRequest = {
                origin : origin,
                destination : destination,
                waypoints: waypts,
                optimizeWaypoints: optimizeWaypts,
                travelMode : google.maps.TravelMode.DRIVING
            };

            directionsService.route(routeRequest, function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                    google.maps.event.trigger(map, 'resize');
                    // Save the response so we access it from controller
                    routeResponse = response;
                    // Broadcast event so controller can process the route response
                    $rootScope.$broadcast('googleRouteCallbackComplete');
                }
            });
        }
    }

    function removeRoute() {
        if (typeof google !== "undefined" && typeof directionsDisplay !== "undefined") {
            directionsDisplay.setMap(null);
            directionsDisplay = null;
            directionsDisplay = new google.maps.DirectionsRenderer();
            directionsDisplay.setMap(map);
        }
    }

    return {
        initService: function(mapEl, key){
            initService(mapEl, key);
        },
        checkLoaded: function(){
            checkLoaded();
        },
        disableMap: function(){
            disableMap();
        },
        removeRoute: function(){
            removeRoute();
        },
        getRouteResponse: function(){
            return routeResponse;
        },
        addRoute: function(origin, destination, waypts, optimizeWaypts){
            addRoute(origin, destination, waypts, optimizeWaypts);
        }
    };

}]);

/*
 ===========================================================================
 C O N N E C T I V I T Y
 ===========================================================================
 */
myApp.factory('ConnectivityService', [function(){
        return {
            isOnline: function(){
                var status = localStorage.getItem('networkStatus');
                if (status === null || status == "online") {
                    return true;
                } else {
                    return false;
                }
            }
        };
    }]);
    /*
     ===========================================================================
     N E T W O R K
     ===========================================================================
     */
myApp.factory('NetworkService', ['GoogleMapsService', function(GoogleMapsService){
        /*
         * handles network events (online/offline)
         */
        return {
            networkEvent: function(status){
                var pastStatus = localStorage.getItem('networkStatus');
                if (status == "online" && pastStatus != status) {
                    // The app has regained connectivity...
                    GoogleMapsService.checkLoaded();
                }
                if (status == "offline" && pastStatus != status) {
                    // The app has lost connectivity...
                    GoogleMapsService.disableMap();
                }
                localStorage.setItem('networkStatus', status);
                return true;
            }
        };
    }]);