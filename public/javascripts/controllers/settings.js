app.controller('settings', function($scope, $http, $window) {

	$scope.load_settings = function()
	{
		$http.post("/api/settings/load").success(function (response) {
    		$scope.settings = response;
    		$scope.settings.updated_date = new Date($scope.settings.update_timestamp);
            $scope.load_currencies();
    	});
    	
	};

	$scope.load_currencies = function()
	{
		if($scope.settings.currencies == undefined)
            $scope.settings.currencies = [];
		
        var index = 0;
		$http.get("https://openexchangerates.org/api/latest.json?app_id=e66a0e48f4104398aa191616b3472a10").success(function (response) {
    		$scope.latest_currencies = response;
            
    		for(currency in response.rates)
    		{
                if($scope.settings.currencies[index] == undefined)
                    $scope.settings.currencies[index] = {};

    			$scope.settings.currencies[index].name = currency;
    			$scope.settings.currencies[index].rate = response.rates[currency];
                //$scope.settings.currencies[index].saved_rate = response.rates[currency];
    			index++;
    		}
    	});
	};

    $scope.update_currency_boxes = function()
    {
        for(currency in $scope.settings.currencies)
        {
            $scope.settings.currencies[currency].saved_rate = $scope.settings.currencies[currency].rate;
        }
        $scope.setMsg("Currency boxes are updated.  Be sured to click 'Save' below.");
    };

	$scope.save_settings = function(settings)
	{
		$http.post("/api/settings/save", {settings: settings}).success(function (response) {
    		$scope.setMsg("Settings Saved");
    	});
	};
});