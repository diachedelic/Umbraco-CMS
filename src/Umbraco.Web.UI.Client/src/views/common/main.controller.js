
/**
 * @ngdoc controller
 * @name Umbraco.MainController
 * @function
 * 
 * @description
 * The main application controller
 * 
 */
function MainController($scope, $location, $routeParams, $rootScope, $timeout, $http, $log, notificationsService, userService, navigationService, legacyJsLoader, updateChecker) {

    var legacyTreeJsLoaded = false;
    
    //detect if the current device is touch-enabled
    //todo, move this out of the controller
    $scope.touchDevice = ("ontouchstart" in window || window.touch || window.navigator.msMaxTouchPoints===5 || window.DocumentTouch && document instanceof DocumentTouch);
    navigationService.touchDevice = $scope.touchDevice;

    //the null is important because we do an explicit bool check on this in the view
    //the avatar is by default the umbraco logo    
    $scope.authenticated = null;
    $scope.avatar = "assets/img/application/logo.png";

    //subscribes to notifications in the notification service
    $scope.notifications = notificationsService.current;
    $scope.$watch('notificationsService.current', function (newVal, oldVal, scope) {
        if (newVal) {
            $scope.notifications = newVal;
        }
    });

    $scope.removeNotification = function (index) {
        notificationsService.remove(index);
    };

    $scope.closeDialogs = function (event) {
        //only close dialogs if non-link and non-buttons are clicked
        var el = event.target.nodeName;
        var els = ["INPUT","A","BUTTON"];

        if(els.indexOf(el) >= 0){return;}

        var parents = $(event.target).parents("a,button");
        if(parents.length > 0){
            return;
        }

        //SD: I've updated this so that we don't close the dialog when clicking inside of the dialog
        var nav = $(event.target).parents("#navigation");
        if (nav.length === 1) {
            return;
        }

        $rootScope.$emit("closeDialogs", event);
    };

    //when a user logs out or timesout
    $scope.$on("notAuthenticated", function() {
        $scope.authenticated = null;
        $scope.user = null;
    });
    
    //when a user is authorized setup the data
    $scope.$on("authenticated", function (evt, data) {

        //We need to load in the legacy tree js but only once no matter what user has logged in 
        if (!legacyTreeJsLoaded) {
            legacyJsLoader.loadLegacyTreeJs($scope).then(
                function (result) {
                    legacyTreeJsLoaded = true;

                    //TODO: We could wait for this to load before running the UI ?
                });
        }

        $scope.authenticated = data.authenticated;
        $scope.user = data.user;

        updateChecker.check().then(function(update){
            if(update && update !== "null"){
                if(update.type !== "None"){
                    var notification = {
                           headline: "Update available",
                           message: "Click to download",
                           sticky: true,
                           type: "info",
                           url: update.url
                    };
                    notificationsService.add(notification);
                }
            }
        });

        //if the user has changed we need to redirect to the root so they don't try to continue editing the
        //last item in the URL
        if (data.lastUserId && data.lastUserId !== data.user.id) {
            $location.path("/").search("");
        }

        if($scope.user.emailHash){
            $timeout(function(){
                //yes this is wrong.. 
                $("#avatar-img").fadeTo(1000, 0, function(){
                      
                      $timeout(function(){
                        $scope.avatar = "http://www.gravatar.com/avatar/" + $scope.user.emailHash +".jpg?s=32&d=wavatar";
                      });
                      
                      $("#avatar-img").fadeTo(1000, 1);
                });
              }, 3000);  
        }

    });

}


//register it
angular.module('umbraco').controller("Umbraco.MainController", MainController);