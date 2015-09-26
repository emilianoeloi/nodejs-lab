/**
 * Created by emiliano.barbosa on 08/04/14.
 */


services.factory('User', ['$resource',
    function($resource){
        return $resource('/usuarios', {}, {
            query: {
                method:'GET',
                isArray:true
            },
            update: {
                method:'PUT'
            },
            insert: {
                method: 'POST'
            },
            remove: {
                method: 'DELETE'
            }
        });
    }]);