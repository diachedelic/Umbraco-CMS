//used for the media picker dialog
angular.module("umbraco").controller("Umbraco.Editors.Media.MoveController",
	function ($scope, eventsService, mediaResource, $log) {	
	var dialogOptions = $scope.$parent.dialogOptions;
	
	$scope.dialogTreeEventHandler = $({});
	var node = dialogOptions.currentNode;

	$scope.dialogTreeEventHandler.bind("treeNodeSelect", function(ev, args){
		args.event.preventDefault();
		args.event.stopPropagation();

		eventsService.publish("Umbraco.Editors.Media.MoveController.Select", args).then(function(args){
			var c = $(args.event.target.parentElement);
			if($scope.selectedEl){
				$scope.selectedEl.find(".temporary").remove();
				$scope.selectedEl.find("i.umb-tree-icon").show();
			}

			c.find("i.umb-tree-icon").hide()
			.after("<i class='icon umb-tree-icon sprTree icon-check blue temporary'></i>");
			
			$scope.target = args.node;
			$scope.selectedEl = c;
		});
	});

	$scope.move = function(){
		mediaResource.move({parentId: $scope.target.id, id: node.id})
			.then(function(){
				$scope.error = false;
				$scope.success = true;
			},function(err){
				$scope.success = false;
				$scope.error = err;
			});
	};
});