
import * as THREE from '../three/build/three.module.js';

import { GLTFLoader } from '../three/examples/jsm/loaders/GLTFLoader.js';
import { ColladaLoader } from '../three/examples/jsm/loaders/ColladaLoader.js';
import { OBJLoader } from '../three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from '../three/examples/jsm/loaders/STLLoader.js';
import { SVGLoader } from '../three/examples/jsm/loaders/SVGLoader.js';

import { GLTFExporter } from '../three/examples/jsm/exporters/GLTFExporter.js';
import { ColladaExporter } from '../three/examples/jsm/exporters/ColladaExporter.js';
import { OBJExporter } from '../three/examples/jsm/exporters/OBJExporter.js';

const dosLineEnd = "\r\n";

const vector3Temp1 = new THREE.Vector3();
const vector3Temp2 = new THREE.Vector3();

function loadModelsFiles( files, onFileLoaded, lDrawLoader, scaleToUnitMM ) {

	if ( ! files || files.length === 0 ) return;

	let thereIsModel = false;
	let thereIsProject = false;

	for ( let i = 0; i < files.length; i ++ ) {

		const extension = getFilenameExtension( files[ i ].name ).toLowerCase();

		switch ( extension ) {

			case 'tnte':
				thereIsProject = true;
				break;

			case 'ldr':
			case 'dat':
			case 'dae':
			case 'glb':
			case 'stl':
			case 'obj':
			case 'svg':
/*
			case 'png':
			case 'jpg':
			case 'jpeg':
			case 'jfif':
			case 'pjpeg':
			case 'pjp':
			case 'gif':
			case 'webp':
*/
				thereIsModel = true;

				break;

			default:
				alert( "Unrecognized file name extension: '" + extension + "'. File loading was aborted." );
				return;

		}

	}

	if ( thereIsModel ) {

		if ( thereIsProject ) {

			alert( "You selected a model file and a project file. Please load only one project file or multiple models." );
			return;

		}

	}
	else {

		if ( thereIsProject && files.length > 1 ) {

			alert( "You selected more than one project file. Please load only one of them." );
			return;

		}

	}

	for ( let i = 0; i < files.length; i ++ ) {

		const extension = getFilenameExtension( files[ i ].name ).toLowerCase();

		switch ( extension ) {

			case 'tnte':
				//loadProjectFile( files[ i ] );
				break;

			case 'ldr':
			case 'dat':
			case 'dae':
			case 'glb':
			case 'stl':
			case 'obj':
			case 'svg':
				loadModelFile( files[ i ], extension, onFileLoaded, lDrawLoader, scaleToUnitMM );
				break;
/*
			case 'png':
			case 'jpg':
			case 'jpeg':
			case 'jfif':
			case 'pjpeg':
			case 'pjp':
			case 'gif':
			case 'webp':
				loadImageFile( files[ i ] );
				break;
*/
		}

	}

}

function loadModelFile( file, extension, onModelLoaded, lDrawLoader, scaleToUnitMM ) {

	const scope = this;
	const reader = new FileReader();

	reader.onload = function( e ) {

		const fileContents = e.target.result;

		let mesh = null;
		let scale = 1 / scaleToUnitMM;
		switch ( extension ) {

			case 'ldr':
			case 'dat':
				parseLDRAWModel( fileContents, onModelParsed, lDrawLoader );
				break;

			case 'dae':
				// dae is in meters
				scale *= 1000;
				parseColladaModel( fileContents, scale, onModelParsed );
				break;

			case 'glb':
				// gltf is in meters
				scale *= 1000;
				parseGLTFModel( fileContents, scale, onModelParsed );
				break;

			case 'stl':
				parseSTLModel( fileContents, scale, onModelParsed );
				break;

			case 'obj':
				// obj is assumed to be in meters
				scale *= 1000;
				parseOBJModel( fileContents, scale, onModelParsed );
				break;

			case 'svg':
				parseSVGModel( fileContents, scale, onModelParsed );
				break;

		}

		function onModelParsed( mesh, isLDraw ) {

			if ( ! mesh ) {

				alert( "Error parsing model file '" + file.name + "'." );
				return;

			}

			mesh.userData.fileName = file.name;

			onModelLoaded( mesh, isLDraw );

		}

	}

	reader.onerror = function( e ) {

		alert( "Error loading model file '" + file.name + "'." + e );

	};

	switch ( extension ) {

		case 'glb':
		case 'stl':
			reader.readAsArrayBuffer( file );
			break;

		case 'ldr':
		case 'dat':
		case 'dae':
		case 'obj':
		case 'svg':
			reader.readAsText( file );
			break;

	}

}

/*
loadImage( file ) {



}
*/

function parseLDRAWModel( fileContents, onModelParsed, lDrawLoader ) {

	lDrawLoader.parse( fileContents, ( model ) => {

		onModelParsed( model, true );

	} );

}

function parseColladaModel( fileContents, scale, onModelParsed ) {

	try {

		const collada = new ColladaLoader().parse( fileContents );

		const result = ( ! collada || ! collada.scene ) ? null : collada.scene;

		if ( result ) applyScaleToObjectTree( result, scale );

		onModelParsed( result, false );

	}
	catch ( e ) {

		onModelParsed( null, false );

	}

}

function parseGLTFModel( fileContents, scale, onModelParsed ) {

	const gltf = new GLTFLoader().parse( fileContents, "",
		( gltf ) => {

			const result = ( ! gltf ) || ( ! gltf.scene ) ? null : gltf.scene;

			if ( result ) applyScaleToObjectTree( result, scale );

			onModelParsed( result, false );

		},
		( error ) => {

			onModelParsed( null, false );

		}
	);

}

function parseSTLModel( fileContents, scale, onModelParsed ) {

	const geometry = new STLLoader().parse( fileContents );

	if ( ! geometry ) {

		onModelParsed( null, false );
		return;

	}

	geometry.rotateX( - Math.PI * 0.5 );
	geometry.scale( scale, scale, scale );

	const mesh = new THREE.Mesh( geometry, new THREE.MeshStandardMaterial() );

	onModelParsed( mesh, false );

}

function parseOBJModel( fileContents, scale, onModelParsed ) {

	const mesh = new OBJLoader().parse( fileContents );

	if ( ! mesh ) {

		onModelParsed( null, false );
		return;

	}

	applyScaleToObjectTree( mesh, scale );

	onModelParsed( mesh, false );

}

function parseSVGModel( fileContents, scale, onModelParsed ) {

	const options = {
		drawFillShapes: true,
		drawStrokes: true,
	};

	const data = new SVGLoader().parse( fileContents );

	const paths = data.paths;

	const group = new THREE.Group();

	for ( let i = 0; i < paths.length; i ++ ) {

		const path = paths[ i ];

		const fillColor = path.userData.style.fill;
		if ( options.drawFillShapes && fillColor !== undefined && fillColor !== 'none' ) {

			const material = new THREE.MeshStandardMaterial( {
				color: new THREE.Color().setStyle( fillColor ),
				opacity: path.userData.style.fillOpacity,
				transparent: path.userData.style.fillOpacity !== 1,
				side: THREE.FrontSide
			} );

			const shapes = SVGLoader.createShapes( path );

			for ( let j = 0; j < shapes.length; j ++ ) {

				const shape = shapes[ j ];

				const geometry = new THREE.ShapeGeometry( shape );

				invertGeometryInY( geometry );

				const mesh = new THREE.Mesh( geometry, material );

				group.add( mesh );

			}

		}

		const strokeColor = path.userData.style.stroke;

		if ( options.drawStrokes && strokeColor !== undefined && strokeColor !== 'none' ) {

			const material = new THREE.MeshStandardMaterial( {
				color: new THREE.Color().setStyle( strokeColor ),
				opacity: path.userData.style.strokeOpacity,
				transparent: path.userData.style.strokeOpacity !== 1,
				side: THREE.FrontSide
			} );

			for ( let j = 0, jl = path.subPaths.length; j < jl; j ++ ) {

				const subPath = path.subPaths[ j ];

				const geometry = SVGLoader.pointsToStroke( subPath.getPoints(), path.userData.style );

				if ( geometry ) {

					invertGeometryInY( geometry );

					const mesh = new THREE.Mesh( geometry, material );

					group.add( mesh );

				}

			}

		}

	}

	onModelParsed( group, false );

}

function invertGeometryInY( geometry ) {

	geometry.scale( 1, -1, 1 );

	const index = geometry.getIndex();
	if ( index ) {

		const iArray = index.array;
		for ( let i = 0, n = index.count; i + 2 < n; i += 3 ) {

			const t = iArray[ i + 1 ];
			iArray[ i + 1 ] = iArray[ i + 2 ];
			iArray[ i + 2 ] = t;

		}

	}
	else {

		const positions = geometry.getAttribute( 'position' ) || null;
		const normals = geometry.getAttribute( 'normal' ) ? geometry.getAttribute( 'normal' ) : null;
		const uvs = geometry.getAttribute( 'uv' ) ? geometry.getAttribute( 'uv' ) : null;

		if ( ! positions ) return;

		const posArr = positions.array;
		let p3 = 0;
		let p2 = 0;
		for ( let i = 0, n = positions.count; i < n; i ++ ) {

			invertTri( posArr, p3 );
			if ( normals ) invertTri( normals, p3 );
			if ( uvs ) invertUV( uvs, p2 );

			p2 += 6;
			p3 += 9;		}
	}

	function invertTri( arr, pos ) {

		vector3Temp1.fromArray( arr, pos + 3 );
		vector3Temp2.fromArray( arr, pos + 6 );
		vector3Temp1.toArray( arr, pos + 6 );
		vector3Temp2.toArray( arr, pos + 3 );
	}

	function invertUV( arr, pos ) {

		const t0 = arr[ pos + 2];
		const t1 = arr[ pos + 3 ];
		arr[ pos + 2 ] = arr[ pos + 4 ];
		arr[ pos + 3 ] = arr[ pos + 5 ];
		arr[ pos + 4 ] = t0;
		arr[ pos + 5 ] = t1;

	}
}

function applyScaleToObjectTree( root, scale ) {

	vector3Temp1.set( scale, scale, scale );

	root.matrix.scale( vector3Temp1 );

/*
	if ( root.geometry ) root.geometry.scale( scale, scale, scale );

	for ( let i = 0, n = root.children.length; i < n; i ++ ) {

		applyScaleToObjectTree( root.children[ i ], scale );

	}
*/
}

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
		const c = part.userData.colorCode || '16';
		output += "1 " + c + " " + poseToText( part ) + " " + part.userData.fileName + dosLineEnd;

	}

	output += "0" + dosLineEnd;

	if ( embeddedParts.length > 0 ) {

		const firstLine = "0 FILE " + title + dosLineEnd;
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

		// Main part color
		if ( child.userData.colorCode ) colorCode = child.userData.colorCode;
		if ( child.material ) {

			// Color code from the object material
			if ( child.material.userData.code ) colorCode = child.material.userData.code;
			// Direct color
			else colorCode = '0x2' + child.material.color.clone().convertLinearToSRGB().getHexString();

		}

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

			// dae is in meters
			scale *= 0.001;

			new ColladaExporter().parse( model, ( data ) => {

				saveFile( removeFilenameExtension( model.userData.fileName ) + ".dae", new Blob( [ data.data ] ) );

			} );
			break;

		case 'gltf':

			// gltf is in meters
			scale *= 0.001;

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

			// obj is assumed to be in meters
			scale *= 0.001;

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

function getFilenameExtension( path ) {

	path = path || "";

	const pathLastIndexOfDot = path.lastIndexOf( "." );

	if ( pathLastIndexOfDot > 0 && path.length > pathLastIndexOfDot + 1 ) {

		return path.substring( pathLastIndexOfDot + 1 );

	}
	else return "";

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

export {
	loadModelsFiles,
	exportModelAsLDraw,
	exportModel,
	saveFile,
	getFilenameExtension,
	removeFilenameExtension,
	removePathFromFilename
};
