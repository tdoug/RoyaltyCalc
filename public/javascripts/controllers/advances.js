app.controller('advances', ['$scope', '$http', '$interval',
function($scope, $http, $interval){

	$scope.get_provider_files($scope.advances);

	$scope.process_advances = function(advances)
	{
		$scope.setMsg('Processing Advances...');
		$http.post("/processing/process_advances", {
			provider: advances,
			quarter: $scope.quarter,
			year: $scope.year,
		}).success(function(res)
		{
			$scope.setMsg(res);
			$interval($scope.check_advance_entries, 5000, 2);			
		});
	};

	$scope.check_advance_entries = function()
	{
		$http.post("/api/providers/check_advances_entries", {
			quarter: $scope.quarter,
			year: $scope.year
		}).success(function(res){
			if(res.entries > 0)
				$scope.advances.entries_exist = res.entries;
		});
	};

	$interval($scope.check_advance_entries, 500, 2);

}]);