
import * as THREE from '../three/build/three.module.js';
import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from '../three/examples/jsm/environments/RoomEnvironment.js';

const vector3Temp1 = new THREE.Vector3();
const vector3Temp2 = new THREE.Vector3();

function createPartPreview( width, height, renderer, container ) {

	const partPreviewDiv = document.createElement( 'div' );
	partPreviewDiv.style.width = width + "px";
	partPreviewDiv.style.height = height + "px";
	partPreviewDiv.style.position = "absolute";
	partPreviewDiv.style.bottom = "0px";
	partPreviewDiv.style.left = "0px";
	partPreviewDiv.style.backgroundColor = "black";

	container.appendChild( partPreviewDiv );

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
		updatePart: updatePart
	};

}

export { createPartPreview };
