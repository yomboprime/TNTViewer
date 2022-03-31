
const fs = require( 'fs' );
const pathJoin = require( 'path' ).join;
const { spawn, exec } = require( 'child_process' );

spawnProgram( __dirname, 'unzip', [ '-u', './thumbnails.zip' ], () => {

	scanDirectory( __dirname, '' );

}, true );

function scanDirectory( base, path ) {

	const files = fs.readdirSync( pathJoin( base, path ) );

	if ( ! files ) {

		console.error( "Error: Couldn't open directory: " + path );
		return false;

	}

	const numFiles = files.length;

	convertFile( 0 );

	function convertFile( index ) {

		console.log( "Converting " + index + " of " + numFiles );

		if ( index >= numFiles ) {

			spawnProgram( __dirname, 'rm', [ '*.ppm' ], () => {

				console.log( "Done." );

			}, true );
			return;

		}

		const fileName = files[ index ];

		const filePath = pathJoin( path, fileName );
		const fullPath = pathJoin( base, filePath );

		const stat = fs.statSync( fullPath );

		if ( stat.isFile() ) {

			if ( ! fileName.toLowerCase().endsWith( '.ppm' ) ) {

				convertFile( index + 1 );

			}
			else {

				spawnProgram(
					__dirname,
					'ffmpeg',
					[
						'-y',
						'-i',
						fullPath,
						removeFilenameExtension( fullPath ) + '.png'
					],
					( code, output, error ) => {

						convertFile( index + 1 );

					},
					false
				);

			}

		}
		else {

			convertFile( index + 1 );

		}

	}

}


function spawnProgram( cwd, program, args, callback, cancelOutput ) {

	var p;

	if ( cwd ) p = spawn( program, args, { cwd: cwd } );
	else p = spawn( program, args );

	var output = "";
	var error = "";

	p.stdout.on( 'data', ( data ) => {

		if ( cancelOutput === false ) output += data;

	} );

	p.stderr.on( 'data', ( data ) => {

		error += data;

	} );

	p.on( 'exit', ( code, signal ) => {

		if ( callback ) {

			callback( code, output, error );

		}

	} );

}

function removeFilenameExtension( path ) {

	path = path || "";

	const pathLastIndexOfDot = path.lastIndexOf( "." );

	if ( pathLastIndexOfDot > 0 && path.length > pathLastIndexOfDot + 1 ) {

		return path.substring( 0, pathLastIndexOfDot );

	}
	else return "";

}
