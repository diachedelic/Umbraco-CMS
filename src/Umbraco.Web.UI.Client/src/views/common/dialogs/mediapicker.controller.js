//used for the media picker dialog
angular.module("umbraco")
    .controller("Umbraco.Dialogs.MediaPickerController",
        function($scope, mediaResource, umbRequestHelper, entityResource, $log, imageHelper, eventsService) {

            var dialogOptions = $scope.$parent.dialogOptions;
            $scope.options = {
                url: umbRequestHelper.getApiUrl("mediaApiBaseUrl", "PostAddFile"),
                autoUpload: true,
                formData: {
                    currentFolder: -1
                }
            };

            $scope.submitFolder = function(e) {
                if (e.keyCode === 13) {
                    e.preventDefault();
                    $scope.showFolderInput = false;

                    mediaResource
                        .addFolder($scope.newFolderName, $scope.options.formData.currentFolder)
                        .then(function(data) {

                            $scope.gotoFolder(data.id);
                        });
                }
            };

            $scope.gotoFolder = function(folderId) {

                if (folderId > 0) {
                    entityResource.getAncestors(folderId, "media")
                        .then(function(anc) {
                            // anc.splice(0,1);  
                            $scope.path = anc;
                        });
                }
                else {
                    $scope.path = [];
                }
                //mediaResource.rootMedia()
                mediaResource.getChildren(folderId)
                    .then(function(data) {

                        $scope.images = [];
                        $scope.searchTerm = "";
                        $scope.images = data.items;
                        //update the thumbnail property
                        _.each($scope.images, function(img) {
                            img.thumbnail = imageHelper.getThumbnail({ imageModel: img, scope: $scope });
                        });
                        //reject all images that have an empty thumbnail - this can occur if there's an image item
                        // that doesn't have an uploaded image.
                        $scope.images = _.reject($scope.images, function(item) {
                            return item.contentTypeAlias.toLowerCase() !== "folder" && item.thumbnail === "";
                        });
                    });

                $scope.options.formData.currentFolder = folderId;
            };


            $scope.$on('fileuploadstop', function(event, files) {
                $scope.gotoFolder($scope.options.formData.currentFolder);
            });

            $scope.clickHandler = function(image, ev) {

                if (image.contentTypeAlias.toLowerCase() == 'folder') {
                    $scope.options.formData.currentFolder = image.id;
                    $scope.gotoFolder(image.id);
                }
                else if (image.contentTypeAlias.toLowerCase() == 'image') {
                    eventsService.publish("Umbraco.Dialogs.MediaPickerController.Select", image).then(function (img) {
                        if (dialogOptions && dialogOptions.multiPicker) {
                            $scope.select(img);
                            img.cssclass = ($scope.dialogData.selection.indexOf(img) > -1) ? "selected" : "";
                        }
                        else {
                            $scope.submit(img);
                        }
                    });
                }

                ev.preventDefault();
            };

            $scope.selectMediaItem = function(image) {
                if (image.contentTypeAlias.toLowerCase() == 'folder') {
                    $scope.options.formData.currentFolder = image.id;
                    $scope.gotoFolder(image.id);
                }
                else if (image.contentTypeAlias.toLowerCase() == 'image') {

                    eventsService.publish("Umbraco.Dialogs.MediaPickerController.Select", image).then(function(img) {
                        if (dialogOptions && dialogOptions.multiPicker) {
                            $scope.select(img);
                        }
                        else {
                            $scope.submit(img);
                        }
                    });
                }
            };

            $scope.gotoFolder(-1);
        });