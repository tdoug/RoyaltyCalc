app.controller('processing', ['$scope', '$http', '$interval',
	function($scope, $http, $interval){

	$scope.process_file = function(provider, file)
	{		
		$scope.setMsg('Processing '+file+'...');
		$http.post("/processing/process_file", {
			provider: provider,
			quarter: $scope.quarter,
			year: $scope.year,
			file: file
		}).success(function(res)
		{
			$scope.setMsg(res);
			$interval($scope.check_provider_entries, 10000, 2);	
		});
	};

	$scope.process_all_provider_files = function(provider)
	{		
		var timeout_amount = 0;
		provider.entries_exist = undefined;
		$http.post("/api/providers/clear_data", {
			provider_id: provider.id,
			quarter: $scope.quarter,
			year: $scope.year,
		}).success(function(res){			
			$scope.setMsg(provider.provider_name + " data has been cleared.");
			
			$http.post("/processing/process_files", {
				provider: provider,
				quarter: $scope.quarter,
				year: $scope.year,
				files: provider.files
			}).success(function(res)
			{				
				$scope.setMsg(res);
				$interval($scope.check_provider_entries, 10000, 2);			
			});
		});
	};
}]);