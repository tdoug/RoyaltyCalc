angular.module('app.files', ['ngFileUpload']);

app.requires.push('app.files');

app.controller('files', ['$scope', '$http', '$interval', '$window', 'Upload', 
	function($scope, $http, $interval, $window, Upload) {	

	$scope.advances = {};
	$scope.advances.id = "advances";

	$scope.$watch('[quarter, year]', function(){		
		$scope.load_providers();
	});	

	/////files

	$scope.get_provider_filepath = function(provider_id)
	{
		return "/public/files/" + $scope.year + "/" + $scope.quarter + "/" + provider_id + "/";
	};

	$scope.file_download = function(provider, file)
	{
		$window.open("/files/" + $scope.year + "/" + $scope.quarter + "/" + provider.id + "/" + file);
	};

	$scope.load_providers = function()
	{		
		$http.post("/api/providers/list").success(function (response) {
			$scope.providers = response;			 			
		}).then(function(){
			for(index = 0; index < $scope.providers.length; ++index)
			{
				$scope.get_provider_files($scope.providers[index]);
			}
			$scope.check_provider_entries();			
		});	
	};

	$scope.get_provider_files = function(provider)
	{
		var filepath = $scope.get_provider_filepath(provider.id);
		$http.post("/files/load_provider_files", {
			provider_id:provider.id, 
			quarter: $scope.quarter,
			year: $scope.year
		}).success(function (files) {	
			if($scope.providers != undefined)
			{		
				for(index = 0; index < $scope.providers.length; ++index)
				{				
					if($scope.providers[index].id == provider.id)
					{
						$scope.providers[index].files =  files;					
					}
				}
			}
			if(provider.id == "advances")
			{
				$scope.advances.files = files;
			}			
		});	
	};

	$scope.check_provider_entries = function()
	{		
		for(index = 0; index < $scope.providers.length; ++index)
		{
			$http.post('/api/providers/check_entries', {
				provider_id: $scope.providers[index].id,
				quarter: $scope.quarter,
				year: $scope.year
			}).success(function(entries){				
				for(index = 0; index < $scope.providers.length; ++index)
				{
					for(entry in entries)
					{						
						if($scope.providers[index].id == entries.provider_id)
						{
							if(entries.entries > 0)
								$scope.providers[index].entries_exist = entries.entries.toLocaleString();							
							else
								$scope.providers[index].entries_exist = undefined;
						}
					}
				}
			});
		}		
	};

	$scope.delete_file = function(provider, file) {
		
		$http.post("/files/delete_file", {
			provider_id: provider.id,
			quarter: $scope.quarter,
			year: $scope.year,
			file: file
		}).success(function(res)
		{
			$scope.get_provider_files(provider);
			$scope.setMsg("File '"+file+"' deleted.");
		});
	};

	$scope.get_provider_file = function(provider, file)
	{
		var path = $scope.get_provider_filepath(provider.id);
		var file_path = path + file;
	};

	$scope.uploadFiles = function (files, provider) {	
		
		for(index = 0; index < files.length; ++index)
		{
	        Upload.upload({
	            url: '/files',
	            data: {files: files[index], provider_id: provider.id, quarter: $scope.quarter, year: $scope.year }
	        }).then(function (resp) { ///finished
	            $scope.setMsg("File upload completed.");
	            $scope.get_provider_files(provider);
	        }, function (resp) {
	            console.log('Error status: ' + resp.status);
	        }, function (evt) {
	            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
	            //console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
	            $scope.setMsg("File upload is "+Math.min(100, parseInt(100.0 * evt.loaded / evt.total))+"% completed.", 1);
	        });
        }
    };

}]);