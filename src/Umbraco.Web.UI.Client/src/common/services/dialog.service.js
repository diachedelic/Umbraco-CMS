/**
 * @ngdoc service
 * @name umbraco.services.dialogService
 *
 * @requires $rootScope 
 * @requires $compile
 * @requires $http
 * @requires $log
 * @requires $q
 * @requires $templateCache
 *  
 * @description
 * Application-wide service for handling modals, overlays and dialogs
 * By default it injects the passed template url into a div to body of the document
 * And renders it, but does also support rendering items in an iframe, incase
 * serverside processing is needed, or its a non-angular page
 *
 * ##usage
 * To use, simply inject the dialogService into any controller that needs it, and make
 * sure the umbraco.services module is accesible - which it should be by default.
 *
 * <pre>
 *    var dialog = dialogService.open({template: 'path/to/page.html', show: true, callback: done});
 *    functon done(data){
 *      //The dialog has been submitted 
 *      //data contains whatever the dialog has selected / attached
 *    }     
 * </pre> 
 */

angular.module('umbraco.services')
.factory('dialogService', function ($rootScope, $compile, $http, $timeout, $q, $templateCache, $log) {

       var dialogs = [];
       
       /** Internal method that removes all dialogs */
       function removeAllDialogs(args) {
           for (var i = 0; i < dialogs.length; i++) {
               var dialog = dialogs[i];
               dialog.close(args);
               dialogs.splice(i, 1);
           }
       }

       /** Internal method that handles opening all dialogs */
       function openDialog(options) {

           var defaults = {
              container: $("body"),
              animation: "fade",
              modalClass: "umb-modal",
              width: "100%",
              inline: false,
              iframe: false,
              show: true,
              template: "views/common/notfound.html",
              callback: undefined,
              closeCallback: undefined,
              element: undefined,
              //this allows us to pass in data to the dialog if required which can be used to configure the dialog
              //and re-use it for different purposes. It will set on to the $scope.dialogData if it is defined.
              dialogData: undefined
           };
           
           var dialog = angular.extend(defaults, options);
           var scope = options.scope || $rootScope.$new();
           
           //Modal dom obj and unique id
           dialog.element = $('<div ng-swipe-right="hide()"  data-backdrop="false"></div>');
           var id = dialog.template.replace('.html', '').replace('.aspx', '').replace(/[\/|\.|:\&\?\=]/g, "-") + '-' + scope.$id;

           if (options.inline) {
               dialog.animation = "";
           }
           else {
               dialog.element.addClass("modal");
               dialog.element.addClass("hide");
           }

           //set the id and add classes
           dialog.element
               .attr('id', id)
               .addClass(dialog.animation)
               .addClass(dialog.modalClass);

           //push the modal into the global modal collection
           //we halt the .push because a link click will trigger a closeAll right away
           $timeout(function () {
               dialogs.push(dialog);
           }, 500);
           

           dialog.close = function(data) {
              if (dialog.closeCallback) {
                   dialog.closeCallback(data);
              }

              if(dialog.element){
                 dialog.element.modal('hide');
                 dialog.element.remove();
                 $("#" + dialog.element.attr("id")).remove();
               }
           };

           //if iframe is enabled, inject that instead of a template
           if (dialog.iframe) {
               var html = $("<iframe auto-scale='0' src='" + dialog.template + "' style='border: none; width: 100%; height: 100%;'></iframe>");
               dialog.element.html(html);
  
               //append to body or whatever element is passed in as options.containerElement
               dialog.container.append(dialog.element);

               // Compile modal content
               $timeout(function () {
                   $compile(dialog.element)(dialog.scope);
               });

               dialog.element.css("width", dialog.width);

               //Autoshow 
               if (dialog.show) {
                   dialog.element.modal('show');
               }

               dialog.scope = scope;
               return dialog;
           }
           else {
               
             //We need to load the template with an httpget and once it's loaded we'll compile and assign the result to the container
             // object. However since the result could be a promise or just data we need to use a $q.when. We still need to return the 
             // $modal object so we'll actually return the modal object synchronously without waiting for the promise. Otherwise this openDialog
             // method will always need to return a promise which gets nasty because of promises in promises plus the result just needs a reference
             // to the $modal object which will not change (only it's contents will change).
             $q.when($templateCache.get(dialog.template) || $http.get(dialog.template, { cache: true }).then(function(res) { return res.data; }))
                 .then(function onSuccess(template) {

                     // Build modal object
                     dialog.element.html(template);

                     //append to body or other container element  
                     dialog.container.append(dialog.element);
                     
                     // Compile modal content
                     $timeout(function() {
                         $compile(dialog.element)(scope);
                     });

                     scope.dialogOptions = dialog;
                     
                     //Scope to handle data from the modal form
                     scope.dialogData = dialog.dialogData ? dialog.dialogData : {};
                     scope.dialogData.selection = [];

                     // Provide scope display functions
                     //this passes the modal to the current scope
                     scope.$modal = function(name) {
                         dialog.element.modal(name);
                     };

                     scope.hide = function() {
                         dialog.element.modal('hide');

                         dialog.element.remove();
                         $("#" + dialog.element.attr("id")).remove();
                     };

                     //basic events for submitting and closing
                     scope.submit = function(data) {
                         if (dialog.callback) {
                             dialog.callback(data);
                         }

                         dialog.element.modal('hide');
                         dialog.element.remove();
                         $("#" + dialog.element.attr("id")).remove();
                     };

                     scope.close = function(data) {
                        dialog.close(data);
                     };

                     scope.show = function() {
                         dialog.element.modal('show');
                     };

                     scope.select = function(item) {
                        var i = scope.dialogData.selection.indexOf(item);
                         if (i < 0) {
                             scope.dialogData.selection.push(item);
                         }else{
                            scope.dialogData.selection.splice(i, 1);
                         }
                     };

                     scope.dismiss = scope.hide;

                     // Emit modal events
                     angular.forEach(['show', 'shown', 'hide', 'hidden'], function(name) {
                         dialog.element.on(name, function(ev) {
                             scope.$emit('modal-' + name, ev);
                         });
                     });

                     // Support autofocus attribute
                     dialog.element.on('shown', function(event) {
                         $('input[autofocus]', dialog.element).first().trigger('focus');
                     });

                     //Autoshow 
                     if (dialog.show) {
                         dialog.element.modal('show');
                     }

                     dialog.scope = scope;
               });
               
               //Return the modal object outside of the promise!
               return dialog;
           }
       }

       /** Handles the closeDialogs event */
       $rootScope.$on("closeDialogs", function (evt, args) {
           removeAllDialogs(args);
       });

       return {
           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#open
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a modal rendering a given template url.
            *
            * @param {Object} options rendering options
            * @param {DomElement} options.container the DOM element to inject the modal into, by default set to body
            * @param {Function} options.callback function called when the modal is submitted
            * @param {String} options.template the url of the template
            * @param {String} options.animation animation csss class, by default set to "fade"
            * @param {String} options.modalClass modal css class, by default "umb-modal"
            * @param {Bool} options.show show the modal instantly
            * @param {Object} options.scope scope to attach the modal to, by default rootScope.new()
            * @param {Bool} options.iframe load template in an iframe, only needed for serverside templates
            * @param {Int} options.width set a width on the modal, only needed for iframes
            * @param {Bool} options.inline strips the modal from any animation and wrappers, used when you want to inject a dialog into an existing container
            * @returns {Object} modal object
            */
           open: function (options) {               
               return openDialog(options);
           },
           
           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#close
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Closes a specific dialog
            * @param {Object} dialog the dialog object to close
            * @param {Object} args if specified this object will be sent to any callbacks registered on the dialogs.
            */
           close: function (dialog, args) {
              if(dialog){
                  dialog.close(args);
              }              
           },
           
           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#closeAll
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Closes all dialogs
            * @param {Object} args if specified this object will be sent to any callbacks registered on the dialogs.
            */
           closeAll: function(args) {
               removeAllDialogs(args);
           },

           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#mediaPicker
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a media picker in a modal, the callback returns an array of selected media items
            * @param {Object} options mediapicker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {Function} options.callback callback function
            * @returns {Object} modal object
            */
           mediaPicker: function (options) {
            options.template = 'views/common/dialogs/mediaPicker.html';
            options.show = true;
            return openDialog(options);
           },


           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#contentPicker
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a content picker tree in a modal, the callback returns an array of selected documents
            * @param {Object} options content picker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {$scope} options.multipicker should the picker return one or multiple items
            * @param {Function} options.callback callback function
            * @returns {Object} modal object
            */
           contentPicker: function (options) {
               options.template = 'views/common/dialogs/contentPicker.html';
               options.show = true;
              return openDialog(options);
           },

           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#linkPicker
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a link picker tree in a modal, the callback returns a single link
            * @param {Object} options content picker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {Function} options.callback callback function
            * @returns {Object} modal object
            */
           linkPicker: function (options) {
               options.template = 'views/common/dialogs/linkPicker.html';
               options.show = true;
              return openDialog(options);
           },

           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#macroPicker
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a mcaro picker in a modal, the callback returns a object representing the macro and it's parameters
            * @param {Object} options macropicker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {Function} options.callback callback function
            * @returns {Object} modal object
            */
           macroPicker: function (options) {
                options.template = 'views/common/dialogs/insertmacro.html';
                options.show = true;
                options.modalClass = "span7 umb-modal";
                return openDialog(options);
           },

           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#memberPicker
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a member picker in a modal, the callback returns a object representing the selected member
            * @param {Object} options member picker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {$scope} options.multiPicker should the tree pick one or multiple members before returning
            * @param {Function} options.callback callback function
            * @returns {Object} modal object
            */
           memberPicker: function (options) {
               options.template = 'views/common/dialogs/memberPicker.html';
               options.show = true;
              return openDialog(options);
           },
           
           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#memberGroupPicker
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a member group picker in a modal, the callback returns a object representing the selected member
            * @param {Object} options member group picker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {$scope} options.multiPicker should the tree pick one or multiple members before returning
            * @param {Function} options.callback callback function
            * @returns {Object} modal object
            */
           memberGroupPicker: function (options) {
               options.template = 'views/common/dialogs/memberGroupPicker.html';
               options.show = true;
               return openDialog(options);
           },

           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#iconPicker
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a icon picker in a modal, the callback returns a object representing the selected icon
            * @param {Object} options iconpicker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {Function} options.callback callback function
            * @returns {Object} modal object
            */
           iconPicker: function (options) {
                options.template = 'views/common/dialogs/iconPicker.html';
                options.show = true;
                return openDialog(options);
           },

           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#treePicker
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a tree picker in a modal, the callback returns a object representing the selected tree item
            * @param {Object} options iconpicker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {$scope} options.section tree section to display
            * @param {$scope} options.treeAlias specific tree to display
            * @param {$scope} options.multiPicker should the tree pick one or multiple items before returning
            * @param {Function} options.callback callback function
            * @returns {Object} modal object
            */
           treePicker: function (options) {
                options.template = 'views/common/dialogs/treePicker.html';
                options.show = true;
                return openDialog(options);
           },

           /**
            * @ngdoc method
            * @name umbraco.services.dialogService#propertyDialog
            * @methodOf umbraco.services.dialogService
            *
            * @description
            * Opens a dialog with a chosen property editor in, a value can be passed to the modal, and this value is returned in the callback
            * @param {Object} options mediapicker dialog options object
            * @param {$scope} options.scope dialog scope
            * @param {Function} options.callback callback function
            * @param {String} editor editor to use to edit a given value and return on callback
            * @param {Object} value value sent to the property editor
            * @returns {Object} modal object
            */
          propertyDialog: function (options) {
              options.template = 'views/common/dialogs/property.html';
              options.show = true;
              return openDialog(options);
          },
           
           /**
           * @ngdoc method
           * @name umbraco.services.dialogService#ysodDialog
           * @methodOf umbraco.services.dialogService
           *
           * @description
           * Opens a dialog to an embed dialog 
           */
          embedDialog: function (options) {
              options.template = 'views/common/dialogs/rteembed.html';
              options.show = true;
              return openDialog(options);
          },
           /**
           * @ngdoc method
           * @name umbraco.services.dialogService#ysodDialog
           * @methodOf umbraco.services.dialogService
           *
           * @description
           * Opens a dialog to show a custom YSOD
           */
           ysodDialog: function (ysodError) {

               var newScope = $rootScope.$new();
               newScope.error = ysodError;
               return openDialog({
                   modalClass: "umb-modal wide",
                   scope: newScope,
                   //callback: options.callback,
                   template: 'views/common/dialogs/ysod.html',
                   show: true
               });
           }
       };
   });