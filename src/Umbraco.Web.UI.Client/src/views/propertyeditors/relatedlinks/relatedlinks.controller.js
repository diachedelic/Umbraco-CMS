﻿angular.module("umbraco")
    .controller("Umbraco.PropertyEditors.RelatedLinksController",
        function ($rootScope, $scope, dialogService) {

            if (!$scope.model.value) {
                $scope.model.value = [];
            }
            
            $scope.newCaption = '';
            $scope.newLink = 'http://';
            $scope.newNewWindow = false;
            $scope.newInternal = null;
            $scope.newInternalName = '';
            $scope.addExternal = true;
            $scope.currentEditLink = null;
            $scope.hasError = false;
            
            //$scope.relatedLinks = [
            //    { caption: 'Google', link: "http://google.com", newWindow: false, edit:false },
            //    { caption: 'Umbraco', link: "http://umbraco.com", newWindow: false, edit: false },
            //    { caption: 'Nibble', link: "http://nibble.be", newWindow: false, edit: false }
            //];

            $scope.internal = function ($event) {

                $scope.currentEditLink = null;
                
                var d = dialogService.contentPicker({ scope: $scope, multipicker: false, callback: select });

                $event.preventDefault();
            };
            
            $scope.selectInternal = function ($event, link) {

                $scope.currentEditLink = link;
                
                var d = dialogService.contentPicker({ scope: $scope, multipicker: false, callback: select });

                $event.preventDefault();
            };

            $scope.edit = function (idx) {
                for (var i = 0; i < $scope.model.value.length; i++) {
                    $scope.model.value[i].edit = false;
                }
                $scope.model.value[idx].edit = true;
            };

            $scope.cancelEdit = function(idx) {
                $scope.model.value[idx].edit = false;
            };
            
            $scope.delete = function (idx) {
                
                $scope.model.value.splice($scope.model.value[idx], 1);
                
            };

            $scope.add = function () {
                if ($scope.newCaption == "") {
                    $scope.hasError = true;
                } else {
                    if ($scope.addExternal) {
                        var newExtLink = new function() {
                            this.caption = $scope.newCaption;
                            this.link = $scope.newLink;
                            this.newWindow = $scope.newNewWindow;
                            this.edit = false;
                            this.isInternal = false;
                        };
                        $scope.model.value.push(newExtLink);
                    } else {
                        var newIntLink = new function() {
                            this.caption = $scope.newCaption;
                            this.link = $scope.newLink;
                            this.newWindow = $scope.newNewWindow;
                            this.internal = $scope.newInternal;
                            this.edit = false;
                            this.isInternal = true;
                            this.iternalName = $scope.newInternalName;
                        };
                        $scope.model.value.push(newIntLink);
                    }
                    $scope.newCaption = '';
                    $scope.newLink = 'http://';
                    $scope.newNewWindow = false;
                    $scope.newInternal = null;
                    $scope.newInternalName = '';

                }
            };

            $scope.switch = function ($event) {
                $scope.addExternal = !$scope.addExternal;
                $event.preventDefault();
            };
            
            $scope.switchLinkType = function ($event,link) {
                link.isInternal = !link.isInternal;
                $event.preventDefault();
            };
            
            function select(data) {
                if ($scope.currentEditLink != null) {
                    $scope.currentEditLink.internal = data.id;
                    $scope.currentEditLink.internalName = data.name;
                } else {
                    $scope.newInternal = data.id;
                    $scope.newInternalName = data.name;
                }
            }

            

        });