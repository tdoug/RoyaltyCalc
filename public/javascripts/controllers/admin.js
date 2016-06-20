app.controller('admin', ['$scope', '$http',
function($scope, $http){

	$scope.check_quarter = function()
	{
		var quarter = $scope.quarter.replace("Q","");
		var year = $scope.year;

		$http.post("/api/check_quarter", {quarter:quarter, year:year}).success(function(res)
		{   			
			if(res.length > 0)
	        	$scope.quarter_is_published = 1;
	    });
	};

	$scope.publish_quarter = function()
	{
		var quarter = $scope.quarter.replace("Q","");
		var year = $scope.year;

		if(confirm("Are you ABSOLUTELY SURE you want to publish all PDFs for " + $scope.quarter + " " + $scope.year + "?  Click 'cancel' to exit."))
		{
			$http.post("/api/publish_quarter", {quarter:quarter, year:year}).success(function(res)
			{            
		        $scope.setMsg("Quarter Published.  PDFs will appear at midnight on the appropriate date.");
		        $scope.quarter_is_published = 1;
		    });
		}
	};

	$scope.unpublish_quarter = function()
	{
		var quarter = $scope.quarter.replace("Q","");
		var year = $scope.year;

		if(confirm("Are you ABSOLUTELY SURE you want to unpublish all PDFs for " + $scope.quarter + " " + $scope.year + "?  Click 'cancel' to exit."))
		{
			$http.post("/api/unpublish_quarter", {quarter:quarter, year:year}).success(function(res)
			{            
		        $scope.setMsg("Quarter Unpublished.");
		        $scope.quarter_is_published = 0;
		    });
		}
	};

	$scope.delete_all_quarter_pdfs = function()
	{
		if(confirm("Are you ABSOLUTELY SURE you want to delete all PDFs for " + $scope.quarter + " " + $scope.year + "?  This CANNOT be undone! Click 'cancel' to exit."))
		{
			var quarter = $scope.quarter.replace("Q","");
	        var key = "7639b12eb41a626c671c35c974013026";
	        var url = 'http://www.vendor.com/delete_all_quarter_royalty_pdfs/'+quarter+'/'+$scope.year+'/'+key;

	        $scope.setMsg("Deleting PDFs...");

	        $http({url:url, method:'POST'}).success(function(res){            
	            $scope.setMsg(res.msg);
	        });
		}
		else
			return false;
		
	};

	$scope.clear_all_data = function()
	{
		var key = "7639b12eb41a626c671c35c974013026";
		if(confirm("Are you ABSOLUTELY SURE you want to delete all data for " + $scope.quarter + " " + $scope.year + "?  This CANNOT be undone! Click 'cancel' to exit."))
		{
			$http.post("/api/clear_all_data", {quarter:$scope.quarter, year:$scope.year, key:key}).success(function(res)
			{            
		            $scope.setMsg("Data deleted.");
		    });
		}
	};
}]);