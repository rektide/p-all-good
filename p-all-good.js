"use strict"

var
  isstring= require( "is-string"),
  iterator= Symbol.iterator

function _isIterable( o){
	return o&& o[ iterator]&& !isstring( o)
}

/**
 * Collect all resolvd promsie values, optionally flattening
 * @params {...} arrays - arrays, objects, or promises there-of to be resolved, optionally flattened (via p-all-good again), and results collected.
 * @this - options. flatten: whether to recursively flatten iterable results. bad: save bad results into a .bad array.
 */
function pAllGood( ...arrays){
	var
	  _flatten= this&& this.flatten!== undefined? this.flatten: module.exports.defaults.flatten,
	  _saveBad= this&& this.bad!== undefined? this.bad: module.exports.defaults.bad,
	  good= [], // accumulate found results
	  bad, // acc
	  _good,
	  _bad,
	  outstanding= 0,
	  defer= Promise.defer()

	// setup processors
	function process( el){
		++outstanding
		Promise.resolve( el)
			.then( _good, _bad)
	}
	function decr(){
		if( !--outstanding){
			defer.resolve( good)
		}
	}
	if( _flatten){
		_good= function( val){
			if( _isIterable(val)){
				for( var el of val){
					process( el)
				}
			}else{
				good.push( val)
			}
			decr()
		}
	}else{
		_good= function( val){
			good.push( val)
			decr()
		}
	}
	if( _saveBad){
		bad= []
		_bad= function( err){
			bad.push( err)
			decr()
		}
		Object.defineProperty( good, "bad", {
			get: function(){
				return bad
			}
		})
	}else{
		_bad= decr
	}

	// start resolving
	for( var i in arrays){
		var arr= arrays[ i]
		if( !arr){
			continue
		}
		if( _isIterable( arr)){
			for( var el of arr){
				process( el)
			}
		}else{
			process( arr)
		}
	}
	return defer.promise
}

module.exports= pAllGood
module.exports.pAllGood= pAllGood
module.exports.defaults= {
	bad: true,
	flatten: true
}
