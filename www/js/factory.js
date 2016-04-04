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
            saveData;
        },
        getUsername: function(){
            return data.username;
        },setPassword: function(password){
            data.password = password;
            saveData;
        },
        getPassword: function(){
            return data.password;
        }
    };
});