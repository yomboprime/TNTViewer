
import * as THREE from '../three/build/three.module.js';
import * as FileOperations from './fileOperations.js';

const vector3Temp1 = new THREE.Vector3();
const vector3Temp2 = new THREE.Vector3();

function generateAllIndexLDRs( lDrawLoader, db, processPartOrModel, onProgress, onResult ) {

	// onResult is called with zip blob

	var zipFile = new JSZip();
	const numModels = db.modelPathsList.length;
	let models = [];
	const modelsIndices = [];
	let previousSeries = null;
	let previousRefNumber = null;

	for ( let i = 0; i < numModels; i ++ ) {

		const model = db.models[ db.modelPathsList[ i ] ];

		if ( previousSeries !== null && ( previousSeries !== model.seriesNumber || previousRefNumber !== model.refNumber ) && models.length > 0 ) {

			if ( models[ 0 ].path.startsWith( "oficiales/" ) ) modelsIndices.push( models );

			models = [ model ];

		}
		else models.push( model );

		previousSeries = model.seriesNumber;
		previousRefNumber = model.refNumber;

	}
	if ( models.length > 0 && models[ 0 ].path.startsWith( "oficiales/" ) ) modelsIndices.push( models );

	const numIndices = modelsIndices.length;

	onProgress( 0 );
	loadIndex( 0 );

	function loadIndex( index ) {

		if ( index >= numIndices ) {

			zipFile.generateAsync( { type: "blob" } ).then( ( contentBlob ) => {

				onProgress( 1 );
				onResult( contentBlob );

			} );

			return;

		}

		loadModels( modelsIndices[ index ], ( models ) => {

			zipIndexLDR( modelsIndices[ index ][ 0 ], models );
			for ( let i = 0; i < models.length; i ++ ) {

				models[ i ].traverse( ( child ) => {

					if ( child.geometry ) child.geometry.dispose();

				} );

			}

			onProgress( index / numIndices );
			loadIndex( index + 1 );

		}, undefined, ( error ) => {

			console.log( "Error creating model index: " + error );
			loadModel( index + 1 );

		} );

	}

	function loadModels( dbModels, callback ) {

		const numModels = dbModels.length;
		const models = [];

		loadModel( 0 );

		function loadModel( index ) {

			if ( index >= numModels ) {

				callback( models );
				return;

			}

			const model = dbModels[ index ];

			lDrawLoader.load( model.path, function ( model1 ) {

				const whiteColor = '15';
				processPartOrModel( model1, false, true, whiteColor );

				model1.userData.indexPath = model.path.substring( "oficiales/".length );
				models.push( model1 );

				loadModel( index + 1 );

			}, undefined, ( error ) => {

				console.log( "Error loading model: " + error );
				loadModel( index + 1 );

			} );

		}

	}

	function generateIndexLDRInternal2( models ) {

		const numModels = models.length;

		const factor = 1.2;
		let maxRadius = 0;
		for ( let i = 0; i < ; i ++ ) {

			const r = models[ i ].userData.modelDiameter * factor * 0.5;
			if ( maxRadius < r ) maxRadius = r;

		}

		let side = 1;
		while ( side * side < numModels ) side ++;

		let fileContents =
		`0 ROTATION CENTER 0 0 0 1 "Custom"
		0 ROTATION CONFIG 0 0
		`;

		let x = 0;
		let y = 0;
		for ( let i = 0; i < numModels; i ++ ) {

			const model = models[ i ];

			const currentX = x * maxRadius - maxRadius * size * 0.5;
			const currentY = y * maxRadius - maxRadius * size * 0.5;
			const currentZ = - model.userData.modelBbox.min.y;

			fileContents +=
			`
			1 ` + currentX + ` ` + currentY + ` ` + currentZ + ` 0 1 0 0 0 1 0 0 0 1 ` + model.userData.indexPath;

			x ++;
			if ( x >= side ) {

				x = 0;
				y ++;

			}

		}

		fileContents += '\n0';

		return fileContents;

	}

	function generateIndexLDRInternal( models ) {

		const factor = 1.2;
		let totalLength = 0;

		for ( let i = 0; i < models.length; i ++ ) {

			totalLength += models[ i ].userData.modelDiameter * factor;

		}

		let fileContents =
`0 ROTATION CENTER 0 0 0 1 "Custom"
0 ROTATION CONFIG 0 0
`;

		let currentX = - totalLength * 0.5;

		for ( let i = 0; i < models.length; i ++ ) {

			const model = models[ i ];

			const increment = model.userData.modelDiameter * factor * 0.5;
			currentX += increment;

			fileContents +=
`
1 0 ` + currentX + ` 0 0 1 0 0 0 1 0 0 0 1 ` + model.userData.indexPath;

			currentX += increment;

		}

		fileContents += '\n0';

		return fileContents;

	}

	function zipIndexLDR( dbModel, models ) {

		let subfolderPath = FileOperations.removeFilename( dbModel.path );
		if ( subfolderPath.endsWith( '/' ) ) subfolderPath = subfolderPath.substring( 0, subfolderPath.length - 1 );
		subfolderPath = subfolderPath.substring( "oficiales/".length );
		//const seriesIndexName = FileOperations.removeFilename( subfolderPath ) + "ind_" + dbModel.seriesNumber.replace( ' ', '_' ) + "_" + dbModel.refNumber + ".ldr";
		const seriesIndexName = subfolderPath + ".ldr";

		const indexContents = generateIndexLDRInternal2( models );
		zipFile.file( seriesIndexName, indexContents );

	}
}

export { generateAllIndexLDRs };
