/*

MIT licensed. See LICENSE file.

Execute with 'node createModelsDataBase.js'

*/

// Imports

const fs = require( "fs" );
const pathJoin = require( 'path' ).join;


// Main code

const dataBase = {

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

	fields[ 1 ] = fields[ 1 ]
		.replace( 'á', 'a' ).replace( 'Á', 'A' )
		.replace( 'é', 'e' ).replace( 'É', 'E' )
		.replace( 'í', 'i' ).replace( 'Í', 'I' )
		.replace( 'ó', 'o' ).replace( 'Ó', 'O' )
		.replace( 'ó', 'u' ).replace( 'Ú', 'U' )
		.replace( 'ñ', 'n' ).replace( 'Ñ', 'N' )
		.replace( ' ', '_' );

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

	const aOf = a.startsWith( 'oficiales' );
	const bOf = b.startsWith( 'oficiales' );

	if ( aOf === bOf ) return a === b ? 0 : ( a < b ? - 1 : 1 );

	return aOf < bOf ? 1 : - 1;
} );

console.log();
console.log( "Total: " + dataBase.pathsList.length + " models." );
console.log();

let numModelsInSourceDataBase = 0;
for ( let i in dataBase.pathsList ) {

	const modelPath = dataBase.pathsList[ i ];

	console.log( "Processing model " + modelPath + " ..." );

	let model = {
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

			if ( Number.isInteger( parseInt( pathFields[ 0 ] ) ) && ! Number.isInteger( parseInt( pathFields[ 1 ] ) ) ) {

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
	else model.title = model.path;

	if ( model.title.endsWith( '.ldr' ) ) {

		model.title = model.title.substring( 0, model.title.length - 4 );

	}

}

console.log();
console.log( "Total: " + dataBase.pathsList.length + " models." );

console.log( "numModelsInSourceDataBase: " + numModelsInSourceDataBase );

console.log( "Writing models.json ..." );

if ( ! writeJSONFileSync( dataBase, pathJoin( __dirname, "models.json" ) ) ) {

	console.log( "ERROR writing models.json !" );
	return;

}


const htmlModelListPath = '../../../../tnt_models.html';

console.log();
console.log( "Writing " + htmlModelListPath );

let htmlModelListContent =
`<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link type="text/css" rel="stylesheet" href="tnt_models.css" />
	</head>
	<body>
		<h1>TNT Viewer models list</h1>
		<h2>Index</h2>
		<ul>
			<li>Official models</li>
			<li>Custom models</li>
		</ul>
		<h2>Official models</h2>
		<table>
			<tr>
				<th>Title</th>
				<th>Series</th>
				<th>Reference</th>
				<th>View model</th>
				<th>Model information</th>
				<th>File</th>
			</tr>
***OFFICIAL_MODELS***
		</table>
		<h2>Custom models</h2>
		<table>
			<tr>
				<th>Title</th>
				<th>View model</th>
				<th>File</th>
			</tr>
***CUSTOM_MODELS***
		</table>
	</body>
</html>`;


let officialModelsContent = '';
let customModelsContent = '';

for ( let i in dataBase.pathsList ) {

	const modelPath = dataBase.pathsList[ i ];
	const model = dataBase.models[ modelPath ];

	if ( modelPath.startsWith( 'oficiales/' ) ) {
//<td><a href="https://yomboprime.github.io/TNTViewer/examples/tnt.html?modelPath=` + model.path + `">View model</a></td>
			officialModelsContent +=
`			<tr>
				<td>` + model.title + `</td>
				<td>` + ( model.seriesNumber ? model.seriesNumber : "No series." ) + `</td>
				<td>` + ( model.refNumber ? model.refNumber : "No ref." ) + `</td>
				<td><a href="http://127.0.0.1:8091/examples/tnt.html?modelPath=` + model.path + `">View model</a></td>
				` +
				(
					model.id ?
					`<td><a href="https://tente.spread.name/id/` + model.id + `">Model information</a></td>`
					:
					`<td>No info.</td>`
				) +
				`
				<td>` + ( model.path ? model.path : "No file." ) + `</td>
			</tr>
`;

	}
	else {

			customModelsContent +=
`			<tr>
				<td>` + model.title + `</td>
				<td><a href="http://127.0.0.1:8091/examples/tnt.html?modelPath=` + model.path + `">View model</a>
				<td>` + ( model.path ? model.path : "No file." ) + `</td>
			</tr>
`;

	}

}

htmlModelListContent = htmlModelListContent.replace( '***OFFICIAL_MODELS***', officialModelsContent );
htmlModelListContent = htmlModelListContent.replace( '***CUSTOM_MODELS***', customModelsContent );

if ( ! writeTextFileSync( htmlModelListContent, pathJoin( __dirname, htmlModelListPath ) ) ) {

	console.log( "ERROR writing tnt_models.html !" );

}

console.log( "Done. Have a nice day." );


// Functions

function scanDirectory( base, path ) {

	if ( path ) console.log( "Entering directory " + path + " ..." );

	const files = fs.readdirSync( pathJoin( base, path ) );

	if ( ! files ) {

		console.log( "Error: Couldn't open directory: " + path );
		return false;

	}

	for ( var i = 0, n = files.length; i < n; i++ ) {

		const fileName = files[ i ];

		const filePath = pathJoin( path, fileName );

		const stat = fs.statSync( pathJoin( base, filePath ) );

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

	const content = getObjectSerializedAsString( object, true );

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
