/*

Execute with 'node createModelsDataBase.js'

*/

// Imports

var fs = require( "fs" );
var pathJoin = require( 'path' ).join;


// Main code

var dataBase = {

	models: {},

	pathsList: []

};

scanDirectory( __dirname, '' );

dataBase.pathsList.sort( ( a, b ) => {

	var aOf = a.startsWith( 'oficiales' );
	var bOf = b.startsWith( 'oficiales' );

	if ( aOf === bOf ) return a === b ? 0 : ( a < b ? - 1 : 1 );

	return aOf < bOf ? 1 : - 1;
} );

console.log();
console.log( "Total: " + dataBase.pathsList.length + " models." );
console.log();

for ( var i = 0, n = dataBase.pathsList.length; i < n; i++ ) {

	var modelPath = dataBase.pathsList[ i ];

	console.log( "Processing model " + modelPath + " ..." );

	var model = {
		path: modelPath,
		id: '',
		title: modelPath,
		seriesNumber:'',
		refNumber: ''
	};

	dataBase.models[ modelPath ] = model;

}

console.log();
console.log( "Total: " + dataBase.pathsList.length + " models." );
console.log( "Writing models.json ..." );

if ( ! writeJSONFileSync( dataBase, pathJoin( __dirname, "models.json" ) ) ) {

	console.log( "ERROR writing models.json!" );

}
else {

	console.log( "Done. Have a nice day." );

}


// Functions

function scanDirectory( base, path ) {

	if ( path ) console.log( "Entering directory " + path + " ..." );

	var files = fs.readdirSync( pathJoin( base, path ) );

	if ( ! files ) {

		console.log( "Error: Couldn't open directory: " + path );
		return false;

	}

	for ( var i = 0, n = files.length; i < n; i++ ) {

		var fileName = files[ i ];

		var filePath = pathJoin( path, fileName );

		var stat = fs.statSync( pathJoin( base, filePath ) );

		if ( stat.isDirectory() ) {

			//if ( "tiles".localeCompare( fileName ) === 0 ) {

			if ( ! scanDirectory( base, filePath ) ) return false;

		}
		else if ( stat.isFile() ) {

			if ( ! fileName.toLowerCase().endsWith( '.ldr' ) ) continue;

			console.log( "Adding model " + filePath);
			dataBase.pathsList.push( filePath );

		}

	}

	return true;
}

function writeJSONFileSync( object, path ) {

	var content = getObjectSerializedAsString( object, true );

	if ( ! content ) {

		return false;

	}

	return writeTextFileSync( content, path );

}

function getObjectSerializedAsString( objectJSON, beautified ) {

	if ( beautified ) {

		return JSON.stringify( objectJSON, null, 4 );

	}
	else {

		return JSON.stringify( objectJSON );

	}

}

function writeTextFileSync( content, path ) {

	try {

		fs.writeFileSync( path, content );

		return true;

	}
	catch ( e ) {

		return false;

	}

}
