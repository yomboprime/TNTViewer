/*

MIT licensed. See LICENSE file.

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

console.log( "Reading sorce database ..." );

const sourceDataBasePath = 'TENTE Refs - Visor TNT - RefsTENTE.tsv';
let sourceDataBase = readTextFileSync( pathJoin( __dirname, sourceDataBasePath ), "latin1" );

if ( sourceDataBase === null ) {

	console.log();
	console.log( "Error reading sorce database file: " + sourceDataBasePath );
	System.exit( - 1 );
}

sourceDataBase = sourceDataBase.toString().split( '\n' );

sourceDataBaseFields = [];

for ( let l in sourceDataBase ) {

	const sourceDataBaseLine = sourceDataBase[ l ];

	const fields = sourceDataBaseLine.split( '\t' );

	if ( fields.length !== 5 ) continue;

	sourceDataBaseFields.push( fields );

	/*
	const id = fields[ 0 ];
	const seriesNumber = fields[ 1 ];
	const refNumber = fields[ 2 ];
	const title = fields[ 3 ];
	const url = fields[ 4 ];
	*/

}

function findSeriesRef( series, ref ) {

console.log( "series, ref: *" + series + "*, *" + ref + "*" );

	for ( let l in sourceDataBaseFields ) {

		if (
			sourceDataBaseFields[ l ][ 1 ] === series &&
			sourceDataBaseFields[ l ][ 2 ] === ref ) {

				return sourceDataBaseFields[ l ];

		}

	}

	return null;

}

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

let numModelsInSourceDataBase = 0;
for ( var i = 0, n = dataBase.pathsList.length; i < n; i++ ) {

	var modelPath = dataBase.pathsList[ i ];

	console.log( "Processing model " + modelPath + " ..." );

	var model = {
		path: modelPath,
		id: '',
		title: '',
		seriesNumber: null,
		refNumber: null
	};
	dataBase.models[ modelPath ] = model;

	if ( modelPath.startsWith( 'oficiales/' ) ) {

		const pathFields = modelPath.substring( 'oficiales/'.length ).split( '_' );
		const numPathFields = pathFields.length;
		if ( numPathFields === 0 ) continue;

		if ( numPathFields === 1 ) model.title = pathFields[ 0 ];
		else if ( numPathFields === 2 ) {

			if ( Number.isInteger( parseInt( pathFields[ 0 ] ) ) ) {

				model.refNumber = pathFields[ 0 ];
				model.title = pathFields[ 1 ];

			}
			else model.title = pathFields[ 0 ] + ' ' + pathFields[ 1 ];

		}
		else {

			if ( Number.isInteger( parseInt( pathFields[ 0 ] ) ) ) {

				model.refNumber = pathFields[ 0 ];

				const titleParts = [];
				for ( let j = 1; j < numPathFields; j ++ ) titleParts.push( pathFields[ j ] );

				model.title = titleParts.join( ' ' );

			}
			else if ( Number.isInteger( parseInt( pathFields[ 1 ] ) ) ) {

				model.seriesNumber = pathFields[ 0 ];
				model.refNumber = pathFields[ 1 ];

				// Search in source database by series and ref

				const sourceFields = findSeriesRef( model.seriesNumber, model.refNumber );
				if ( sourceFields ) {

					model.id = sourceFields[ 0 ];
					model.title = sourceFields[ 3 ];
					numModelsInSourceDataBase ++;
				}
				else {

					const titleParts = [];
					for ( let j = 2; j < numPathFields; j ++ ) titleParts.push( pathFields[ j ] );

					model.title = titleParts.length > 0 ? titleParts.join( ' ' ) : '';
				}

			}
			else {

				const titleParts = [];
				for ( let j = 0; j < numPathFields; j ++ ) titleParts.push( pathFields[ j ] );

				model.title = titleParts.join( ' ' );

			}

		}

	}

}

console.log();
console.log( "Total: " + dataBase.pathsList.length + " models." );

console.log( "numModelsInSourceDataBase: " + numModelsInSourceDataBase );

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

function readTextFileSync( path ) {

	try {

		return fs.readFileSync( path );

	}
	catch ( e ) {

		return null;

	}

}
