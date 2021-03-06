"use strict";

var mod11 = angular.module('mod11', ['scrollable-table', 'ui.bootstrap']);

mod11.service('func', function($rootScope) {
	var dades;
	this.setDades = function(data){
		dades = data;
		$rootScope.$broadcast('linSelec');
	};
	this.getDades = function(){
		return dades;
	};
	
    this.keys = function(obj){
        return obj? Object.keys(angular.copy(obj)) : [];
    };
});

// Al Añadir:  pq mostri la data de la bbdd yyyy-MM-dd amb format dd/MM/yy
mod11.directive('datepickerPopup', function (dateFilter, datepickerPopupConfig) {
	return {
		restrict: 'A',
		priority: 1,
		require: 'ngModel',
		link: function(scope, element, attr, ngModel) {
	    	var dateFormat = attr.datepickerPopup || datepickerPopupConfig.datepickerPopup;
  			ngModel.$formatters.push(function (value) {
  				return dateFilter(value, dateFormat);
  			});
	    }
	};
});

mod11.controller('opcCtrl', function($scope, $http, func) {
	$scope.actualitza = function() {
		$scope.$broadcast("renderScrollableTable");
	};
	$scope.neteja = function() {
		if($scope.search){
			$scope.search='';
			$scope.$broadcast("renderScrollableTable");
		}
	};

	$scope.getData = function() {
		$http.get("api/inscrip.jsp").success( function(data) {
		    $scope.data = data;
		    $scope.dataKeys = func.keys( $scope.data[0] );
		    $scope.filtered = $scope.data;
		    $scope.search = '';     // set the default search/filter term
		});
	};
	$scope.getData();
	
	$scope.detall = function(codi) {
		if($scope.selected)
			return;
		
		if(codi) {
			$scope.selected = codi;
 			$http.get("api/inscrip.jsp?codi="+codi).success( function(data) {
 				func.setDades( data );
			});
		} else {
			$scope.selected = '';
			func.setDades( {} );
		}
	};

	$scope.$on( 'ok', function() {
		$scope.selected = '';
		$scope.getData();
	});
	$scope.$on( 'cancel', function() {
		$scope.selected = ''; 
	});

});


mod11.controller('detallCtrl', function($scope, $http, $modal, func, dateFilter, $rootScope, $timeout) {
	$scope.detOcult = true;
///	$scope.aluOcult = true;
	
	
	$scope.$on( 'linSelec', function() {
/// ABANS DE CARREGAR  --Comprovar si han fet canvis ???
		
		$scope.data = func.getDades();
		$scope.codi = $scope.data.Codi;
		$scope.getAlu();						// Alumne
		$scope.canvi('');						// reset
		$scope.detOcult = false;		// Mostrem panell
		
		$timeout( function() {
			$('#Data').focus();
			$('#Data')[0].setSelectionRange(0, 8);
	      }, 400);		// Esperem a que es renderitzi la finestra modal
		
///
    });
	
	
	// Data
	$scope.dataOpen = function($event) {
	    $event.preventDefault();
	    $event.stopPropagation();
	    $scope.opened = true;
	};
	$scope.dataKey = function(ev){
		ev.which = ev.which || ev.keyCode;
   		if( ev.which == 27) $scope.cancel();	//ESC
   		else {
   			var datEle = document.getElementById('Data');
   			var datLen = datEle.value.length;
   			if( datLen == 2 || datLen == 5 ){		// dd o dd/MM
   				// si acaben de prémer DEL, borrem també un altre caràcter
   				if( ev.which == 8 ) datEle.value = datEle.value.substring(0,datLen-1);
   				// si acaben d'entrar un nombre, afegim la /
   											else datEle.value = datEle.value + '/';
   			}
   		}
	};


	// Alumne
	$scope.getAlu = function() {
		$http.get("api/alumnes.jsp?codi="+$scope.data.Alumne).success( function(data) {
			$scope.alumne = data;
			$scope.nomAlu = data.Nom + ' ' + data.Cognoms;
		});		
	};
	$scope.aluDetall = function() {
		var modalInstance = $modal.open({
			templateUrl: 'lib/alumne.html',
			controller: 'detallCtrl',
			size: '',         // large: 'lg'    normal: ''     small: 'sm'
			resolve: {
			    dataDet: function () {
			        return $scope.alumne;
			    }
			}
		});
		modalInstance.result.then( function() {
			$scope.getAlu();
		}, function () {
			// cancel
		});
	};
	
	
	$scope.canvi = function(opc) {
		$scope.delPremut = false;
		$scope.dangerMsg = '';
		$scope.campErr=[];	// netegem els errors de camps obligatoris
		
///
	};


	$scope.validacions = function() {
		$scope.campErr = [];		// posarem a true pq s'apliqui la classe has-error (marca el camp en vermell) 
///
		
		// Formategem la data per guardar-la a la bbdd
		//http://stackoverflow.com/questions/18061757/angular-js-and-html5-date-input-value-how-to-get-firefox-to-show-a-readable-d
		$scope.data.Data = dateFilter( $scope.data.Data, 'yyyy-MM-dd' );

		return true;	//ok
	};
	
	
	$scope.add = function() {
		if( !$scope.validacions() ) return;
		
		$http.post("api/inscrip.jsp", null, {"params":{"data": $scope.data}} )
		.success( function(data) {
			if(data.res > 0) {
				$scope.ok();
			} else {
				$scope.dangerMsg = "Error de Base de Datos...";
			}
		})
		.error( function () {
			$scope.dangerMsg = "Error de comunicaciones...";
		});
	};

	
	$scope.mod = function() {
		$scope.delPremut = false;
		if( !$scope.validacions() ) return;

		$http.put("api/inscrip.jsp", null, {"params":{"data": $scope.data}} )
		.success(function(data) {
			if(data.res > 0) {
				$scope.ok();
			} else {
				$scope.dangerMsg = "Error de Base de Datos...";
			}
		})
		.error( function () {
			$scope.dangerMsg = "Error de comunicaciones...";
		});
	};

	
	$scope.del = function() {
// L   validar que no estigui en us
//		if( !$scope.validaDel() ) return;
		
		if( !$scope.delPremut ) {
			$scope.delPremut = true;
			$scope.dangerMsg = 'Pulse otra vez para eliminar';
		} else {
			$http.delete("api/inscrip.jsp", {"params":{"codi": $scope.codi}})
			.success(function(data) {
				if(data.res > 0) {
					$scope.ok();
				} else {
					$scope.dangerMsg = "Error de Base de Datos...";
				}
			})
			.error( function () {
				$scope.dangerMsg = "Error de comunicaciones...";
			});
		}
	};

	
    $scope.ok = function () {
    	$scope.detOcult = true;
    	$rootScope.$broadcast('ok');
    };
    $scope.cancel = function () {
/// ABANS DE TANCAR  --Comprovar si han fet canvis ???
    	$scope.detOcult = true;
    	$rootScope.$broadcast('cancel');
    };
	

    $scope.execDefault = function (ev) {
    	// Definim un botó per defecte
    	var which = ev.which || ev.keyCode;
    	if(which == 13 && ev.target.type != 'textarea') {		// al camp Coment pinto els Return's
        	if($scope.codi) $scope.mod();
        							else $scope.add();
       	}
    };

/*    
    // Detall alumne
    $scope.aluMod = function () {
    	
    };
    $scope.aluCancel = function () {
    	$scope.aluOcult = true;
    };
*/

    
    
    
});
