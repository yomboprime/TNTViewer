import { GLTFExporter } from '../three/examples/jsm/exporters/GLTFExporter.js';
import { ColladaExporter } from '../three/examples/jsm/exporters/ColladaExporter.js';
import { OBJExporter } from '../three/examples/jsm/exporters/OBJExporter.js';

const dosLineEnd = "\r\n";

function exportModelAsLDraw( model, title, getObjectPart, isEmbeddedPart ) {

	const name = removePathFromFilename( model.userData.fileName );
	const author = model.userData.author ? model.userData.author : "TNT Editor";
	const isOfficial = model.userData.isOfficial;

	let output = "";

	output += "0 " + title + dosLineEnd;
	output += "0 Name: " + name + dosLineEnd;
	output += "0 Author: " + author + dosLineEnd;
	output += ( isOfficial ? "0 Tente official model" : "0 Unofficial Model" ) + dosLineEnd;
	output += "0 ROTATION CENTER 0 0 0 1 \"Custom\"" + dosLineEnd;
	output += "0 ROTATION CONFIG 0 0" + dosLineEnd;
	output += "0 BFC CERTIFY CCW" + dosLineEnd;

	const embeddedParts = [];

	for ( let childIndex in model.children ) {

		const part = getObjectPart( model.children[ childIndex ] );
		if ( ! part ) continue;

		const isEmbedded = isEmbeddedPart( part );
		if ( isEmbedded ) embeddedParts.push( part );

		// Referenced model, part or embedded part
		output += "1 " + part.userData.colorCode + " " + poseToText( part ) + " " + part.userData.fileName + dosLineEnd;

	}

	output += "0" + dosLineEnd;

	if ( embeddedParts.length > 0 ) {

		const firstLine = "0 FILE " + fileTitle + dosLineEnd;
		output = firstLine + output;

	}

	for ( let partIndex in embeddedParts ) {

		output += embeddedPartToText( embeddedParts[ partIndex ] );

	}

	return output;

}

function round3( x ) { return Math.round( x * 1000 ) / 1000; }

function poseToText( part ) {

	const e = part.matrix.elements;

	return 	"" + round3( e[ 12 ] ) + " " + round3( e[ 13 ] ) + " " + round3( e[ 14 ] ) +
			" " + round3( e[ 0 ] ) + " " + round3( e[ 4 ] ) + " " + round3( e[ 8 ] ) +
			" " + round3( e[ 1 ] ) + " " + round3( e[ 5 ] ) + " " + round3( e[ 9 ] ) +
			" " + round3( e[ 2 ] ) + " " + round3( e[ 6 ] ) + " " + round3( e[ 10 ] )

}

function embeddedPartToText( embeddedPart ) {

	let output = "";
	output += "0 FILE " + embeddedPart.userData.fileName + dosLineEnd;
	output += "0 BFC CERTIFY CCW" + dosLineEnd;
	internalTraverseEmbeddedPart( embeddedPart, null, true );
	return output;

	function internalTraverseEmbeddedPart( child, colorCode, firstLevel ) {

		let traverseChildren = true;

		if ( child.userData.colorCode ) colorCode = child.userData.colorCode;
		if ( child.material && child.material.userData.code ) colorCode = child.material.userData.code;

		if ( child.isGroup ) {

			// Referenced part
			if ( ! firstLevel ) {

				output += "1 " + child.userData.colorCode + " " + poseToText( child ) + " " + child.userData.fileName + dosLineEnd;

			}

			traverseChildren = firstLevel;

		}
		else if ( child.isMesh ) {

			const geometry = child.userData.stickerOriginalGeometry ? child.userData.stickerOriginalGeometry : child.geometry;
			const positions = geometry.getAttribute( 'position' ).array;
			const indices = geometry.getIndex() ? geometry.getIndex().array : null;
			if ( indices ) {

				for ( let i = 0, n = indices.length; i + 2 < n; i += 3 ) {

					output += "3 " + colorCode;

					vector3Temp1.fromArray( positions, indices[ i ] * 3 );
					writeVector( vector3Temp1 );

					vector3Temp1.fromArray( positions, indices[ i + 1 ] * 3 );
					writeVector( vector3Temp1 );

					vector3Temp1.fromArray( positions, indices[ i + 2 ] * 3 );
					writeVector( vector3Temp1 );

					output += dosLineEnd;

				}

			} else {

				for ( let i = 0, n = positions.length; i + 8 < n; i += 9 ) {

					output += "3 " + colorCode;

					vector3Temp1.fromArray( positions, i );
					writeVector( vector3Temp1 );

					vector3Temp1.fromArray( positions, i + 3 );
					writeVector( vector3Temp1 );

					vector3Temp1.fromArray( positions, i + 6 );
					writeVector( vector3Temp1 );

					output += dosLineEnd;

				}

			}

		} else if ( child.isConditionalLine ) {

			const geometry = child.userData.stickerOriginalGeometry ? child.userData.stickerOriginalGeometry : child.geometry;
			const positions = geometry.getAttribute( 'position' ).array;
			const controls0 = geometry.getAttribute( 'control0' ).array;
			const controls1 = geometry.getAttribute( 'control1' ).array;

			for ( let i = 0, n = positions.length; i + 5 < n; i += 6 ) {

				output += "5 " + colorCode;

				vector3Temp1.fromArray( positions, i );
				writeVector( vector3Temp1 );

				vector3Temp1.fromArray( positions, i + 3 );
				writeVector( vector3Temp1 );

				vector3Temp1.fromArray( controls0, i );
				writeVector( vector3Temp1 );

				vector3Temp1.fromArray( controls1, i );
				writeVector( vector3Temp1 );

				output += dosLineEnd;

			}

		} else if ( child.isLineSegments ) {

			const geometry = child.userData.stickerOriginalGeometry ? child.userData.stickerOriginalGeometry : child.geometry;
			const positions = geometry.getAttribute( 'position' ).array;

			for ( let i = 0, n = positions.length; i + 5 < n; i += 6 ) {

				output += "2 " + colorCode;

				vector3Temp1.fromArray( positions, i );
				writeVector( vector3Temp1 );

				vector3Temp1.fromArray( positions, i + 3 );
				writeVector( vector3Temp1 );

				output += dosLineEnd;

			}

		}

		if ( traverseChildren ) {

			for ( let c in child.children ) {

				internalTraverseEmbeddedPart( child.children[ c ], colorCode );

			}

		}

	}

	function writeVector( v ) {

		output += " " + round3( v.x ) + " " + round3( v.y ) + " " + round3( v.z );

	}

}

function exportModel( model, format, scale ) {

	if ( ! model ) return;

	model = model.clone();

	model.scale.multiplyScalar( scale );
	model.position.multiplyScalar( scale );
	model.position.x = 0;

	const removeChilds = [];
	model.traverse( ( c ) => {

		if ( ( ! c.isMesh ) && ( ! c.isGroup ) ) removeChilds.push( c );

	} );
	for ( let c in removeChilds ) removeChilds[ c ].removeFromParent();

	model.removeFromParent();

	switch ( format ) {

		case 'dae':

			new ColladaExporter().parse( model, ( data ) => {

				saveFile( removeFilenameExtension( model.userData.fileName ) + ".dae", new Blob( [ data.data ] ) );

			} );
			break;

		case 'gltf':

			new GLTFExporter().parse(
				model,
				( data ) => {

					saveFile( removeFilenameExtension( model.userData.fileName ) + ".glb", new Blob( [ data ] ) );

				},
				( err ) => {

					console.log( "Export GLTF error:" );
					console.log( err );

				},
				{ binary: true }
			);
			break;

		case 'obj':

			saveFile( removeFilenameExtension( model.userData.fileName ) + ".obj", new Blob( [ new OBJExporter().parse( model ) ] ) );

			break;

	}

}

function saveFile( fileName, blob ) {

	const link = window.document.createElement( "a" );
	link.href = window.URL.createObjectURL( blob );
	link.download = fileName;
	document.body.appendChild( link );
	link.click();
	document.body.removeChild( link );

}

function removeFilenameExtension( path ) {

	path = path || "";

	const pathLastIndexOfDot = path.lastIndexOf( "." );

	if ( pathLastIndexOfDot > 0 && path.length > pathLastIndexOfDot + 1 ) {

		return path.substring( 0, pathLastIndexOfDot );

	}
	else return "";

}

function removePathFromFilename( path ) {

	path = path || "";

	const pathLastIndexOfSlash = path.lastIndexOf( "/" );

	if ( pathLastIndexOfSlash > 0 && path.length > pathLastIndexOfSlash + 1 ) {

		return path.substring( pathLastIndexOfSlash + 1 );

	}
	else return path;

}

export { exportModelAsLDraw, exportModel, saveFile, removeFilenameExtension, removePathFromFilename };
