app.controller('providers', function($scope, $http, $window) {
	    
    $scope.save_provider = function(provider)
    {
    	$http.post("/api/providers/save", {provider: provider}).success(function (response) {
    		$window.location.href = "/settings/providers/list";
    	});
	};

	$scope.load_providers = function()
	{		
		$http.post("/api/providers/list").success(function (response) {
			$scope.providers = response;	
		});	

	};

	$scope.get_matching_fields = function()
	{		
		$http.post("/api/providers/get_matching_fields").success(function (response) {
			$scope.matching_fields = response;			 			
		});	
	};

	$scope.load_provider = function()
	{
		var provider_id = document.getElementsByName("provider_exists")[0].value;
		
		if(provider_id % 1 !== 0)
			return false;

		$http.post("/api/providers/loadOne", {provider_id:provider_id}).success(function (response) {
			
			if(response.length < 1)
				return false;

			var provider = JSON.parse(response[0].provider_data);
			provider.name = response[0].provider_name;
			provider.id = response[0].id;			
			$scope.provider = provider;
		});
	}

	$scope.delete_provider = function(provider_id)
	{
		$http.post("/api/providers/delete", {provider_id: provider_id}).success(function (response) {
    		$scope.load_providers();
    	});
	}
});