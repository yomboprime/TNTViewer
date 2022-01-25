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
	modelPathsList: [],

	parts: {},
	partsPathsList: []

};

console.log( "Reading source database ..." );

const sourceDataBasePath = 'TENTE Refs - Visor TNT - RefsTENTE.tsv';
let sourceDataBase = readTextFileSync( pathJoin( __dirname, sourceDataBasePath ), "latin1" );

if ( sourceDataBase === null ) {

	console.log();
	console.log( "Error reading source database file: " + sourceDataBasePath );
	process.exit( - 1 );
}

sourceDataBase = sourceDataBase.toString().split( '\n' );

const sourceDataBaseFields = [];

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

console.log( "Reading parts list..." );

const partsListPath = 'parts.lst';
let partsListLines = readTextFileSync( pathJoin( __dirname, '..', partsListPath ), "latin1" );

if ( partsListLines === null ) {

	console.log();
	console.log( "Error reading parts list file: " + partsListPath );
	process.exit( - 1 );

}

partsListLines = partsListLines.toString().split( '\n' );

const partsTempArray = [];

for ( let i in partsListLines ) {

	const partsListLine = partsListLines[ i ];

	const spPos = partsListLine.indexOf( ' ' );
	if ( spPos < 0 ) continue;

	const path = partsListLine.substring( 0, spPos );
	let title = partsListLine.substring( spPos ).trim();
	const barPos = title.indexOf( '|' );
	let metaData = '';
	if ( barPos >= 0 ) {
		metaData = title.substring( barPos );
		title = title.substring( 0, barPos ).trim();

	}
	else {

		const dotPos = partsListLine.lastIndexOf( ':' );
		if ( dotPos >= 0 ) {

			metaData = title.substring( dotPos );
			title = title.substring( 0, dotPos ).trim();

		}

	}

	partsTempArray.push( {
		path: path,
		title: title,
		metaData: metaData
	} );

}

partsTempArray.sort( ( a, b ) => {

	return a.title.localeCompare( b.title );

} );

for ( let i in partsTempArray ) {

	const part = partsTempArray[ i ];

	dataBase.partsPathsList.push( part.path );
	dataBase.parts[ part.path ] = part;

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

dataBase.modelPathsList.sort( ( a, b ) => {

	const aOf = a.startsWith( 'oficiales' );
	const bOf = b.startsWith( 'oficiales' );

	if ( aOf === bOf ) return a === b ? 0 : ( a < b ? - 1 : 1 );

	return aOf < bOf ? 1 : - 1;
} );

console.log();
console.log( "Total: " + dataBase.modelPathsList.length + " models." );
console.log();

let numModelsInSourceDataBase = 0;
for ( let i in dataBase.modelPathsList ) {

	const modelPath = dataBase.modelPathsList[ i ];

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
console.log( "Total models: " + dataBase.modelPathsList.length );

console.log( "Num. models in source database: " + numModelsInSourceDataBase );

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
		<h2>Other links</h2>
		<p>See <a href="https://yomboprime.github.io/TNTViewer/examples/tnt_parts.html">parts list</a>.</p>
		<p><a href="https://github.com/yomboprime/TNTViewer">TNTViewer code at Github</a>'</p>
	</body>
</html>`;


let officialModelsContent = '';
let customModelsContent = '';

for ( let i in dataBase.modelPathsList ) {

	const modelPath = dataBase.modelPathsList[ i ];
	const model = dataBase.models[ modelPath ];

	if ( modelPath.startsWith( 'oficiales/' ) ) {
			officialModelsContent +=
`			<tr>
				<td>` + model.title + `</td>
				<td>` + ( model.seriesNumber ? model.seriesNumber : "No series." ) + `</td>
				<td>` + ( model.refNumber ? model.refNumber : "No ref." ) + `</td>
				<td><a href="https://yomboprime.github.io/TNTViewer/examples/tnt.html?modelPath=` + model.path + `">View model</a></td>
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
				<td><a href="https://yomboprime.github.io/TNTViewer/examples/tnt.html?modelPath=` + model.path + `">View model</a>
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


const htmlPartListPath = '../../../../tnt_parts.html';

console.log();
console.log( "Writing " + htmlPartListPath );

let htmlPartListContent =
`<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link type="text/css" rel="stylesheet" href="tnt_models.css" />
	</head>
	<body>
		<h1>TNT Viewer parts list</h1>
		<h2>Index</h2>
		<ul>
			<li>Parts list</li>
			<li>Other links</li>
		</ul>
		<h2>Parts list</h2>
		<table>
			<tr>
				<th>Title</th>
				<th>View part</th>
				<th>Model metadata</th>
				<th>File</th>
			</tr>
***PARTS_LIST***
		</table>
		<h2>Other links</h2>
		<p>See <a href="https://yomboprime.github.io/TNTViewer/examples/tnt_models.html">models list.</a></p>
		<p><a href="https://github.com/yomboprime/TNTViewer">TNTViewer code at Github</a>'</p>
	</body>
</html>`;

let partsContent = '';

for ( let i in dataBase.partsPathsList ) {

	const partPath = dataBase.partsPathsList[ i ];
	const part = dataBase.parts[ partPath ];

	partsContent +=
`			<tr>
				<td>` + part.title + `</td>
				<td><a href="https://yomboprime.github.io/TNTViewer/examples/tnt.html?modelPath=../parts/` + part.path + `">View part</a></td>
				<td>` + part.metaData + `</td>
				<td>` + ( part.path ? part.path : "No file." ) + `</td>
			</tr>
`;

}

htmlPartListContent = htmlPartListContent .replace( '***PARTS_LIST***', partsContent );

if ( ! writeTextFileSync( htmlPartListContent, pathJoin( __dirname, htmlPartListPath ) ) ) {

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
			dataBase.modelPathsList.push( filePath );

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
