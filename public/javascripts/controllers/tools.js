app.controller('tools', function($scope, $http, $window) {

	$scope.lines = {};

	$scope.search_line_title = function(title, provider){
		if(provider == undefined)
		{
			$scope.setMsg('Please select a provider.', 'error');
			return false;
		}
		$http.post("/api/tools/find_line_by_title", {title: title, provider:provider}).success(function (lines) {
    		$scope.lines = lines;
    		
    		if($scope.lines.length == 0)
    			$scope.setMsg("No entries found.  Please search again.");
    	});
	};
	$scope.search_line_isbn = function(isbn, provider){
		if(provider == undefined)
		{
			$scope.setMsg('Please select a provider.', 'error');
			return false;
		}
		$http.post("/api/tools/find_line_by_isbn", {isbn:isbn, provider: provider}).success(function (lines) {
    		$scope.lines = lines;
    	});
	};
	$scope.save_line = function(line)
	{
		$http.post("/api/tools/save_line", {line:line}).success(function (res) {
			$scope.setMsg("Line Updated");
		});		
	};
	$scope.load_discrepancies = function()
	{
		$http.post('/api/tools/load_discrepancies', {quarter: $scope.quarter, year: $scope.year}).success(
			function(res){
				$scope.discrepancies = res;
		});
	};
	$scope.correct_discrepancy = function(discrepancy)
	{
		//console.log(discrepancy);
		if(discrepancy.isbn.length < 10)
		{
			$scope.setMsg("The ISBN number you entered must be at least 10 characters.",'error');
			return false;
		}
		if(discrepancy.isbn.length > 13)
		{
			$scope.setMsg("The ISBN number you entered must be no more than 13 characters.","error");
			return false;
		}
		discrepancy.resolved = 1;
		$http.post('/api/tools/correct_discrepancy', {discrepancy}).success(function(res){
			$scope.setMsg("Discrepancy resolved.")
		});
	};

});