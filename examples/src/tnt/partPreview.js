
import * as THREE from '../three/build/three.module.js';
import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from '../three/examples/jsm/environments/RoomEnvironment.js';
import * as FileOperations from './fileOperations.js';

const vector3Temp1 = new THREE.Vector3();
const vector3Temp2 = new THREE.Vector3();

function createPartPreview( width, height, renderer, container ) {

	const partPreviewDiv = document.createElement( 'div' );
	partPreviewDiv.style.width = width + "px";
	partPreviewDiv.style.height = height + "px";
	partPreviewDiv.style.position = "absolute";
	partPreviewDiv.style.bottom = "0px";
	partPreviewDiv.style.left = "0px";
	partPreviewDiv.style.border = "solid";
	partPreviewDiv.style.borderWidth = "2px";
	partPreviewDiv.style.borderColor = "black";
	partPreviewDiv.style.backgroundColor = "black";

	if ( container ) container.appendChild( partPreviewDiv );

	const renderTarget = new THREE.WebGLRenderTarget( width, height, {
		format: THREE.RGBAFormat,
		type: THREE.UnsignedByteType
	} );
	const readImage = new Uint8Array( 4 * width * height );
	const canvas = document.createElement( 'canvas' );
	canvas.width = width;
	canvas.height = height;
	partPreviewDiv.appendChild( canvas );
	const ctx = canvas.getContext( '2d' );
	const pixels = ctx.getImageData( 0, 0, width, height );
	const pixelsData = pixels.data;

	const camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 0.1, 2000 );
	camera.position.set( 150, 200, 250 );

	const pmremGenerator = new THREE.PMREMGenerator( renderer );

	const scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x596888 );
	scene.environment = pmremGenerator.fromScene( new RoomEnvironment() ).texture;

	const cameraControls = new OrbitControls( camera, partPreviewDiv );
	cameraControls.addEventListener( 'change', triggerRender );

	let currentPart = null;

	function updatePart( part ) {

		if ( currentPart ) scene.remove( currentPart );

		scene.add( part );
		currentPart = part;

		part.userData.modelBbox.getCenter( vector3Temp1 );
		part.userData.modelBbox.getSize( vector3Temp2 );
		const max = vector3Temp2.length() * 0.6;

		camera.left = - max;
		camera.right = max;
		camera.top = max;
		camera.bottom = - max;
		camera.updateProjectionMatrix();

		cameraControls.target0.copy( vector3Temp1 );
		cameraControls.position0.set( 1, 1, 1 ).normalize().multiplyScalar( max ).add( vector3Temp1 );
		cameraControls.reset();

		triggerRender();

	}

	function triggerRender() {

		const currentRenderTarget = renderer.getRenderTarget();
		renderer.setRenderTarget( renderTarget );
		renderer.render( scene, camera );
		renderer.setRenderTarget( currentRenderTarget );
		renderer.readRenderTargetPixels( renderTarget, 0, 0, width, height, readImage );
		let pOrig = 0;
		let pDest = ( height - 1 ) * width * 4;
		for ( let j = 0; j < height; j ++ ) {

			for ( let i = 0; i < width; i ++ ) {

				pixelsData[ pDest ++ ] = readImage[ pOrig ++ ];
				pixelsData[ pDest ++ ] = readImage[ pOrig ++ ];
				pixelsData[ pDest ++ ] = readImage[ pOrig ++ ];
				pixelsData[ pDest ++ ] = readImage[ pOrig ++ ];

			}

			pDest -= 2 * width * 4;

		}
		ctx.putImageData( pixels, 0, 0 );

	}

	return {
		div: partPreviewDiv,
		pixelsData: pixelsData,
		updatePart: updatePart
	};

}

function generatePartsThumnbnails( width, height, renderer, lDrawLoader, partsPathsList, processPartOrModel, onProgress, onResult ) {

	// onResult is called with zip blob

	const partPreview = createPartPreview( width, height, renderer, null );

	const numParts = partsPathsList.length;
	const numPixels = width * height;
	const image = new Uint8Array( numPixels * 3 );

	var zipFile = new JSZip();

	onProgress( 0 );
	loadModel( 0 );

	function loadModel( index ) {

		if ( index >= numParts ) {

			zipFile.generateAsync( { type: "blob" } ).then( ( contentBlob ) => {

				onProgress( 1 );
				onResult( contentBlob );

			} );

			return;

		}

		const partPath = partsPathsList[ index ];
		lDrawLoader.load( "../parts/" + partPath, function ( part ) {

			const whiteColor = '15';
			processPartOrModel( part, true, true, whiteColor );
			partPreview.updatePart( part );

			const srcData = partPreview.pixelsData;
			let pSrc = 0;
			let pDest = 0;
			for ( let i = 0; i < numPixels; i ++ ) {

				image[ pDest ] = srcData[ pSrc ];
				image[ pDest + 1 ] = srcData[ pSrc + 1 ];
				image[ pDest + 2 ] = srcData[ pSrc + 2 ];

				pSrc += 4;
				pDest += 3;

			}

			const ppmData = encodeImageToPPM( width, height, image );
			zipFile.file( FileOperations.removeFilenameExtension( partPath ) + ".ppm", ppmData );
			onProgress( index / numParts );
			loadModel( index + 1 );

		}, undefined, ( error ) => {

			console.log( "Error loading part: " + error );

		} );

	}

}

function encodeImageToPPM( width, height, data ) {

	const headerString = 'P6\n' + width + ' ' + height + '\n255\n';
	const headerBuffer = new TextEncoder().encode( headerString );

	const imageContents = new Uint8Array( headerBuffer.length + data.length );
	imageContents.set( headerBuffer );
	imageContents.set( data, headerBuffer.length );

	return imageContents;

}

export { createPartPreview, generatePartsThumnbnails };
