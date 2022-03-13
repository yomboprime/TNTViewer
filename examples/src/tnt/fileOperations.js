import { GLTFExporter } from '../three/examples/jsm/exporters/GLTFExporter.js';
import { ColladaExporter } from '../three/examples/jsm/exporters/ColladaExporter.js';
import { OBJExporter } from '../three/examples/jsm/exporters/OBJExporter.js';

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

	if ( pathLastIndexOfDot > 0 && path.length > pathLastIndexOfDot + 1) {

		return path.substring( 0, pathLastIndexOfDot );

	}
	else return "";

}

export { exportModel, saveFile, removeFilenameExtension };
