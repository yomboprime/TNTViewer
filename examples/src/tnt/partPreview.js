
import * as THREE from '../three/build/three.module.js';
import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from '../three/examples/jsm/environments/RoomEnvironment.js';

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

		part.userData.modelBbox.getCenter( cameraControls.target0 );
		const v = cameraControls.position0;
		part.userData.modelBbox.getSize( v );
		const max = Math.sqrt( Math.pow( v.x, 2 ) + Math.pow( v.z, 2 ) ) * 0.5;
		v.set( - 0.42, - 0.5, 1 ).normalize().multiplyScalar( max * 1.5 );
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
		let pDest = 0;
		for ( let j = 0; j < height; j ++ ) {

			for ( let i = 0; i < width; i ++ ) {

				pixelsData[ pDest ++ ] = readImage[ pOrig ++ ];
				pixelsData[ pDest ++ ] = readImage[ pOrig ++ ];
				pixelsData[ pDest ++ ] = readImage[ pOrig ++ ];
				pixelsData[ pDest ++ ] = readImage[ pOrig ++ ];

			}

		}
		ctx.putImageData( pixels, 0, 0 );

	}

	return {
		div: partPreviewDiv,
		updatePart: updatePart
	};

}

export { createPartPreview };
