
import * as THREE from '../three/build/three.module.js';
import { GUI } from '../three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from '../three/examples/jsm/controls/TransformControls.js';
import { RoomEnvironment } from '../three/examples/jsm/environments/RoomEnvironment.js';
//import { Water } from '../three/examples/jsm/objects/Water.js';
//import { Sky } from '../three/examples/jsm/objects/Sky.js';
import { LDrawLoader } from '../three/examples/jsm/loaders/LDrawLoader.js';
//import { LDrawUtils } from '../three/examples/jsm/utils/LDrawUtils.js';

import * as FileOperations from './fileOperations.js';
import { iconEmojis } from './iconEmojis.js';
import { createPartPreview, generatePartsThumnbnails } from './partPreview.js';

const GUI_WIDTH = 500;

const domeSize = 50000;

const constructionSetsNames = [
	'LEGO',
	'TENTE',
	'EXINCASTILLOS'
];
const constructionSets = {
	'LEGO': {
		scale: 1,
		translationSnap: 1,
		translationSnapVertical: 1
	},
	'TENTE': {
		scale: 0.4,
		translationSnap: 10,
		translationSnapVertical: 8
	},
	'EXINCASTILLOS': {
		scale: 1,
		translationSnap: 1,
		translationSnapVertical: 1
	}
};
let currentConstructionSet;

let container, progressBarDiv, sideBarDiv, scrolledDiv, partPreview;
let theInputFiles;
let camera, scene, renderer;
let cameraControls, transformControls;

let guiData;

//let sun, sunColor, sunSphere, water, sky;

let lDrawLoader;

let initialModel;
let models;
let animatedModel;
let animatedParts;
const meanPos = new THREE.Vector3();
const ANIM_STOPPED = 0;
const ANIM_FALLING = 1;
const ANIM_CONSTRUCTING = 2;
const ANIM_PAUSED = 3;
let animationState;
let animationCreated;
let timeNextState;
let stepDuration = 1.5;
let constructionDuration;
let time = 0;
let timeFactor = 1;
let pausedTimeFactor = 1;
let pauseOnNextStep;
let pauseOnNextStepStep;

const clock = new THREE.Clock();
let curve;

let guiCreated, gui, gui2, gui3, infoFolder, optionsFolder, exportFolder;
let timeFactorController;
let constructionStepController;
let modelTitleController;
let pathController;
let fileAuthorController;
let modelSeriesController;
let modelRefController;
let modelInfoURLController;
let modelBboxInfoController;
let showBOMController;

let animationButton;
let stopAnimButton;
let prevStepButton;
let nextStepButton;

let selectionModePartButton;
let selectionModeModelButton;

let toolMoveButton;
let toolRotateButton;
let toolScaleButton;

let addPartButton;
let cloneButton;
let deleteSelectionButton;

let saveLDrawButton;

let editMenu;

let infoDiv;

let bomPanel;
let modelSelectPanel;
let partSelectPanel;
let colorSelectPanel;
let lastOpenPanel;

// Physics variables
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let physicsWorld;
let dynamicObjects = [];
let btVectorAux1;
let btQuatAux1;
let btTransformAux1;

// Selection
let selectedPartBoxHelper;
let selectionModeModel = true;
let selection = [];
let selectionGroup;

const CLIPBOARD_NONE = 0;
const CLIPBOARD_POSITION = 1;
const CLIPBOARD_ROTATION = 2;
let clipboardType;
let clipboardMatrix;

let shiftIsPressed = false;

// Code 15 is White
let selectedColorCode = '15';

const TOOL_NONE = 0;
const TOOL_MOVE = 1;
const TOOL_ROTATE = 2;
const TOOL_SCALE = 3;
let selectedTool = TOOL_NONE;
let toolButtons;

const DEFAULT_ROTATION_SNAP = 90;
const DEFAULT_SCALE_SNAP = 0.1;
let translationSnap;
let translationSnapVertical;
let rotationSnap;
let scaleSnap;

let localCoordinateSystem = true;

let selectedModelRowIndex = null;
let selectedPartRowIndex = 0;
let selectedColorRowIndex = null;


const raycaster = new THREE.Raycaster();
const raycasterPointer = new THREE.Vector2();
const raycasterPointerNorm = new THREE.Vector2();

const vector3Temp1 = new THREE.Vector3();
const vector3Temp2 = new THREE.Vector3();
const vector3Temp3 = new THREE.Vector3();
const quatTemp1 = new THREE.Quaternion();
const matrix4Temp1 = new THREE.Matrix4();
const matrix4Temp2 = new THREE.Matrix4();
const matrix4Temp3 = new THREE.Matrix4();
const matrix4Temp4 = new THREE.Matrix4();
const eulerTemp1 = new THREE.Euler();

const ldrawPath = 'models/ldraw/';
let dataBase;
let colorsData;

/*= {
	'Car': 'car.ldr_Packed.mpd',
	'Lunar Vehicle': '1621-1-LunarMPVVehicle.mpd_Packed.mpd',
	'Radar Truck': '889-1-RadarTruck.mpd_Packed.mpd',
	'Trailer': '4838-1-MiniVehicles.mpd_Packed.mpd',
	'Bulldozer': '4915-1-MiniConstruction.mpd_Packed.mpd',
	'Helicopter': '4918-1-MiniFlyers.mpd_Packed.mpd',
	'Plane': '5935-1-IslandHopper.mpd_Packed.mpd',
	'Lighthouse': '30023-1-Lighthouse.ldr_Packed.mpd',
	'X-Wing mini': '30051-1-X-wingFighter-Mini.mpd_Packed.mpd',
	'AT-ST mini': '30054-1-AT-ST-Mini.mpd_Packed.mpd',
	'AT-AT mini': '4489-1-AT-AT-Mini.mpd_Packed.mpd',
	'Shuttle': '4494-1-Imperial Shuttle-Mini.mpd_Packed.mpd',
	'TIE Interceptor': '6965-1-TIEIntercep_4h4MXk5.mpd_Packed.mpd',
	'Star fighter': '6966-1-JediStarfighter-Mini.mpd_Packed.mpd',
	//'X-Wing': '7140-1-X-wingFighter.mpd_Packed.mpd',
	'AT-ST': '10174-1-ImperialAT-ST-UCS.mpd_Packed.mpd'
};*/

Ammo().then( function ( AmmoLib ) {

	Ammo = AmmoLib;

	init();

} );

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, domeSize );
	camera.position.set( 150, 200, 250 );

	//

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	container.appendChild( renderer.domElement );

	// scene

	const pmremGenerator = new THREE.PMREMGenerator( renderer );

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x596888 );

	scene.environment = pmremGenerator.fromScene( new RoomEnvironment() ).texture;

	//scene.add( new THREE.AxesHelper( 30 ) );

	//createOceanAndSky();

	cameraControls = new OrbitControls( camera, renderer.domElement );
	cameraControls.addEventListener( 'change', triggerRender );

	currentConstructionSet = 'TENTE';

	selectionGroup = new THREE.Group();
	selectionGroup.isSelectionGroup = true;
	scene.add( selectionGroup );

	clipboardType = CLIPBOARD_NONE;
	clipboardMatrix = new THREE.Matrix4();

	transformControls = new TransformControls( camera, renderer.domElement );
	transformControls.setMode( 'translate' );
	transformControls.setSpace( 'local' );
	transformControls.addEventListener( 'change', triggerRender );
	transformControls.addEventListener( 'objectChange', () => {

		for ( let i = 0, n = selection.length; i < n; i ++ ) {

			const bh = selection[ i ].userData.boxHelper;
			if ( bh ) bh.update();
		}

		triggerRender();

	} );

	transformControls.addEventListener( 'dragging-changed', function ( event ) {

		cameraControls.enabled = ! event.value;

	} );

	scene.add( transformControls );


	const curvePositions = [
		new THREE.Vector3( 0, 0, 0 ),
		new THREE.Vector3( 0.25, 0.38, 0 ),
		new THREE.Vector3( 0.75, 0.62, 0 ),
		new THREE.Vector3( 1, 1, 0 ),
	];
	curve = new THREE.CatmullRomCurve3( curvePositions );

	//

	lDrawLoader = new LDrawLoader();
	lDrawLoader.smoothNormals = true;
	lDrawLoader.setPath( getLibraryPath( currentConstructionSet ) );
	lDrawLoader.preloadMaterials( 'LDConfig.ldr' ).then( () => {

		lDrawLoader.setPartsLibraryPath( getLibraryPath( currentConstructionSet ) );
		lDrawLoader.setPath( getModelPath( currentConstructionSet ) );

		getModelsDataBase( currentConstructionSet, ( db ) => {

			dataBase = db;

			colorsData = createColorsData();

			// Load config
			//localStorage.clear();

			const urlParams = new URLSearchParams( window.location.search );
			if ( urlParams.get( 'modelPath' ) ) initialModel = urlParams.get( 'modelPath' );
			if ( urlParams.get( 'modelId' ) ) {

				const mp = searchModelByField( 'id', urlParams.get( 'modelId' ) );
				if ( mp ) initialModel = dataBase.models[ mp ].path;

			}

			if ( urlParams.get( 'colorCode' ) ) {

				lDrawLoader.materialLibrary[ '16' ] = lDrawLoader.materialLibrary[ urlParams.get( 'colorCode' ) ];

			}

			let displayLines = isOptionSet( 'displayLines' ) ? getOption( 'displayLines' ) : true;

			const backgroundColor = { r: scene.background.r, g: scene.background.g, b: scene.background.b }
			if ( isOptionSet( 'backgroundColor.r' ) ) {

				backgroundColor.r = getOption( 'backgroundColor.r' );
				backgroundColor.g = getOption( 'backgroundColor.g' );
				backgroundColor.b = getOption( 'backgroundColor.b' );
				scene.background.setRGB( backgroundColor.r, backgroundColor.g, backgroundColor.b );

			}

			const mainMat = lDrawLoader.getMainMaterial();
			const mainEdgeMat = mainMat.userData.edgeMaterial;
			const mainEdgeCondMat = mainEdgeMat.userData.conditionalEdgeMaterial;
			/*
			if ( isOptionSet( 'mainColor.r' ) && ! urlParams.get( 'colorCode' ) ) {

				const r = getOption( 'mainColor.r' );
				const g = getOption( 'mainColor.g' );
				const b = getOption( 'mainColor.b' );
				mainMat.color.setRGB( r, g, b );

			}

			if ( isOptionSet( 'mainEdgeColor.r' ) && ! urlParams.get( 'colorCode' ) ) {

				const r = getOption( 'mainEdgeColor.r' );
				const g = getOption( 'mainEdgeColor.g' );
				const b = getOption( 'mainEdgeColor.b' );
				mainEdgeMat.color.setRGB( r, g, b );
				mainEdgeCondMat.color.setRGB( r, g, b );

			}
			*/

			const mainColor = { r: mainMat.color.r, g: mainMat.color.g, b: mainMat.color.b }
			const mainEdgeColor = { r: mainEdgeMat.color.r, g: mainEdgeMat.color.g, b: mainEdgeMat.color.b }

			let exportScale = 1;
			if ( isOptionSet( 'exportScale' ) ) exportScale = getOption( 'exportScale' );

			translationSnap = constructionSets[ currentConstructionSet ].translationSnap;
			translationSnapVertical = constructionSets[ currentConstructionSet ].translationSnapVertical;
			rotationSnap = DEFAULT_ROTATION_SNAP;
			scaleSnap = DEFAULT_SCALE_SNAP;
			if ( isOptionSet( 'horizontalTranslationSnap' ) ) translationSnap = getOption( 'horizontalTranslationSnap' );
			if ( isOptionSet( 'verticalTranslationSnap' ) ) translationSnapVertical = getOption( 'verticalTranslationSnap' );
			if ( isOptionSet( 'rotationSnap' ) ) rotationSnap = getOption( 'rotationSnap' );
			if ( isOptionSet( 'scaleSnap' ) ) scaleSnap = getOption( 'scaleSnap' );

			guiData = {
				displayLines: displayLines,
				backgroundColor: backgroundColor,
				mainColor: mainColor,
				mainEdgeColor: mainEdgeColor,
				constructionStep: 0,
				timeFactor: 1,
				modelTitle: '',
				modelSeries: '',
				modelRef: '',
				modelInfoURL: '',
				path: '',
				fileAuthor: '',
				modelBboxInfo: '',
				exportScale: exportScale,
				exportGLTF: () => { exportModelFormat( 'gltf' ); },
				exportDAE: () => { exportModelFormat( 'dae' ); },
				exportOBJ: () => { exportModelFormat( 'obj' ); },
				showBOM: showBOM,
				generatePartsThumnbnails: generatePartsThumnbnailsFunc,
				translationSnap: translationSnap,
				translationSnapVertical: translationSnapVertical,
				rotationSnap: rotationSnap,
				scaleSnap: scaleSnap
			};

			setFineSnap( false );

			window.addEventListener( 'resize', onWindowResize );

			// File selection

			theInputFiles = document.getElementById( 'theInputFiles' );
			theInputFiles.addEventListener( 'change', ( event ) => {

				const scaleToUnitMM = constructionSets[ currentConstructionSet ].scale;

				FileOperations.loadModelsFiles( event.target.files, onFileLoaded, lDrawLoader, scaleToUnitMM );
				theInputFiles.value = null;

			}, false );

			// Key events

			window.addEventListener( 'keydown', ( event ) => {

				switch ( event.key ) {

					case 'ArrowLeft':
						if ( ! lastOpenPanel ) goToPrevStep();
						break;

					case 'ArrowRight':
						if ( ! lastOpenPanel ) goToNextStep();
						break;

					case ' ':
						if ( ! lastOpenPanel ) animationButtonFunc();
						break;

					case 'v':
						if ( ! lastOpenPanel ) centerCameraInObject();
						break;

					case 'c':
						if ( ! lastOpenPanel ) selectColor();
						break;

					case 'l':
						if ( ! lastOpenPanel ) toggleCoordinateSystem();
						break;

					case 'n':
						if ( ! lastOpenPanel ) cloneSelection();
						break;

					case 'g':
						if ( ! lastOpenPanel ) selectTool( TOOL_MOVE );
						break;

					case 'r':
						if ( ! lastOpenPanel ) selectTool( TOOL_ROTATE );
						break;

					case 's':
						if ( ! lastOpenPanel ) selectTool( TOOL_SCALE );
						break;

					case 'Delete':
						if ( ! lastOpenPanel ) deleteSelection();
						break;

					case 'Enter':
						if ( lastOpenPanel && lastOpenPanel.button ) lastOpenPanel.button.onclick();
						break;

					case 'Escape':
						if ( lastOpenPanel ) lastOpenPanel.closeButton.onclick();
						break;

					case 'ArrowUp':
						event.preventDefault();
						if ( lastOpenPanel ) lastOpenPanel.selectPrevious();
						break;

					case 'ArrowDown':
						event.preventDefault();
						if ( lastOpenPanel ) lastOpenPanel.selectNext();
						break;

					case 'Control':
						setSnapEnabled( false );
						break;

					case 'Alt':
						setFineSnap( true );
						break;

					case 'Shift':
						shiftIsPressed = true;
						break;

					default:
						break;

				}

			} );

			window.addEventListener( 'keyup', ( event ) => {

				switch ( event.key ) {

					case 'Control':
						setSnapEnabled( true );
						break;

					case 'Alt':
						setFineSnap( false );
						break;

					case 'Shift':
						shiftIsPressed = false;
						break;

					default:
						break;

				}

			} );

			// Mouse events

			renderer.domElement.addEventListener( 'mousedown', ( event ) => {

				clearUserMessage();

				raycasterPointer.set( event.clientX, event.clientY );

			} );

			renderer.domElement.addEventListener( 'mouseup', ( event ) => {

				if ( Math.abs( event.clientX - raycasterPointer.x ) < 2 &&
					 Math.abs( event.clientY - raycasterPointer.y ) < 2 ) {

					raycasterPointerNorm.x = ( event.clientX / getViewPortWidth() ) * 2 - 1;
					raycasterPointerNorm.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

					raycaster.setFromCamera( raycasterPointerNorm, camera );

					let intersects = [];

					raycaster.intersectObjects( models, true, intersects );
					if ( animatedParts ) raycaster.intersectObjects( animatedParts, true, intersects );

					let object = null;
					if ( intersects.length > 0 ) {

						object = intersects[ 0 ].object;

						if ( object.isTransformControlsPlane && intersects.length > 1 ) object = intersects[ 1 ].object;

						object = getObjectPart( object );

						if ( ! isPart( object ) && ! isEmbeddedPart( object ) ) object = null;

						if ( selectionModeModel ) object = getPartModel( object );

					}

					if ( selection.length > 0 && ! selectionModeModel && getPartModel( object ) !== getPartModel( selection[ 0 ] ) ) object = null;

					const newSelection = [];

					if ( shiftIsPressed ) {

						for ( let i = 0; i < selection.length; i ++ ) {

							if ( ! newSelection.includes( selection[ i ] ) && selection[ i ] !== object ) newSelection.push( selection[ i ] );

						}

						if ( ! selection.includes( object ) && object ) newSelection.push( object );

					}
					else if ( object ) newSelection.push( object );

					selectParts( newSelection );

					triggerRender();

				}

			} );

			progressBarDiv = document.createElement( 'div' );
			progressBarDiv.innerText = 'Loading...';
			progressBarDiv.style.fontSize = '2em';
			progressBarDiv.style.color = '#AA4';
			progressBarDiv.style.display = 'block';
			progressBarDiv.style.position = 'absolute';
			progressBarDiv.style.top = '50%';
			progressBarDiv.style.width = '100%';
			progressBarDiv.style.textAlign = 'center';

			initPhysics();

			models = [];

			createGUI();

			if ( initialModel ) loadLDrawModelFromRepo( initialModel, null, ( model ) => {

				// TODO revise camera repositioning and object apparent zoom
				const pos = model.userData.modelBbox.getCenter( vector3Temp1 );
				pos.y += model.position.y;
				setCamera( model, pos.x, pos.y, pos.z );

				setSelectionModeModel( true );
				selectParts( [ model ] );
				centerCameraInObject();
				setFineSnap( false );
				updateObjectsVisibility();
				hideProgressBar();
				finishInit();

			} );
			else finishInit();

			function finishInit() {

				updateModelAndPartInfo();

				time = 0;
				animationState = ANIM_STOPPED;
				animationCreated = false;
				animatedModel = null;
				timeFactor = 1;
				guiData.timeFactor = timeFactor;
				timeFactorController.updateDisplay();

				triggerRender();

			}

		} );

	} );

}

function initPhysics() {

	// Physics configuration

	collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
	dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
	broadphase = new Ammo.btDbvtBroadphase();
	solver = new Ammo.btSequentialImpulseConstraintSolver();
	physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
	physicsWorld.setGravity( new Ammo.btVector3( 0, - 150, 0 ) );

	// Create the floor body

	const groundShape = new Ammo.btStaticPlaneShape( new Ammo.btVector3( 0, 1, 0 ), 0 );
	const groundTransform = new Ammo.btTransform();
	groundTransform.setIdentity();
	const groundMass = 0;
	const groundLocalInertia = new Ammo.btVector3( 0, 0, 0 );
	const groundMotionState = new Ammo.btDefaultMotionState( groundTransform );
	const groundBody = new Ammo.btRigidBody( new Ammo.btRigidBodyConstructionInfo( groundMass, groundMotionState, groundShape, groundLocalInertia ) );
	physicsWorld.addRigidBody( groundBody );

	btVectorAux1 = new Ammo.btVector3( 0, 0, 0 );
	btQuatAux1 = new Ammo.btQuaternion( 0, 0, 0, 1 );
	btTransformAux1 = new Ammo.btTransform();

}

function updatePhysics( deltaTime ) {

	physicsWorld.stepSimulation( deltaTime, 5 );

	// Update objects
	for ( let i in dynamicObjects ) {

		const object = dynamicObjects[ i ];
		const objPhys = object.userData.physicsBody;
		const ms = objPhys.getMotionState();
		if ( ms ) {

			ms.getWorldTransform( btTransformAux1 );
			const p = btTransformAux1.getOrigin();
			const q = btTransformAux1.getRotation();
			object.position.set( p.x(), p.y(), p.z() );
			object.quaternion.set( q.x(), q.y(), q.z(), q.w() );

		}

	}

}

function createRigidBody( object, physicsShape, mass = 0 ) {

	const pos = object.position;
	const quat = object.quaternion;

	const transform = btTransformAux1;
	transform.setIdentity();
	btVectorAux1.setValue( pos.x, pos.y, pos.z );
	transform.setOrigin( btVectorAux1 );
	btQuatAux1.setValue( quat.x, quat.y, quat.z, quat.w )
	transform.setRotation( btQuatAux1 );

	const motionState = new Ammo.btDefaultMotionState( transform );

	const localInertia = new Ammo.btVector3( 0, 0, 0 );
	physicsShape.calculateLocalInertia( mass, localInertia );

	const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
	const body = new Ammo.btRigidBody( rbInfo );

	body.setFriction( 0.5 );

	object.userData.physicsBody = body;

	if ( mass > 0 ) {

		dynamicObjects.push( object );

		// Disable deactivation
		body.setActivationState( 4 );

	}

	physicsWorld.addRigidBody( body );

}

function updateRigidBodyFromObject( object ) {

	const pos = object.position;
	const quat = object.quaternion;

	const transform = btTransformAux1;
	transform.setIdentity();
	btVectorAux1.setValue( pos.x, pos.y, pos.z );
	transform.setOrigin( btVectorAux1 );
	btQuatAux1.setValue( quat.x, quat.y, quat.z, quat.w )
	transform.setRotation( btQuatAux1 );

	const motionState = new Ammo.btDefaultMotionState( transform );

	object.userData.physicsBody.setMotionState( motionState );

}

function reenablePhysics() {

	for ( let i in animatedParts ) {

		const part = animatedParts[ i ];

		updateRigidBodyFromObject( part );
		physicsWorld.addRigidBody( part.userData.physicsBody );
		dynamicObjects.push( part );
		part.userData.physicsControlled = true;

	}

}

function updateObjectsVisibility() {

	function updateObjects( objects ) {

		for ( let i in objects ) {

			objects[ i ].traverse( c => {

				if ( c.isLineSegments ) {

					c.visible = guiData.displayLines;

				}

			} );

		}

	}

	updateObjects( models );
	updateObjects( animatedParts );
	if ( animatedModel ) updateObjects( [ animatedModel ] );

}

function loadLDrawModelFromRepo( modelFileName, parentModel, onLoaded ) {

	updateProgressBar( 0 );
	showProgressBar();

	lDrawLoader.load( modelFileName, function ( model1 ) {

		addLDrawPartOrModel( model1/*.clone()*/, parentModel, true );
		onLoaded( model1 );

	}, onProgress, onError );

}

function exportModelFormat( format ) {

	const scale = constructionSets[ currentConstructionSet ].scale * guiData.exportScale;

	if ( selection.length !== 1 ) {

		alert( "Please select exactly one model to export." );
		return;

	}

	FileOperations.exportModel( selection[ 0 ], format, scale );

}

function isPartPath( path ) {

	// TODO This function is not used, remove

	return path.startsWith( '../parts/' ) || path.startsWith( 'parts/' );;

}

function isPartType( type ) {

	// TODO This function is not used, remove

	return type === 'Part' || type === 'Unofficial_Part';

}

function isModelType( type ) {

	return type === 'Model';

}

function isPart( part ) {

	if ( ! part || ! part.userData ) return false;

	return getDataBasePart( part ) !== undefined;

}

function isModel( model ) {

	if ( ! model || ! model.userData ) return false;

	return isModelType( model.userData.type );

}

function getObjectPart( object ) {

	if ( ! object ) return null;

	while ( object.parent && ( ! object.parent.isScene ) && ! object.userData.fileName ) object = object.parent;

	while ( object.parent && ! object.parent.isScene &&
			(
			  ( ! isPart( object ) && ! isModel( object ) && ! object.userData.fileName ) ||
			  ( object.parent.parent && ( ! object.parent.parent.isScene && ! object.parent.isSelectionGroup ) && isModel( object.parent ) ) ||
			  ( object.parent.parent && ( ! object.parent.parent.isScene && ! object.parent.isSelectionGroup ) && isPart( object.parent ) )
			)
		  ) {

		object = object.parent;

	}


	let rootGrandson = object;
	let rootChild = rootGrandson.parent;
	let root = rootChild ? ( rootChild.parent ? rootChild.parent : null ) : null;
	while ( root ) {

		rootGrandson = rootChild;
		rootChild = root;
		root = root.parent;

	}

	if ( rootChild && rootChild.isScene ) {

		if ( rootGrandson.userData.isAnimatedPart ) return rootGrandson;

	}
	else {

		if ( rootChild && rootChild.userData.isAnimatedPart ) return rootChild;

	}

	return object;

}

function isEmbeddedPart( part ) {

	return part && ! isPart( part ) && ! getDataBaseModel( part );

}

function isNonLDrawModel( part ) {

	return part && part.userData && part.userData.isNonLDrawModel;

}

function getPartModel( part ) {

	if ( ! part ) return null;

	if ( isModel( part ) ) return part;

	while ( part.parent && ( ! part.parent.isScene ) ) part = part.parent;

	return part;

}

function isAnimatedPart( part ) {

	return animatedParts && animatedParts.includes( part )

}

function getDataBasePart( part ) {

	if ( ! part || ! part.userData.fileName ) return null;

	let fileName = part.userData.fileName;

	return dataBase.parts[ fileName ];

}

function getDataBaseModel( model ) {

	if ( ! model || ! model.userData.fileName ) return null;

	let fileName = model.userData.fileName;

	return dataBase.models[ fileName ];

}

function searchModelByField( field, value ) {

	for ( modelPath in database.modelPathsList ) {

		const model = dataBase.models[ modelPath ];

		if ( model[ field ] === value ) return modelPath;

	}

	return null;

}

function createModelBBox( model ) {

	if ( ! model.userData.modelBbox || ! model.userData.modelBbox.setFromObject ) model.userData.modelBbox = new THREE.Box3();

	model.userData.modelBbox.setFromObject( model );

	const size = model.userData.modelBbox.getSize( vector3Temp1 );
	const radius = Math.max( vector3Temp1.x, Math.max( vector3Temp1.y, vector3Temp1.z ) ) * 0.5;
	model.userData.modelDiameter = 2 * radius;

}

function setCamera( model, x, y, z ) {

	cameraControls.target0.set( x, y, z );
	cameraControls.position0.set( - 2.3, 1, 2 ).multiplyScalar( model.userData.modelDiameter * 0.6 ).add( cameraControls.target0 );
	cameraControls.reset();

	triggerRender();

}

function centerCameraInObject() {

	if ( selectionIsEmpty() ) return;

	const model = selectionGroup;

	if ( ! model ) return;

	createModelBBox( model );

	model.userData.modelBbox.getCenter( cameraControls.target0 );
	vector3Temp1.subVectors( camera.position, cameraControls.target );
	cameraControls.position0.copy( vector3Temp1 ).add( cameraControls.target0 );
	cameraControls.reset();

	triggerRender();

}

function colorToolButtonFunc() {

	selectColor();

}

function moveToolButtonFunc() {

	selectTool( TOOL_MOVE );

}

function rotateToolButtonFunc() {

	selectTool( TOOL_ROTATE );

}

function scaleToolButtonFunc() {

	selectTool( TOOL_SCALE );

}

function selectTool( tool ) {

	const previousTool = selectedTool;

	if ( previousTool !== TOOL_NONE ) {

		const toolButton = toolButtons[ previousTool ];
		if ( toolButton ) setButtonDisabled( toolButton, false );

	}

	if ( tool !== TOOL_NONE ) {

		const toolButton = toolButtons[ tool ];
		if ( toolButton ) setButtonDisabled( toolButton, true );

	}

	selectedTool = tool;

	activateTool( tool, previousTool, selection, selection );

}

function activateTool( tool, previousTool, parts, previousParts ) {

	let equalSelection = previousParts.length === parts.length;
	for ( let i = 0, n = previousParts.length; i < n && equalSelection; i ++ ) {

		equalSelection &= parts.includes( previousParts[ i ] );

	}
	let differentSelection = parts.length > 0 && ! equalSelection;

	const selectionFlag = parts.length > 0;

	switch ( tool ) {

		case TOOL_NONE:

			transformControls.visible = false;
			transformControls.enabled = false;
			break;

		case TOOL_MOVE:
			transformControls.setMode( 'translate' );
			transformControls.visible = selectionFlag;
			transformControls.enabled = selectionFlag;
			break;

		case TOOL_ROTATE:
			transformControls.setMode( 'rotate' );
			transformControls.visible = selectionFlag;
			transformControls.enabled = selectionFlag;
			break;

		case TOOL_SCALE:
			transformControls.setMode( 'scale' );
			transformControls.visible = selectionFlag;
			transformControls.enabled = selectionFlag;
			break;

		default:
			break;

	}
}

function setSnapEnabled( enabled ) {

	if ( ! enabled ) {

		transformControls.setTranslationSnap( null );
		transformControls.setRotationSnap( null );
		transformControls.setScaleSnap( null );

	} else {

		transformControls.setTranslationSnap( translationSnap );
		transformControls.setTranslationSnapVertical( translationSnapVertical );
		transformControls.setRotationSnap( rotationSnap * Math.PI / 180 );
		transformControls.setScaleSnap( scaleSnap );

	}

}

function setFineSnap( fine ) {

	if ( fine ) {

		translationSnap = 1;
		translationSnapVertical = 1;
		rotationSnap = 5;
		scaleSnap = 0.05;

	} else {

		translationSnap = guiData.translationSnap;
		translationSnapVertical = guiData.translationSnapVertical;
		rotationSnap = guiData.rotationSnap;
		scaleSnap = guiData.scaleSnap;

	}

	setSnapEnabled( true );

}

function setLocalCoordinateSystem( local ) {

	localCoordinateSystem = local;
	transformControls.setSpace( local ? 'local' : 'world' );
	triggerRender();

}

function toggleCoordinateSystem() {

	setLocalCoordinateSystem( ! localCoordinateSystem );

}

function attachTransformControlsToPart( part ) {

	transformControls.attach( part );

}

function detachTransformControlsFromPart( part ) {

	transformControls.attach( undefined );

}

function selectColor() {

	if ( selection.length === 1 ) {

		const sel = selection[ 0 ];

		const index = searchColorIndex( sel.userData.colorCode );

		if ( index >= 0 ) {

			selectedColorCode = sel.userData.colorCode;
			selectedColorRowIndex = index;

		}

	}

	showSelectLDrawColorCode( ( result ) => {

		if ( ! result ) return;

		const colorCode = result;
		for ( let i = 0, n = selection.length; i < n; i ++ ) {

			applyMainMaterialToPart( selection[ i ], colorCode );
			updateModelAndPartInfo();
			triggerRender();

		}

	} );

}

function showSelectAddLDrawPart() {

	if ( selectionIsEmpty() && models.length !== 1 ) {

		if ( models.length > 1 ) alert( "Please select one of the existing models to add the part to." );
		return;

	}

	if ( models.length === 1 ) {

		setSelectionModeModel( true );
		selectParts( [ models[ 0 ] ] );

	}
	else if ( ! selectionModeModel ) selectParts( [ getPartModel( selection[ 0 ] ) ] );

	if ( selectionIsEmpty() ) return;

	const selectedModel = selection[ 0 ];
	showSelectLDrawPartFromRepo( selectedModel, ( part ) => {

		setSelectionModeModel( false );
		selectParts( [ part ] );

		setFineSnap( false );
		hideProgressBar();
		triggerRender();

	} );

}

function createNewEmptyModel() {

	const model = new THREE.Group();
	model.rotation.x = Math.PI;
	model.userData.fileName = "";
	model.userData.type = "Model";
	model.userData.colorCode = "16";
	model.userData.numConstructionSteps = 1;
	model.userData.constructionStep = 0;

	showSelectLDrawPartFromRepo( model, ( part ) => {

		addLDrawPartOrModel( model, null, true );

		setSelectionModeModel( false );
		selectParts( [ part ] );

		setFineSnap( false );
		hideProgressBar();
		triggerRender();

	} );

}

function showSelectFromFile() {

	theInputFiles.click();

}

function onFileLoaded( mesh, isLDraw ) {

	let parentModel = null;
/*
	if ( selectedPart ) {

		parentModel = getPartModel( selectedPart );
		if ( ! isModel( parentModel ) ) parentModel = null;

	}
*/

	addLDrawPartOrModel( mesh, parentModel, isLDraw );

	setSelectionModeModel( ! parentModel );
	selectParts( [ mesh ] );

	setFineSnap( false );
	hideProgressBar();
	triggerRender();

}

function saveModelAsLDrawButtonFunc() {

	let modelToBeSaved = null;

	if ( models.length === 1 ) modelToBeSaved = models[ 0 ];
	else {

		if ( selection.length !== 1 ) {

			alert( "Please select one of the models to be saved as .ldr" );
			return;

		}

		modelToBeSaved = getPartModel( selection[ 0 ] );

	}

	let fileName = modelToBeSaved.userData.fileName;

	if ( ! fileName ) {

		alert( "Please set model file name before saving it under Model Info -> File name after selecting it." );
		return;

	}

	const modelInfo = getDataBaseModel( modelToBeSaved );
	const title = ! modelInfo ? "" : ( modelInfo.fileTitle ? modelInfo.fileTitle : modelInfo.title );

	const fileContents = FileOperations.exportModelAsLDraw( modelToBeSaved, title, getObjectPart, isEmbeddedPart );

	FileOperations.saveFile( fileName, new Blob( [ fileContents ] ) );

}

function saveSceneAsTNTButtonFunc() {
/*
	const fileContents = exportSceneAsTNT();

	let fileName = "Scene.tnte";
	//if ( ! fileName ) FileOperations.removeFilenameExtension( fileName ) + ".ldr", new Blob( [ fileContents ] ) );

	// TODO

	FileOperations.saveFile( fileName, new Blob( [ fileContents ] ) );
*/

}

function loadTNTScene() {
}

function exportSceneAsTNT() {
}

function deleteSelection() {

	if ( selectionIsEmpty() ) return;

	const partsToBeDeleted = selection;

	selectParts( null );

	for ( let i = 0, n = partsToBeDeleted.length; i < n; i ++ ) {

		const partToBeDeleted = partsToBeDeleted[ i ];

		const parent = partToBeDeleted.parent;

		deletePartOrModel( partToBeDeleted );

		if ( parent && isModel( parent ) && parent.children.length === 0 ) {

			deletePartOrModel( parent );
			alert( "Model was deleted because you deleted its last part." );

		}

	}

	triggerRender();

}

function appendSelectionToModel() {

	// TODO

}

function addLDrawPartOrModel( model, parentModel, isLDraw ) {

	if ( ! isLDraw ) model.userData.isNonLDrawModel = true;

	if ( parentModel ) {

		parentModel.add( model );

		if ( isLDraw ) {

			model.userData.type = 'Unofficial_Part';
			if ( model.userData.fileName.startsWith( '../parts/' ) ) {

				model.userData.fileName = model.userData.fileName.substring( '../parts/'.length );

			}

			model.userData.colorCode = '16';

		}

	}
	else {

		models.push( model );
		scene.add( model );

	}

	processPartOrModel( model, isLDraw && parentModel !== null, ( isLDraw && parentModel === null ) || ( ! isLDraw && parentModel !== null ) );

}

function processPartOrModel( part, isAPart, doRotate, colorCode ) {

	// Convert from LDraw coordinate system: rotate 180 degrees around X axis
	if ( doRotate ) part.rotation.x = Math.PI;

	createModelBBox( part );

	// Extrude a little bit the stickers
	const stickers = [];
	part.traverse( c => {

		if ( c.userData.fileName ) {

			let title = c.userData.fileName;
			const cPart = getDataBasePart( c );
			if ( cPart && cPart.title ) title = cPart.title;
			if ( title.indexOf( 'Etique' ) >= 0 ) stickers.push( c );

		}

	} );
	for ( let s in stickers ) {

		stickers[ s ].traverse( c => {

			if ( c.isMesh ) {

				c.userData.stickerOriginalGeometry = c.geometry.clone();

				const vertices = c.geometry.getAttribute( 'position' ).array;
				const normals = c.geometry.getAttribute( 'normal' ).array;

				for ( let ip = 0, np = vertices.length; ip < np; ip += 3 ) {

					vector3Temp1.fromArray( vertices, ip );
					vector3Temp2.fromArray( normals, ip );
					vector3Temp3.copy( vector3Temp2 ).setLength( 0.5 );
					vector3Temp1.add( vector3Temp3 );
					vector3Temp1.toArray( vertices, ip );

				}

			}

		} );

	}

	if ( isAPart ) applyMainMaterialToPart( part, colorCode ? colorCode : selectedColorCode );

}

function deletePartOrModel( part ) {

	// Returns success

	if ( isModel( part ) || isNonLDrawModel( part ) ) {

		if ( part === animatedModel ) return false;

		const i = models.indexOf( part );
		if ( i >= 0 ) models.splice( i, 1 );

	} else if ( isAnimatedPart( part ) ) return false;

	part.removeFromParent();

	return true;

}

function applyMainMaterialToPart( part, colorCode ) {

	const changedMaterial = lDrawLoader.materialLibrary[ colorCode ];

	if ( ! changedMaterial ) return;

	applyMaterialRecursive( part, true );

	function applyMaterialRecursive( p, force ) {

		let hit = false;

		if ( p.isGroup ) {

			if ( force ) {

				p.userData.colorCode = colorCode;
				hit = true;

			}
			else if ( p.userData.colorCode === '16' ) hit = true;

		}
		else hit = true;

		if ( ! hit ) return;

		changeMaterial( p );

		for ( let childIndex in p.children ) {

			const child = p.children[ childIndex ];
			applyMaterialRecursive( child );

		}

	}

	function changeMaterial( obj ) {

		if ( obj.isGroup ) return;

		let mat = changedMaterial;
		if ( obj.isConditionalLine ) mat = mat.userData.edgeMaterial.userData.conditionalEdgeMaterial;
		else if ( obj.isLineSegments ) mat = mat.userData.edgeMaterial;

		if ( Array.isArray( obj.material ) ) {

			for ( let c in obj.material ) {

				obj.material[ c ] = mat;

			}

		}
		else obj.material = mat;

	}

}

function undo() {
}

function redo() {
}

function cloneSelection() {

	if ( selectionIsEmpty() ) return;

	const clones = [];

	if ( selectionModeModel ) {

		for ( let i = 0, n = selection.length; i < n; i ++ ) {

			const original = selection[ i ];
			const clone = original.clone();
			clone.position.add( selectionGroup.position );
			clone.userData.boxHelper = null;
			clones.push( clone );
			models.push( clone );
			scene.add( clone );

		}

	} else {

		const model = getPartModel( selection[ 0 ] );
		if ( ! model ) return;

		const toBeCloned = selection;
		selectParts( [] );

		for ( let i = 0, n = toBeCloned.length; i < n; i ++ ) {

			const clone = toBeCloned[ i ].clone();
			clone.userData.boxHelper = null;
			model.add( clone );
			clones.push( clone );

		}

	}

	selectParts( clones );

	triggerRender();

}

function setSelectionModeModel( set ) {

	if ( selectionModeModel === set ) return;

	selectParts( null );

	if ( set ) {

		selectionModeModel = true;
		setButtonDisabled( selectionModePartButton, false );
		setButtonDisabled( selectionModeModelButton, true );

	} else {

		selectionModeModel = false;
		setButtonDisabled( selectionModePartButton, true );
		setButtonDisabled( selectionModeModelButton, false );

	}

}

function selectParts( parts ) {

	if ( ! parts || parts.length > 0 && parts[ 0 ] === null ) parts = [];

	if ( selectionModeModel ) {

		for ( let i = 0, n = parts.length; i < n; i ++ ) {

			if ( isAnimatedPart( parts[ i ] ) ) {

				parts = [];
				break;

			}

		}

	}

	detachTransformControlsFromPart( selectionGroup );

	while ( selectionGroup.children.length > 0 ) {

		const c = selectionGroup.children[ 0 ];
		selectionGroup.parent.attach( c );
		if ( c.userData.boxHelper ) c.userData.boxHelper.visible = false;

	}

	if ( parts.length > 0 ) {

		if ( selectionModeModel ) {

			for ( let i = 0, n = parts.length; i < n; i ++ ) {

				if ( ! isModel( parts[ i ] ) ) {

					console.log( "Error: model selection contains parts. Count = " + parts.length );
					//return;

				}

			}

			scene.attach( selectionGroup );

		} else {

			const model = getPartModel( parts[ 0 ] );

			for ( let i = 1, n = parts.length; i < n; i ++ ) {

				if ( getPartModel( parts[ i ] ) !== model ) {

					console.log( "Error: selection contains parts of different models. Count = " + parts.length );
					//return;

				}

			}

			model.attach( selectionGroup );

		}

/*
		vector3Temp1.set( 0, 0, 0 );
		for ( let i = 0, n = parts.length; i < n; i ++ ) {

			vector3Temp1.add( parts[ i ].position );

		}
		vector3Temp1.divideScalar( parts.length );

		selectionGroup.position.copy( vector3Temp1 );
		selectionGroup.quaternion.set( 0, 0, 0, 1 );
		selectionGroup.scale.set( 1, 1, 1 );
*/

		const firstPart = parts[ 0 ];
		selectionGroup.position.copy( firstPart.position );
		selectionGroup.quaternion.copy( firstPart.quaternion );
		selectionGroup.scale.copy( firstPart.scale );

		for ( let i = 0, n = parts.length; i < n; i ++ ) {

			selectionGroup.attach( parts[ i ] );

		}

		attachTransformControlsToPart( selectionGroup );

		for ( let i = 0, n = parts.length; i < n; i ++ ) {

			const part = parts[ i ];
			let bh = part.userData.boxHelper;

			if ( bh ) {

				bh.setFromObject( part );
				bh.visible = true;

			}
			else {

				bh = new THREE.BoxHelper( part, 0xFF00FF );
				part.userData.boxHelper = bh;
				scene.add( bh );

			}

			bh.material.color.setHex( selectionModeModel ? 0x00FF00 : 0xFF00FF );

		}

		if ( ! animationCreated && selectionModeModel ) {

			setButtonDisabled( animationButton , false );
			setButtonDisabled( stopAnimButton, true );

		}

		setButtonDisabled( addPartButton, false );
		setButtonDisabled( deleteSelectionButton, false );
		setButtonDisabled( cloneButton, false );

	}
	else {

		scene.attach( selectionGroup );
		selectionGroup.position.set( 0, 0, 0 );
		selectionGroup.quaternion.set( 0, 0, 0, 1 );
		selectionGroup.scale.set( 1, 1, 1 );

		if ( ! animationCreated ) {

			setButtonDisabled( animationButton , true );
			setButtonDisabled( stopAnimButton, true );

		}

		setButtonDisabled( addPartButton, models.length !== 1 );
		setButtonDisabled( deleteSelectionButton, true );
		setButtonDisabled( cloneButton, true );

	}

	const previousParts = selection;
	selection = parts;

	activateTool( selectedTool, selectedTool, selection, previousParts );

	updateModelAndPartInfo();

}

function selectionIsEmpty() {

	return selection.length === 0;
}

function updateModelAndPartInfo() {

	let infoText = '';

	const selectedModel = getPartModel( selectionIsEmpty() ? null : selection[ 0 ] );
	const modelInfo = getDataBaseModel( selectedModel );


	if ( selection.length > 1 ) {

		infoText += selection.length + ( selectionModeModel ? ' models' : ' parts' ) + ' selected.<br>';

	} else if ( selection.length === 1 ) {

		const sel = selection[ 0 ];
		const mat = lDrawLoader.materialLibrary[ sel.userData.colorCode ];

		let partInfo = getDataBasePart( sel );
		if ( partInfo ) {

			infoText += 'Part: ' +
				'<a href="/TNTViewer/examples/tnt.html?modelPath=../parts/' + partInfo.path +
				'&colorCode=' + mat.userData.code +
				'">' + partInfo.title + '</a><br>';

			if ( mat ) infoText += 'Part color: ' + mat.name + '<br>';

		}
		else {

			if ( selectedModel === sel ) {

				infoText += 'Model: ' + selectedModel.userData.fileName + '<br>';

			}
			else if ( isEmbeddedPart( sel ) ) {

				infoText += 'Part: Embedded part.<br>';
				if ( mat ) infoText += 'Part color: ' + mat.name + '<br>';

			}
			else infoText += 'Part: No part selected.<br>';

		}

	} else infoText += 'Part: No part selected.<br>';

	if ( modelInfo ) {

		if ( modelInfo.path ) guiData.path = modelInfo.path;
		guiData.fileAuthor = selectedModel.userData.author ? selectedModel.userData.author : "";
		guiData.modelTitle = modelInfo.title ? modelInfo.title : "No title.";
		guiData.modelSeries = modelInfo.seriesNumber ? modelInfo.seriesNumber : "No series.";
		if ( modelInfo.refNumber ) guiData.modelRef = modelInfo.refNumber;
		else if ( modelInfo.metaData ) guiData.modelRef = modelInfo.metaData;
		else guiData.modelRef = "No ref.";
		if ( modelInfo.id && Number.isInteger( parseInt( modelInfo.id ) ) ) {

			guiData.modelInfoURL = 'https://tente.spread.name/id/' + modelInfo.id;

			infoText += 'Go <a href="https://tente.spread.name/id/' + modelInfo.id + '"><b>here for model info</b> (external link)</a>';

		}
		else guiData.modelInfoURL = "No URL.";

	}
	else {

		if ( selectionIsEmpty() ) {

			guiData.path = "";
			guiData.fileAuthor = "";
			guiData.modelTitle = "";
			guiData.modelSeries = "";
			guiData.modelRef = "";
			guiData.modelInfoURL = "";
		}
		else {

			guiData.path = selectedModel && selectedModel.userData.fileName ? selectedModel.userData.fileName : "";
			guiData.fileAuthor = "";
			guiData.modelTitle = "No title.";
			guiData.modelSeries = "No series.";
			guiData.modelRef = "No ref.";
			guiData.modelInfoURL = "";

		}

	}

	if ( selectedModel ) {

		createModelBBox( selectedModel );

		selectedModel.userData.modelBbox.getSize( vector3Temp1 ).multiplyScalar( constructionSets[ currentConstructionSet ].scale );
		function round10( x ) { return Math.round( x * 10 ) / 10; }
		guiData.modelBboxInfo = round10( vector3Temp1.x ) + " x " + round10( vector3Temp1.z ) + " x " + round10( vector3Temp1.y );

		showBOMController.enable();

	}
	else {

		guiData.modelBboxInfo = "";
		showBOMController.disable();

	}

	pathController.updateDisplay();
	fileAuthorController.updateDisplay();
	modelTitleController.updateDisplay();
	modelSeriesController.updateDisplay();
	modelRefController.updateDisplay();
	modelInfoURLController.updateDisplay();
	modelBboxInfoController.updateDisplay();

	infoText += '<br>See <a href="/TNTViewer/examples/tnt_models.html">models</a> and ' +
		'<a href="/TNTViewer/examples/tnt_parts.html">parts</a> lists.' +
		'<br><a href="https://github.com/yomboprime/TNTViewer">TNTViewer code at Github</a>';

	infoDiv.innerHTML = infoText;

}

function setButtonDisabled( button, disabled ) {

	if ( disabled ) button.style.opacity = "30%";
	else button.style.opacity = "100%";

	button.disabled = disabled;

}

function animationButtonFunc() {

	if ( animationButton.disabled ) return;

	switch ( animationState ) {

		case ANIM_STOPPED:
			startAnimation();
			break;

		case ANIM_CONSTRUCTING:
			if ( timeFactor === 0 ) resumeAnimation( pausedTimeFactor );
			else pauseAnimation();
			break;

		default:
			break;

	}

}

function startAnimation() {

	if ( animationState !== ANIM_STOPPED ) return;

	const disableAnimButton = ! animationCreated;

	const sel = selectionIsEmpty() ? null : selection[ 0 ];
	if ( ! animationCreated ) {

		if ( getPartModel( sel ) !== sel ) return;

		animatedModel = sel;

		createAnimation();

		time = 0;
		timeNextState = 5;
		animationState = ANIM_FALLING;

	}
	else {

		//reenablePhysics();
		beginConstruction();

	}

	timeFactor = Math.abs( timeFactor );
	pausedTimeFactor = timeFactor;
	guiData.timeFactor = timeFactor;
	timeFactorController.updateDisplay();
	pauseOnNextStep = false;
	pauseOnNextStepStep = - 1;

	animationButton.innerHTML = iconEmojis[ "Pause" ];
	if ( disableAnimButton ) {

		setButtonDisabled( animationButton, true );
		setButtonDisabled( stopAnimButton, false );

	}

	animate();

}

function stopAnimation() {

	if ( stopAnimButton.disabled ) return;

	if ( ! animationCreated ) return;

	animationCreated = false;
	animationState = ANIM_STOPPED;

	time = 0;
	timeFactor = 1;
	guiData.timeFactor = timeFactor;
	timeFactorController.updateDisplay();

	animationButton.innerHTML = iconEmojis[ "Play" ];
	setButtonDisabled( animationButton, false );
	setButtonDisabled( stopAnimButton, true );

	guiData.constructionStep = 1;
	constructionStepController.updateDisplay();
	constructionStepController.disable();

	if ( animatedParts ) {

		for ( let i in animatedParts ) {

			const part = animatedParts[ i ];
			scene.remove( part );
			physicsWorld.removeRigidBody( part.userData.physicsBody );

		}

	}

	models.push( animatedModel );
	scene.add( animatedModel );
	selectParts( [ animatedModel ] );
	animatedModel = null;

	animatedModel = null;
	animatedParts = null;
	animatedParts = null;
	dynamicObjects = [];

	triggerRender();

}

function pauseAnimation() {

	if ( animationState !== ANIM_CONSTRUCTING || timeFactor === 0 ) return false;

	pausedTimeFactor = timeFactor;
	timeFactor = 0;

	animationButton.innerHTML = iconEmojis[ "Play" ];
	guiData.timeFactor = timeFactor;
	timeFactorController.updateDisplay();

	return true;

}

function resumeAnimation( timeFactorParam ) {

	if ( animationState === ANIM_CONSTRUCTING ) animationButton.innerHTML = iconEmojis[ "Pause" ];

	timeFactor = timeFactorParam;

	guiData.timeFactor = timeFactor;
	timeFactorController.updateDisplay();

	return true;

}

function animationGoToStep( constructionStep, finishChange ) {

	if ( animationState !== ANIM_CONSTRUCTING ) return;

	constructionStep = Math.max( 0, Math.min( animatedParts.length, constructionStep ) );

	time = getTimeByStep( constructionStep + 1 );

	for ( let i in animatedParts ) {

		positionPart( animatedParts[ i ], time );

	}

	if ( finishChange && constructionStep >= animatedParts.length - 1 ) {

		animationState = ANIM_STOPPED;
		timeFactor = pausedTimeFactor;
		animationButton.innerHTML = iconEmojis[ "Play" ];
		constructionStepController.disable();
		guiData.timeFactor = timeFactor;
		timeFactorController.updateDisplay();

	}

}

function getStepByTime( t ) {

	return Math.max( 0, Math.min( animatedParts.length - 1, Math.floor( t / stepDuration ) ) );

}

function getTimeByStep( s ) {

	return s * stepDuration;

}

function goToPrevStep() {

	if ( prevStepButton.disabled ) return;

	if ( ! animatedParts || animatedParts.length === 0 ) return;

	const remTime = time - Math.floor( time / stepDuration ) * stepDuration;
	const rem = remTime / stepDuration;
	let firstHalf = rem < 0.5 && remTime > 0;
	const newStep = Math.max( 0, Math.min( animatedParts.length - 1, getStepByTime( time ) - 1 ) );

	time = getTimeByStep( newStep );
	for ( let i in animatedParts ) {

		positionPart( animatedParts[ i ], time );

	}

	animationState = ANIM_CONSTRUCTING;

	constructionStepController.enable();

}

function goToNextStep() {

	if ( nextStepButton.disabled ) return;

	if ( ! animatedParts || animatedParts.length === 0 ) return;

	const remTime = time - Math.floor( time / stepDuration ) * stepDuration;
	const rem = remTime / stepDuration;
	let firstHalf = rem < 0.5 && remTime > 0;
	const newStep = Math.max( 0, Math.min( animatedParts.length, Math.floor( time / stepDuration ) + 1 ) );

	time = getTimeByStep( newStep );
	for ( let i in animatedParts ) {

		positionPart( animatedParts[ i ], time );

	}

	animationState = ANIM_CONSTRUCTING;

	constructionStepController.enable();

}

function createAnimation() {

	selectParts( null );
	scene.remove( animatedModel );
	const iAnimModel = models.indexOf( animatedModel );
	if ( iAnimModel >= 0 ) models.splice( iAnimModel, 1 );

	animationCreated = true;

	animatedParts = animatedModel.children.slice();

	animatedModel.updateMatrixWorld( true );

	meanPos.set( 0, 0, 0 );

	for ( let i in animatedParts ) {

		const partOrig = animatedParts[ i ];
		const part = partOrig.clone();
		animatedParts[ i ] = part;
		part.userData.type = partOrig.userData.type;
		part.userData.numConstructionSteps = partOrig.userData.numConstructionSteps;
		part.userData.constructionStep = partOrig.userData.constructionStep;
		part.userData.fileName = partOrig.userData.fileName;
		part.userData.colorCode = partOrig.userData.colorCode;
		part.userData.isAnimatedPart = true;

		matrix4Temp1.copy( part.matrixWorld );
		part.removeFromParent();

		part.position.set( 0, 0, 0 );
		part.quaternion.set( 0, 0, 0, 1 );
		part.updateMatrixWorld( true );
		const bbox = new THREE.Box3().setFromObject( part );
		bbox.getSize( vector3Temp1 );
		const sx = vector3Temp1.x;
		const sy = vector3Temp1.y;
		const sz = vector3Temp1.z;
		const objectSize = sx > sy ? ( sz > sx ? sz : sx ) : ( sz > sy ? sz : sy );
		part.userData.objectSize = objectSize;
		part.userData.sx = sx;
		part.userData.sy = sy;
		part.userData.sz = sz;
		part.userData.bbox = bbox;

		matrix4Temp1.decompose( part.position, part.quaternion, part.scale );
		part.userData.partPosition = new THREE.Vector3().copy( part.position );
		part.userData.partQuaternion = new THREE.Quaternion().copy( part.quaternion );
		part.userData.positionStart = new THREE.Vector3();
		part.userData.positionEnd = new THREE.Vector3();
		part.userData.quaternionStart = new THREE.Quaternion();

		meanPos.add( part.userData.partPosition );

		//placePartRandomly( part, objectSize * 5 );

	}

	const fileNumConstructionSteps = animatedModel.userData.numConstructionSteps;

	if ( animatedParts.length > 0 ) {

		meanPos.multiplyScalar( 1 / animatedParts.length );

	}

	meanPos.z -= 2.1 * animatedModel.userData.modelDiameter;

	for ( let p in animatedParts ) {

		const part = animatedParts[ p ];

		part.position.add( meanPos );
		part.position.y += meanPos.y * 2;

		const physicsShape = new Ammo.btBoxShape(
			new Ammo.btVector3(
				part.userData.sx * 0.5,
				part.userData.sy * 0.5,
				part.userData.sz * 0.5
			)
		);

		physicsShape.setMargin( part.userData.objectSize * 0.01 );
		const mass = Math.pow( 10 * part.userData.objectSize, 2.2 );
		createRigidBody( part, physicsShape, mass );
		part.userData.physicsControlled = true;

		scene.add( part );

	}

	// Sort parts

	if ( fileNumConstructionSteps === 1 ) {

		sortParts( animatedParts );

	}

	const stepsParts = [];
	for ( let p in animatedParts ) {

		const part = animatedParts[ p ];

		let constructionStep = p;
		if ( fileNumConstructionSteps > 1 ) constructionStep = part.userData.constructionStep;
		part.userData.constructionStep = constructionStep;

		if ( ! stepsParts[ constructionStep ] ) stepsParts[ constructionStep ] = [];
		stepsParts[ constructionStep ].push( part );

	}

	if ( fileNumConstructionSteps > 1 ) {

		let cs = 0;
		for ( let sp in stepsParts ) {

			const stepParts = stepsParts[ sp ];

			sortParts( stepParts );

			for ( let p in stepParts ) {

				const part = stepParts[ p ];
				part.userData.constructionStep = cs ++;

			}

		}

		animatedParts.sort( ( a, b ) => {

			const sa = a.constructionStep;
			const sb = b.constructionStep;

			return sa === sb ? 0 : ( sa < sb ? - 1 : 1 );

		} );

	}

	constructionDuration = stepDuration * animatedParts.length;
	constructionStepController.min( 1 ).max( animatedParts.length );

}

function sortParts( partsArray ) {

	partsArray.sort( ( a, b ) => {

		const ay = - a.userData.bbox.max.y + a.position.y;
		const by = - b.userData.bbox.max.y + b.position.y;

		return ay === by ? 0 : ( ay < by ? - 1 : 1 );


	} );

}

function handleAnimation( deltaTime ) {

	if ( ! animatedParts ) return;

	switch ( animationState ) {

		case ANIM_FALLING:
			if ( time >= timeNextState ) {

				beginConstruction();
				animParts( deltaTime );
				setButtonDisabled( animationButton, false );
				setButtonDisabled( stopAnimButton, false );
				setButtonDisabled( prevStepButton, false );
				setButtonDisabled( nextStepButton, false );

			}
			break;

		case ANIM_CONSTRUCTING:
			animParts( deltaTime );
			break;

		default:
			break;

	}

}

function beginConstruction() {

	time = 0;
	animationState = ANIM_CONSTRUCTING;

	for ( let i in animatedParts ) {

		positionPart( animatedParts[ i ], time );

	}

	constructionStepController.enable();

}

function animParts( deltaTime ) {

	let timeNextStep = time + deltaTime;

	if ( ( deltaTime > 0 && time >= constructionDuration ) || ( deltaTime < 0 && time <= 0 ) ) {

		animationState = ANIM_STOPPED;
		time = deltaTime > 0 ? constructionDuration : 0;
		timeNextStep = time;
		animationButton.innerHTML = iconEmojis[ "Play" ];
		constructionStepController.disable();

	}

	let currentConstructionStep = getStepByTime( time );
	let nextConstructionStep = getStepByTime( timeNextStep );
	let displayConstructionStep = currentConstructionStep;

	if ( Math.sign( nextConstructionStep - currentConstructionStep ) >= 0 ) {

		currentConstructionStep = Math.max( 0, currentConstructionStep - 1 );
		nextConstructionStep = Math.min( animatedParts.length - 1, nextConstructionStep + 1 );

	}
	else {

		nextConstructionStep = Math.max( 0, nextConstructionStep - 1 );
		currentConstructionStep = Math.min( animatedParts.length - 1, currentConstructionStep + 1 );

	}

	const numSteps = Math.abs( currentConstructionStep - nextConstructionStep ) + 1;
	const stepsDir = Math.sign( nextConstructionStep - currentConstructionStep );
	const step0 = Math.min( currentConstructionStep, nextConstructionStep );

	let step = step0;
	for ( let i = 0; i < numSteps; i ++ ) {

		if ( step >= 0 && step <= animatedParts.length - 1 ) {

			positionPart( animatedParts[ step ], time );

		}

		step += stepsDir;

	}

	guiData.constructionStep = displayConstructionStep + 1;
	constructionStepController.updateDisplay();

}


function positionPart( part, t ) {

	if ( part.userData.physicsControlled ) {

		part.userData.positionStart.copy( part.position );
		part.userData.quaternionStart.copy( part.quaternion );
		part.userData.positionEnd.copy( part.userData.partPosition );

		physicsWorld.removeRigidBody( part.userData.physicsBody );
		dynamicObjects.splice( dynamicObjects.indexOf( part ), 1 );

		part.userData.physicsControlled = false;

	}

	const step = getStepByTime( t );

	let tClamped;

	if ( step > part.userData.constructionStep ) tClamped = 1;
	else if ( step < part.userData.constructionStep ) tClamped = 0;
	else tClamped = Math.min( 1, Math.max( 0, ( t - getTimeByStep( step ) ) / stepDuration ) );

	curve.getPoint( tClamped, vector3Temp1 );
	const tCurve = vector3Temp1.y;

	vector3Temp1.lerpVectors( part.userData.positionStart, part.userData.positionEnd, tCurve );
	vector3Temp2.subVectors( part.userData.positionEnd, part.userData.positionStart );
	const d = vector3Temp2.length();
	const y = d * ( - Math.pow( tCurve - 0.5, 2 ) + 0.25 );

	part.position.copy( vector3Temp1 );
	part.position.y += y;

	part.quaternion.slerpQuaternions( part.userData.quaternionStart, part.userData.partQuaternion, tCurve );

	if ( ( selection.includes( part ) ) && selectedPartBoxHelper ) selectedPartBoxHelper.update();

}

function getModelsDataBase( constructionSet, onLoaded ) {

	const loader = new THREE.FileLoader();
	loader.load( getModelPath( constructionSet ) + 'models.json', ( content ) => {

		const dataBase = JSON.parse( content );

		onLoaded( dataBase );

	} );

}

function getLibraryPath( constructionSet ) {

	return ldrawPath + constructionSet + '/';

}

function getModelPath( constructionSet ) {

	return ldrawPath + constructionSet + '/models/';

}

function onWindowResize() {

	const w = getViewPortWidth();

	camera.aspect = w / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( w, window.innerHeight );

	triggerRender();

}

function getViewPortWidth() {

	return Math.max( 1, window.innerWidth - ( guiCreated ? GUI_WIDTH + 17: 0 ) );

}

function createGUI() {

	if ( guiCreated ) {

		gui.destroy();
		gui2.destroy();
		infoFolder.destroy();
		optionsFolder.destroy();
		exportFolder.destroy();
		gui3.destroy();

	}

	if ( scrolledDiv && container.contains( scrolledDiv ) ) container.removeChild( scrolledDiv );

	if ( partPreview && container.contains( partPreview.div ) ) container.removeChild( partPreview.div );


	sideBarDiv = document.createElement( 'div' );
	scrolledDiv = createScrolledDiv( sideBarDiv );
	scrolledDiv.style.position = 'absolute';
	scrolledDiv.style.top = '0px';
	scrolledDiv.style.right = '0px';
	scrolledDiv.style.height = '100%';
	scrolledDiv.style.background = '#000000';
	container.appendChild( scrolledDiv );



	const firstPanel = document.createElement( 'div' );
	sideBarDiv.appendChild( firstPanel );

	const fileDiv = document.createElement( 'div' );
	fileDiv.className = 'playbackdiv';
	firstPanel.appendChild( fileDiv );

	const addModelButton = document.createElement( 'div' );
	addModelButton.className = 'buttn iconbtn';
	addModelButton.innerHTML = iconEmojis[ "Plus" ] + iconEmojis[ "Model" ];
	addModelButton.title = "Add LDraw model from repository...";
	addModelButton.addEventListener( 'click', showSelectLDrawModelFromRepo );
	fileDiv.appendChild( addModelButton );

	const addFromFileButton = document.createElement( 'div' );
	addFromFileButton.className = 'buttn iconbtn';
	addFromFileButton.innerHTML = iconEmojis[ "Plus" ] + iconEmojis[ "File" ];
	addFromFileButton.title = "Add model from file (.ldr, .dat, .glb, .dae, .obj, .stl, .svg)...";
	addFromFileButton.addEventListener( 'click', showSelectFromFile );
	fileDiv.appendChild( addFromFileButton );

	const newModelButton = document.createElement( 'div' );
	newModelButton.className = 'buttn iconbtn';
	newModelButton.innerHTML = iconEmojis[ "Pin" ] + iconEmojis[ "Model" ];
	newModelButton.title = "Create new model...";
	newModelButton.addEventListener( 'click', createNewEmptyModel );
	newModelButton.hidden = true;
	fileDiv.appendChild( newModelButton );

	//gui = new GUI( { width: GUI_WIDTH, container: sideBarDiv } );
	//gui.title( "Main menu" );

	//const infoFolder = gui.addFolder( "Model info" );
	const infoFolder = new GUI( { width: GUI_WIDTH, container: sideBarDiv } );
	infoFolder.title( iconEmojis[ "Model" ] + " Model info" );

	modelTitleController = infoFolder.add( guiData, 'modelTitle' ).name( 'Title' );
	modelSeriesController = infoFolder.add( guiData, 'modelSeries' ).name( 'Series' );
	modelRefController = infoFolder.add( guiData, 'modelRef' ).name( 'Reference' );
	modelInfoURLController = infoFolder.add( guiData, 'modelInfoURL' ).name( 'Info URL' );
	pathController = infoFolder.add( guiData, 'path' ).name( 'File name' ).onFinishChange( () => {

		if ( ! selectionIsEmpty() ) {

			if ( guiData.path.indexOf( '.' ) < 0 ) {

				guiData.path += ".ldr";
				pathController.updateDisplay();
			}

			const model = getPartModel( selection[ 0 ] );
			if ( model ) model.userData.fileName = guiData.path;

		}

	} );
	fileAuthorController = infoFolder.add( guiData, 'fileAuthor' ).name( 'Author' ).onChange( () => {

		if ( selectionIsEmpty() ) {

			const model = getPartModel( selection[ 0 ] );
			if ( model ) model.userData.author = guiData.fileAuthor;

		}

	} );
	modelBboxInfoController = infoFolder.add( guiData, 'modelBboxInfo' ).name( 'Model bounds (mm)' );
	showBOMController = infoFolder.add( guiData, 'showBOM' ).name( 'Model parts list...' );
	infoFolder.close();

	//const optionsFolder = gui.addFolder( "Options" );
	const optionsFolder = new GUI( { width: GUI_WIDTH, container: sideBarDiv } );
	optionsFolder.title( iconEmojis[ 'Gear' ] + " Options" );

	optionsFolder.addColor( guiData, 'mainColor' ).name( 'Main color' ).onChange( () => {

		const mainMat = lDrawLoader.getMainMaterial();
		mainMat.color.setRGB( guiData.mainColor.r, guiData.mainColor.g, guiData.mainColor.b );
		setOption( 'mainColor.r', mainMat.color.r );
		setOption( 'mainColor.g', mainMat.color.g );
		setOption( 'mainColor.b', mainMat.color.b );

		triggerRender();

	} );

	optionsFolder.addColor( guiData, 'mainEdgeColor' ).name( 'Main edge color' ).onChange( () => {

		const mainMat = lDrawLoader.getMainMaterial();
		//const mainEdgeMat = lDrawLoader.getMainEdgeMaterial();
		const mainEdgeMat = mainMat.userData.edgeMaterial;
		const mainEdgeCondMat = mainEdgeMat.userData.conditionalEdgeMaterial;
		mainEdgeMat.color.setRGB( guiData.mainEdgeColor.r, guiData.mainEdgeColor.g, guiData.mainEdgeColor.b );
		mainEdgeCondMat.color.setRGB( guiData.mainEdgeColor.r, guiData.mainEdgeColor.g, guiData.mainEdgeColor.b );
		setOption( 'mainEdgeColor.r', mainEdgeMat.color.r );
		setOption( 'mainEdgeColor.g', mainEdgeMat.color.g );
		setOption( 'mainEdgeColor.b', mainEdgeMat.color.b );

		triggerRender();

	} );

	optionsFolder.addColor( guiData, 'backgroundColor' ).name( 'Background color' ).onChange( () => {

		scene.background.setRGB( guiData.backgroundColor.r, guiData.backgroundColor.g, guiData.backgroundColor.b );

		triggerRender();

	} ).onFinishChange( () => {

		setOption( 'backgroundColor.r', guiData.backgroundColor.r );
		setOption( 'backgroundColor.g', guiData.backgroundColor.g );
		setOption( 'backgroundColor.b', guiData.backgroundColor.b );

		triggerRender();

	} );

	optionsFolder.add( guiData, 'displayLines' ).name( 'Display Lines' ).onChange( () => {

		setOption( 'displayLines', guiData.displayLines );

		updateObjectsVisibility();

		triggerRender();

	} );

	const generateThumbnailsController = optionsFolder.add( guiData, 'generatePartsThumnbnails' ).name( 'Generate all parts thumbnails...' );

	optionsFolder.close();


	//const exportFolder = gui.addFolder( "Export" );
	const exportFolder = new GUI( { width: GUI_WIDTH, container: sideBarDiv } );
	exportFolder.title( iconEmojis[ "Floppy" ] + " Export" );

	exportFolder.add( guiData, 'exportScale' ).name( 'Export scale' ).onChange( () => {

		setOption( 'exportScale', guiData.exportScale );

	} );
	exportFolder.add( guiData, 'exportGLTF' ).name( 'Export to GLTF (.glb)...' );
	exportFolder.add( guiData, 'exportDAE' ).name( 'Export to Collada (.dae)...' );
	exportFolder.add( guiData, 'exportOBJ' ).name( 'Export to OBJ (.obj)...' );

	exportFolder.close();



	const secondPanel = document.createElement( 'div' );
	sideBarDiv.appendChild( secondPanel );


	gui2 = new GUI( { width: GUI_WIDTH, container: secondPanel } );
	gui2.title( iconEmojis[ "Animation" ] + " Animation" );

	constructionStepController = gui2.add( guiData, 'constructionStep', 1, 1 ).step( 1 ).name( 'Construction step' ).onChange( () => {

		pauseAnimation();

		animationGoToStep( guiData.constructionStep - 1 );

	} ).onFinishChange( () => {

		pauseAnimation();

		animationGoToStep( guiData.constructionStep - 1, true );

	} );
	constructionStepController.disable();

	timeFactorController = gui2.add( guiData, 'timeFactor', - 5, 5 ).name( 'Time factor' ).onChange( () => {

		resumeAnimation( guiData.timeFactor );

	} );

	const playbackPanel = document.createElement( 'div' );
	playbackPanel.id = 'idbuttns';
	//playbackPanel.className = 'playbackpanel';
	secondPanel.appendChild( playbackPanel );

	const playbackDiv = document.createElement( 'div' );
	playbackDiv.className = 'playbackdiv';
	playbackPanel.appendChild( playbackDiv );

	animationButton = document.createElement( 'div' );
	animationButton.className = 'buttn animbtn';
	animationButton.innerHTML = iconEmojis[ "Play" ];
	animationButton.title = "Play/pause (Spacebar)";
	animationButton.addEventListener( 'click', animationButtonFunc );
	setButtonDisabled( animationButton, true );

	stopAnimButton = document.createElement( 'div' );
	stopAnimButton.className = 'buttn stopbtn';
	stopAnimButton.innerHTML = iconEmojis[ "Stop" ];;
	stopAnimButton.title = "Stop animation";
	stopAnimButton.addEventListener( 'click', stopAnimation );
	setButtonDisabled( stopAnimButton, true );

	prevStepButton = document.createElement( 'div' );
	prevStepButton.className = 'buttn prevbtn';
	prevStepButton.innerHTML = iconEmojis[ "Previous" ];;
	prevStepButton.title = "Previous step (Cursor left)";
	prevStepButton.addEventListener( 'click', goToPrevStep );
	setButtonDisabled( prevStepButton, true );

	nextStepButton = document.createElement( 'div' );
	nextStepButton.className = 'buttn nextbtn';
	nextStepButton.innerHTML = iconEmojis[ "Next" ];;
	nextStepButton.title = "Next step (Cursor right)";
	nextStepButton.addEventListener( 'click', goToNextStep );
	setButtonDisabled( nextStepButton, true );

	playbackDiv.appendChild( prevStepButton  );
	playbackDiv.appendChild( animationButton );
	playbackDiv.appendChild( stopAnimButton );
	playbackDiv.appendChild( nextStepButton );



	const editorPanel = document.createElement( 'div' );
	//editorPanel.id = 'idbuttns';
	//editorPanel.className = 'playbackpanel';
	editorPanel.hidden = true;


	const selectionDiv = document.createElement( 'div' );
	selectionDiv.className = 'playbackdiv';
	secondPanel.appendChild( selectionDiv );

	secondPanel.appendChild( editorPanel );


	const centerViewButton = document.createElement( 'div' );
	centerViewButton.className = 'buttn';
	centerViewButton.innerHTML = iconEmojis[ "Center" ];
	centerViewButton.title = "Center view on selection (v)";
	centerViewButton.addEventListener( 'click', centerCameraInObject );
	selectionDiv.appendChild( centerViewButton );

	selectionModePartButton = document.createElement( 'div' );
	selectionModeModelButton = document.createElement( 'div' );

	selectionModePartButton.className = 'buttn';
	selectionModePartButton.innerHTML = "Part";
	selectionModePartButton.title = "Selection mode: Part";
	selectionModePartButton.addEventListener( 'click', selectionModePartFunc );
	function selectionModePartFunc() {

		if ( selectionModePartButton.disabled ) return;

		selectionModeModel = false;
		selectParts( null );
		setButtonDisabled( selectionModePartButton, true );
		setButtonDisabled( selectionModeModelButton, false );

		triggerRender();

	}
	setButtonDisabled( selectionModePartButton, ! selectionModeModel );

	selectionModeModelButton.className = 'buttn';
	selectionModeModelButton.innerHTML = "Model";
	selectionModeModelButton.title = "Selection mode: Model";
	selectionModeModelButton.addEventListener( 'click', selectionModeModelFunc );
	function selectionModeModelFunc() {

		if ( selectionModeModelButton.disabled ) return;

		selectionModeModel = true;
		selectParts( [ getPartModel( selectionIsEmpty ? null : selection[ 0 ] ) ] );
		if ( ! selectionIsEmpty() ) selectedPartBoxHelper.update();
		setButtonDisabled( selectionModePartButton, false );
		setButtonDisabled( selectionModeModelButton, true );

		triggerRender();

	}

	setButtonDisabled( selectionModeModelButton, selectionModeModel );

	selectionDiv.appendChild( selectionModePartButton );
	selectionDiv.appendChild( selectionModeModelButton );


	const editorDiv = document.createElement( 'div' );
	//editorDiv.className = 'playbackdiv';
	editorPanel.appendChild( editorDiv );



	toolButtons = [ null ];

	const toolsDiv = document.createElement( 'div' );
	toolsDiv.className = 'playbackdiv';
	editorPanel.appendChild( toolsDiv );

	const toolColorButton = document.createElement( 'div' );
	toolColorButton.className = 'buttn iconbtn';
	toolColorButton.innerHTML = iconEmojis[ "Color" ];
	toolColorButton.title = "Select color (c)";
	toolColorButton.addEventListener( 'click', colorToolButtonFunc );
	toolsDiv.appendChild( toolColorButton );

	const toolMoveButton = document.createElement( 'div' );
	toolMoveButton.className = 'buttn iconbtn';
	toolMoveButton.innerHTML = iconEmojis[ "Move" ];
	toolMoveButton.title = "Move tool (g)";
	toolMoveButton.addEventListener( 'click', moveToolButtonFunc );
	toolsDiv.appendChild( toolMoveButton );
	toolButtons.push( toolMoveButton );

	const toolRotateButton = document.createElement( 'div' );
	toolRotateButton.className = 'buttn iconbtn';
	toolRotateButton.innerHTML = iconEmojis[ "Rotate" ];
	toolRotateButton.title = "Rotate tool (r)";
	toolRotateButton.addEventListener( 'click', rotateToolButtonFunc );
	toolsDiv.appendChild( toolRotateButton );
	toolButtons.push( toolRotateButton );

	const toolScaleButton = document.createElement( 'div' );
	toolScaleButton.className = 'buttn iconbtn';
	toolScaleButton.innerHTML = iconEmojis[ "Scale" ];
	toolScaleButton.title = "Scale tool (s)";
	toolScaleButton.addEventListener( 'click', scaleToolButtonFunc );
	toolsDiv.appendChild( toolScaleButton );
	toolButtons.push( toolScaleButton );

	const toggleCoordinateSystemButton = document.createElement( 'div' );
	toggleCoordinateSystemButton.className = 'buttn iconbtn';
	toggleCoordinateSystemButton.innerHTML = iconEmojis[ "World" ];
	toggleCoordinateSystemButton.title = "Toggle Local/World coordinates (l)";
	toggleCoordinateSystemButton.addEventListener( 'click', toggleCoordinateSystem );
	toolsDiv.appendChild( toggleCoordinateSystemButton );



	const tools2Div = document.createElement( 'div' );
	tools2Div.className = 'playbackdiv';
	editorPanel.appendChild( tools2Div );

	addPartButton = document.createElement( 'div' );
	addPartButton.className = 'buttn iconbtn';
	addPartButton.innerHTML = iconEmojis[ "Plus" ] + iconEmojis[ "Part" ];
	addPartButton.title = "Add LDraw part to selected model...";
	addPartButton.addEventListener( 'click', showSelectAddLDrawPart );
	setButtonDisabled( addPartButton, true );
	tools2Div.appendChild( addPartButton );

	cloneButton = document.createElement( 'div' );
	cloneButton.className = 'buttn iconbtn';
	cloneButton.innerHTML = iconEmojis[ "Clone" ];
	cloneButton.title = "Clone selection (n)";
	cloneButton.addEventListener( 'click', cloneSelection );
	setButtonDisabled( cloneButton, true );
	tools2Div.appendChild( cloneButton );

	const undoButton = document.createElement( 'div' );
	undoButton.className = 'buttn iconbtn';
	undoButton.innerHTML = iconEmojis[ "Undo" ];
	undoButton.title = "Undo (Ctrl-z or u) (not implemented yet)";
	undoButton.addEventListener( 'click', undo );
	setButtonDisabled( undoButton, true );
	tools2Div.appendChild( undoButton );

	const redoButton = document.createElement( 'div' );
	redoButton.className = 'buttn iconbtn';
	redoButton.innerHTML = iconEmojis[ "Redo" ];
	redoButton.title = "Redo (Shift-Ctrl-z or Shift-u) (not implemented yet)";
	redoButton.addEventListener( 'click', redo );
	setButtonDisabled( redoButton, true );
	tools2Div.appendChild( redoButton );

	deleteSelectionButton = document.createElement( 'div' );
	deleteSelectionButton.className = 'buttn iconbtn';
	deleteSelectionButton.innerHTML = iconEmojis[ "TrashBin" ];
	deleteSelectionButton.title = "Delete selection (Del)";
	deleteSelectionButton.addEventListener( 'click', deleteSelection );
	setButtonDisabled( deleteSelectionButton, true );
	tools2Div.appendChild( deleteSelectionButton );


	const tools3Div = document.createElement( 'div' );
	tools3Div.className = 'playbackdiv';
	editorPanel.appendChild( tools3Div );

	saveLDrawButton = document.createElement( 'div' );
	saveLDrawButton.className = 'buttn';
	saveLDrawButton.innerHTML = iconEmojis[ "Floppy" ] + iconEmojis[ "Model" ];
	saveLDrawButton.title = "Save selected model (LDraw format)...";
	saveLDrawButton.addEventListener( 'click', saveModelAsLDrawButtonFunc );
	tools3Div.appendChild( saveLDrawButton );

	const saveTNTButton = document.createElement( 'div' );
	saveTNTButton.className = 'buttn';
	saveTNTButton.innerHTML = iconEmojis[ "Floppy" ] + iconEmojis[ "TNT" ];
	saveTNTButton.title = "Save scene (.tnte format)... (not implemented yet)";
	saveTNTButton.addEventListener( 'click', saveSceneAsTNTButtonFunc );
	setButtonDisabled( saveTNTButton, true );
	tools3Div.appendChild( saveTNTButton );

	const tools4Div = document.createElement( 'div' );
	tools4Div.className = 'playbackdiv';
	editorPanel.appendChild( tools4Div );

	editMenu = createMenu(
		"Edit menu",
		"EditMenu",
		tools4Div,
		[
			'Select pieces of same color (and model)',
			'Select pieces of same type (and model)',
			'Select pieces of same type and color (and model)',
			'Copy position and rotation of model/part to internal clipboard',
			'Paste position of models/parts from internal clipboard',
			'Paste rotation and scale of models/parts from internal clipboard',
			'Paste position and rotation of models/parts from internal clipboard'
			//'Append selection to another model'
		],
		( option ) => {

			switch ( editMenu.options.indexOf( option ) ) {

				case 0:
					selectSimilarPieces( true, false );
					break;

				case 1:
					selectSimilarPieces( false, true );
					break;

				case 2:
					selectSimilarPieces( true, true );
					break;

				case 3:
					clipboardStore( CLIPBOARD_POSITION );
					break;

				case 4:
					clipboardRestore( CLIPBOARD_POSITION );
					break;

				case 5:
					clipboardRestore( CLIPBOARD_ROTATION );
					break;

				case 6:
					clipboardRestore( CLIPBOARD_POSITION | CLIPBOARD_ROTATION );
					break;

				case 7:
					appendSelectionToModel();
					break;			}

		}
	);

	gui3 = new GUI( { width: GUI_WIDTH, container: editorPanel } );
	gui3.title( iconEmojis[ "Ruler" ] + " Grid" );
	gui3.add( guiData, 'translationSnap' ).name( 'Horizontal snap' ).onChange( () => {
		setFineSnap( false );
		setOption( 'horizontalTranslationSnap', guiData.translationSnap );
	} );
	gui3.add( guiData, 'translationSnapVertical' ).name( 'Vertical snap' ).onChange( () => {
		setFineSnap( false );
		setOption( 'verticalTranslationSnap', guiData.translationSnapVertical );
	} );
	gui3.add( guiData, 'rotationSnap' ).name( 'Rotation snap' ).onChange( () => {
		setFineSnap( false );
		setOption( 'rotationSnap', guiData.rotationSnap );
	} );
	gui3.add( guiData, 'scaleSnap' ).name( 'Scale snap' ).onChange( () => {
		setFineSnap( false );
		setOption( 'scaleSnap', guiData.scaleSnap );
	} );
	gui3.close();



	const viewerPanel = document.createElement( 'div' );
	viewerPanel.className = 'playbackdiv';
	secondPanel.appendChild( viewerPanel );

	const showEditorButton = document.createElement( 'div' );
	showEditorButton.className = 'buttn';
	showEditorButton.style.width = "150px";
	showEditorButton.innerHTML = "Show editor";
	showEditorButton.title = "Show editor controls";
	showEditorButton.addEventListener( 'click', () => {

		editorPanel.hidden = false;
		viewerPanel.hidden = true;
		showEditorButton.hidden = true;

		newModelButton.hidden = false;

	} );
	viewerPanel.appendChild( showEditorButton );




	const infoPanel = document.createElement( 'div' );
	secondPanel.appendChild( infoPanel );

	infoDiv = document.createElement( 'div' );
	infoDiv.style.color = '#A0B0C0';
	infoDiv.style.padding = '4px';

	/*
	infoDiv.style.position = 'absolute';
	infoDiv.style.bottom = '50px';
	infoDiv.style.left = '200px';
	infoDiv.style.width = '60%';
	*/
	infoPanel.appendChild( infoDiv );


	const tenteLogoDiv = document.createElement( 'div' );
	tenteLogoDiv.style.padding = '4px';
	const tenteLink = document.createElement( 'a' );
	tenteLink.innerHTML = 'TENTE Parts Library CC BY 4.0 by the community at tenteros.land';
	tenteLink.href = 'http://tenteros.land/foro/viewtopic.php?f=47&t=154';

	const p1 = document.createElement( 'p' );
	p1.appendChild( tenteLink );
	tenteLogoDiv.appendChild( p1 );
	infoPanel.appendChild( tenteLogoDiv );

	const ldrawLogoDiv = document.createElement( 'div' );
	ldrawLogoDiv.style.padding = '4px';
	const ldrawImageLink = document.createElement( 'a' );
	ldrawImageLink.innerHTML = '<img style="width: 145px" src="models/ldraw/LEGO/ldraw_org_logo/Stamp145.png">';
	ldrawImageLink.href = 'http://www.ldraw.org';
	const ldrawLink = document.createElement( 'a' );
	ldrawLink.innerHTML = 'This software uses the LDraw Parts Library';
	ldrawLink.href = 'http://www.ldraw.org';

	const p2 = document.createElement( 'p' );
	p2.appendChild( ldrawImageLink );
	const p3 = document.createElement( 'p' );
	p3.appendChild( ldrawLink );
	ldrawLogoDiv.appendChild( p2 );
	ldrawLogoDiv.appendChild( p3 );
	infoPanel.appendChild( ldrawLogoDiv );

	partPreview = createPartPreview( 256, 256, renderer, container );
	partPreview.div.hidden = true;

	guiCreated = true;

	onWindowResize();

}

function selectSimilarPieces( sameColor, sameType ) {

	if ( selectionModeModel ) {

		showUserMessage( "Please use this option in Part mode." );
		return;

	}

	if ( selection.length !== 1 ) {

		showUserMessage( "Please select only one model or part." );
		return;

	}

	const selectedPart = selection[ 0 ];

	const color = selectedPart.userData.colorCode;
	const fileName = selectedPart.userData.fileName;
	const model = getPartModel( selectedPart );

	if ( ! model ) return;

	const newSelection = [];

	model.traverse( ( child ) => {

		if ( isPart( child ) ) {

			if ( sameType ) {

				if ( child.userData.fileName !== fileName ) return;

			}

			if ( sameColor ) {

				if ( child.userData.colorCode !== color ) return;

			}

			newSelection.push( child );

		}

	} );

	selectParts( newSelection );
	triggerRender();

}

function clipboardStore() {

	if ( selection.length !== 1 ) {

		showUserMessage( "Please select only one model or part." );
		return;

	}

	const selected = selection[ 0 ];

	selected.updateMatrixWorld();
	clipboardMatrix.copy( selected.matrixWorld );
	clipboardType = CLIPBOARD_POSITION | CLIPBOARD_ROTATION;

	console.log( clipboardMatrix.elements );

}

function clipboardRestore( type ) {

	console.log( clipboardMatrix.elements );

	if ( clipboardType === CLIPBOARD_NONE ) return;

	if ( selection.length === 0 ) {

		showUserMessage( "Please select one or more models or parts." );
		return;

	}

	const targetParts = selection;

	selectTool( TOOL_NONE );

	const x = clipboardMatrix.elements[ 12 ];
	const y = clipboardMatrix.elements[ 13 ];
	const z = clipboardMatrix.elements[ 14 ];
	vector3Temp1.set( x, y, z );

	for ( let i = 0, l = targetParts.length; i < l; i ++ ) {

		const selected = targetParts[ i ];
		const parent = selected.parent;

		selected.worldToLocal( vector3Temp1 );

		switch ( type ) {

			case CLIPBOARD_POSITION | CLIPBOARD_ROTATION:

				if ( ! parent ) return;
				scene.attach( selected );
				clipboardMatrix.decompose( selected.position, selected.rotation, selected.scale );
				parent.attach( selected );
				break;

			case CLIPBOARD_POSITION:
				selected.position.set( vector3Temp1.x, vector3Temp1.y, vector3Temp1.z );
				break;

			case CLIPBOARD_ROTATION:

				if ( ! parent ) return;
				const px = selected.position.x;
				const py = selected.position.y;
				const pz = selected.position.z;
				scene.attach( selected );
				clipboardMatrix.decompose( selected.position, selected.rotation, selected.scale );
				parent.attach( selected );
				selected.position.set( px, py, pz );
				break;

		}

	}

	selectParts( selection );
	triggerRender();

}

function showBOM() {

	bomPanel = deleteSelectTable( bomPanel );

	const model = getPartModel( selectionIsEmpty() ? null : selection[ 0 ] );

	if ( ! model ) return;

	const columns = [
		'count',
		'name',
		'colorName',
		'link'
	];

	const columnsNames = [
		"Parts count",
		"Name",
		"Color",
		"View part"
	];

	const data = [];

	const differentParts = {};
	let totalParts = 0;

	for ( let i in model.children ) {

		const c = model.children[ i ];

		if ( ! c.isGroup ) continue;

		const part = c;

		if ( ! part ) continue;

		const dbPart = getDataBasePart( part );

		if ( ! dbPart ) continue;

		const colorCode = part.userData.colorCode;
		const colorName = part.userData.colorCode ? lDrawLoader.materialLibrary[ part.userData.colorCode ].name: "None";
		const hash = part.userData.fileName + '_'  + colorCode;

		if ( differentParts[ hash ] ) {

			differentParts[ hash ].count ++;

		}
		else {

			differentParts[ hash ] = {
				count: 1,
				name: dbPart.title,
				colorName: colorName,
				colorCode: colorCode,
				path: dbPart.path,
				link: '<a href="/TNTViewer/examples/tnt.html?modelPath=../parts/' + dbPart.path +
						'&colorCode=' + colorCode + '">View part</a>'
			};

		}

		totalParts ++;

	}

	const differentPartsHashes = Object.keys( differentParts );

	differentPartsHashes.sort( ( a, b ) => {

		const partA = differentParts[ a ];
		const partB = differentParts[ b ];

		function sortField( field, orderVal ) {

			if ( partA[ field ] === partB[ field ] ) return 0;
			return partA[ field ] < partB[ field ] ? - orderVal : orderVal;

		}

		const sortedByName = sortField( 'name', 1 );
		if ( sortedByName !== 0 ) return sortedByName;

		const sortedByColor = sortField( 'color', 1 );
		if ( sortedByColor !== 0 ) return sortedByColor;

		return sortField( 'count', - 1 );

	} );

	for ( let h in differentPartsHashes ) {

		const row = differentParts[ differentPartsHashes[ h ] ];

		data.push( row );

	}

	const infoLine = model.userData.fileName + ". " + totalParts + " parts, " + differentPartsHashes.length + " different.";

	function exportBOM() {

		let output = "";

		for ( let h in differentPartsHashes ) {

			const part = differentParts[ differentPartsHashes[ h ] ];

			output += part.count + "\t";
			output += part.name + "\t";
			output += part.colorName + "\t";
			output += part.colorCode + "\t";
			output += part.path + "\n";

		}

		FileOperations.saveFile( FileOperations.removeFilenameExtension( "BOM_" + model.userData.fileName ) + ".tsv", new Blob( [ output ] ) );

	}

	bomPanel = showSelectTable( 'Export to text file...', exportBOM, null, infoLine, columns, columnsNames, data );

}

function generatePartsThumnbnailsFunc() {

	updateProgressBar( 0 );
	showProgressBar()

const ii = dataBase.partsPathsList.indexOf( 'gruatamb.dat' );

	generatePartsThumnbnails( 128, 128, renderer, lDrawLoader, dataBase.partsPathsList, processPartOrModel,
		( fraction ) => {

			updateProgressBar( fraction );

		},
		( zipBlob ) => {

			hideProgressBar();
			FileOperations.saveFile( 'thumbnails.zip', zipBlob );

		}
	);

}

function showSelectLDrawModelFromRepo() {

	modelSelectPanel = deleteSelectTable( modelSelectPanel );

	const columns = [
		'title',
		'seriesNumber',
		'refNumber'
	];

	const columnsNames = [
		"Title",
		"Series",
		"Reference"
	];

	const data = [];

	for ( let i in dataBase.modelPathsList ) {

		data.push( dataBase.models[ dataBase.modelPathsList[ i ] ] );

	}
	/*
	data.sort( ( a, b ) => {

		function sortField( field, orderVal ) {

			if ( ( a[ field ] === null ) !== ( b[ field ] === null ) ) return b[ field ] === null ? - orderVal : orderVal;
			if ( a[ field ] === b[ field ] ) return 0;
			return a[ field ] < b[ field ] ? - orderVal : orderVal;

		}

		const sortedBySeries = sortField( 'seriesNumber', 1 );
		if ( sortedBySeries !== 0 ) return sortedBySeries;

		const sortedByReference = sortField( 'refNumber', 1 );
		if ( sortedByReference !== 0 ) return sortedByReference;

		return sortField( 'title', 1 );

	} );
	*/
	const infoLine = "Please select a model to load from the list. There are " + data.length + " models.";

	function onOK( rowIndex ) {

		selectedModelRowIndex = rowIndex;
		loadLDrawModelFromRepo( data[ rowIndex ].path, null, ( model ) => {

			// TODO revise camera repositioning and object apparent zoom
			const pos = model.userData.modelBbox.getCenter( vector3Temp1 );
			pos.y += model.position.y;
			setCamera( model, pos.x, pos.y, pos.z );

			setSelectionModeModel( true );
			selectParts( [ model ] );

			setFineSnap( false );

			updateObjectsVisibility();

			hideProgressBar();
			triggerRender();

		} );

	}

	modelSelectPanel = showSelectTable( 'Ok', onOK, null, infoLine, columns, columnsNames, data, true, selectedModelRowIndex, true, 1 );

}

function showSelectLDrawPartFromRepo( parentModel, onOK ) {

	partSelectPanel = deleteSelectTable( partSelectPanel );

	const columns = [
		'thumbnail',
		'mainCategory',
		'title',
		'path'
	];

	const columnsNames = [
		"Thumbnail",
		"Category",
		"Title",
		"File name"
	];

	const data = [];

	for ( let i in dataBase.partsPathsList ) {

		const p = dataBase.parts[ dataBase.partsPathsList[ i ] ];
		data.push( {
			thumbnail: '<img src="./models/ldraw/TENTE/partsThumbnails/' + FileOperations.removeFilenameExtension( p.path ) + '.png" width="128" height="128"></img>',
			mainCategory: p.mainCategory,
			title: p.title,
			path: p.path
		} );

	}

	data.sort( ( a, b ) => {

		if ( a[ 'mainCategory' ] !== b[ 'mainCategory' ] ) return a[ 'mainCategory' ] < b[ 'mainCategory' ] ? - 1 : 1;

		if ( a[ 'title' ] === b[ 'title' ] ) return 0;
		return a[ 'title' ] < b[ 'title' ] ? - 1 : 1;

	} );

	const infoLine = "Please select the part to add from the list.";

	function onSelectOK( rowIndex ) {

		selectedPartRowIndex = rowIndex;
		loadLDrawModelFromRepo( "../parts/" + data[ rowIndex ].path, parentModel, ( part ) => {

			partPreview.div.hidden = true;
			onOK( part );

		} );

	}

	function onCancel() {

		partPreview.div.hidden = true;

	}

	function onRowPreselected( rowIndex ) {

		lDrawLoader.load( "../parts/" + data[ rowIndex ].path, function ( part ) {

			processPartOrModel( part, true, true );
			partPreview.updatePart( part );
			partPreview.div.hidden = false;

		}, onProgress, onError );

	}

	partPreview.div.hidden = false;
	partSelectPanel = showSelectTable( 'Ok', onSelectOK, onCancel, infoLine, columns, columnsNames, data, true, selectedPartRowIndex, true, 1, onRowPreselected );

}

function createColorsData() {

	//const materialsCodes = Object.keys( lDrawLoader.materialLibrary );
	const materialsCodes = dataBase.colorsCodesList;

	const data = [];

	for ( let colorIndex in materialsCodes ) {

		const colorCode = materialsCodes[ colorIndex ];
		const mat = lDrawLoader.materialLibrary[ colorCode ];

		if ( ! mat ) {

			console.log( "MATERIAL NOT FOUND: " + colorCode );
			continue;

		}

		const rgb = mat.color.getHexString();
		const text = mat.transparent ? 'T' : '';
		const textColorRGB = new THREE.Color( 1 - mat.color.r, 1 - mat.color.g, 1 - mat.color.b ).getHexString();

		data.push( {
			color: '<div style="width: 50px; height: 25px; background-color: #' + rgb + '; color: #' + textColorRGB + '; ">' + text + '</div>',
			name: mat.name,
			code: colorCode
		} );

	}

	data.sort( ( a, b ) => {

		if ( parseInt( a[ 'code' ] ) === parseInt( b[ 'code' ] ) ) return 0;
		return parseInt( a[ 'code' ] ) < parseInt( b[ 'code' ] ) ? - 1 : 1;

	} );

	return data;

}

function searchColorIndex( colorCode ) {

	for ( let c in colorsData ) {

		const d = colorsData[ c ];

		if ( d.code === colorCode ) return c;

	}

	return - 1;
}

function showSelectLDrawColorCode( onResult ) {

	colorSelectPanel = deleteSelectTable( colorSelectPanel );

	const columns = [
		'color',
		'name',
		'code'
	];

	const columnsNames = [
		"Color",
		"Name",
		"Code"
	];

	const infoLine = "Please select a color from the list.";

	function onOK( rowIndex ) {

		selectedColorRowIndex = rowIndex;
		selectedColorCode = colorsData[ rowIndex ].code;

		onResult( selectedColorCode );
	}

	function onCancel() {

		onResult( null );

	}

	colorSelectPanel = showSelectTable( 'Ok', onOK, onCancel, infoLine, columns, columnsNames, colorsData, true, selectedColorRowIndex, true );

}

function deleteSelectTable( panel ) {

	//const containerElement = document.body;
	const containerElement = container;

	if ( panel ) {

		if ( containerElement.contains( panel.div ) ) containerElement.removeChild( panel.div );

	}

	return null;
}

function removeAccents( str ) {

	return str.replaceAll( 'á', 'a' ).replaceAll( 'Á', 'A' )
		.replaceAll( 'é', 'e' ).replaceAll( 'É', 'E' )
		.replaceAll( 'í', 'i' ).replaceAll( 'Í', 'I' )
		.replaceAll( 'ó', 'o' ).replaceAll( 'Ó', 'O' )
		.replaceAll( 'ú', 'u' ).replaceAll( 'Ú', 'U' )
		.replaceAll( 'ñ', 'n' ).replaceAll( 'Ñ', 'N' );

}

function showSelectTable( buttonLabel, onButtonClicked, onCloseCancel, infoLine, columns, columnsNames, data, rowSelection, preselectedRow, filterEnabled, categoryColumnIndex, onRowPreselected ) {

	//const containerElement = document.body;
	const containerElement = container;

	const listDiv = document.createElement( 'div' );
	listDiv.style.backgroundColor = 'black';
	listDiv.style.position = 'absolute';
	listDiv.style.top = '50%';
	listDiv.style.left = '50%';
	listDiv.style.borderWidth = '3px';
	listDiv.style.borderStyle = 'solid';
	listDiv.style.borderColor = 'black';
	listDiv.style.transform = 'translate(-50%, -50%)';

	const tableDiv = document.createElement( 'div' );
	tableDiv.style.height = '500px';
	listDiv.appendChild( createScrolledDiv( tableDiv ) );
	const table = document.createElement( 'table' );
	table.style.width = '800px';
	tableDiv.appendChild( table );

	const buttonsDiv = document.createElement( 'div' );
	listDiv.appendChild( buttonsDiv );

	const closeButton = document.createElement( 'button' );
	closeButton.innerHTML = rowSelection ? "Cancel" : "Close";
	closeButton.onclick = () => {

		lastOpenPanel = null;
		if ( containerElement.contains( listDiv ) ) containerElement.removeChild( listDiv );
		if ( onCloseCancel ) onCloseCancel();

	};
	buttonsDiv.appendChild( closeButton );

	let selectedRow = null;
	let selectedDataRow = null;

	let button = null;
	if ( buttonLabel ) {

		button = document.createElement( 'button' );
		button.innerHTML = buttonLabel;
		button.onclick = () => {

			onButtonClicked( selectedRow );

			if ( rowSelection ) closeButton.onclick();

		};
		buttonsDiv.appendChild( button );

		if ( rowSelection ) setButtonDisabled( button, true );

	}

	let filterEditBox;
	if ( filterEnabled ) {

		filterEditBox = document.createElement( 'input' );
		filterEditBox.type = 'text';
		filterEditBox.size = 15;
		filterEditBox.style.marginLeft = "15px";
		filterEditBox.placeholder = 'Type here to filter...';
		filterEditBox.addEventListener( 'input', () => {

			const filter = removeAccents( filterEditBox.value.toLowerCase() );
			applyFilter( filter );

		} );
		buttonsDiv.appendChild( filterEditBox );

		if ( categoryColumnIndex !== undefined ) {

			const listId = 'SelectTableFilter_' + Math.floor( Math.random() * 10000 );
			const items = [];
			for ( let r in data ) {

				const row = data[ r ];
				const item = "" + row[ columns[ categoryColumnIndex ] ];
				if ( items.indexOf( item ) < 0 ) items.push( item );

			}

			const dataList = createDataList( listId, items );
			buttonsDiv.appendChild( dataList );
			filterEditBox.setAttribute( 'list', listId );

		}

		function applyFilter( filter ) {

			for ( let r in tableDataRows ) {

				tableDataRows[ r ].filterText( filter );
			}
		}

	}

	const infoLineSpan = document.createElement( 'span' );
	infoLineSpan.style.paddingLeft = "15px";
	infoLineSpan.innerHTML = infoLine;
	buttonsDiv.appendChild( infoLineSpan );

	const tableHeaderRow = document.createElement( 'tr' );
	table.appendChild( tableHeaderRow );

	for ( let c in columns ) {

		const h = document.createElement( 'th' );
		h.innerHTML = columnsNames[ c ];
		tableHeaderRow.appendChild( h );

	}

	let preselectedDataRow = null;

	let tableDataRows = [];

	function createRow( index ) {

		function rowClicked() {

			function styleRow( dataRow, selected ) {

				for ( let i = 0, n = dataRow.children.length; i < n; i ++ ) {

					dataRow.children[ i ].style.color = selected ? 'cyan' : 'white';

				}

			}

			if ( selectedDataRow !== null ) {

				styleRow( selectedDataRow, false );

			}

			selectedRow = index;
			selectedDataRow = tableDataRow;

			styleRow( selectedDataRow, true );

			if ( button ) setButtonDisabled( button, false );

			if ( onRowPreselected ) onRowPreselected( selectedRow );

		}

		const row = data[ index ];
		const tableDataRow = document.createElement( 'tr' );

		let rowText = '';
		for ( let c in columns ) {

			const d = document.createElement( 'td' );
			const cellContent = "" + row[ columns[ c ] ];
			d.innerHTML = cellContent;
			rowText += cellContent + " ";
			tableDataRow.appendChild( d );

		}
		rowText = rowText.toLowerCase();

		tableDataRow.filterText = ( filter ) => {

			const filtered = removeAccents( rowText ).indexOf( filter ) < 0;

			tableDataRow.hidden = filtered;

		}

		if ( rowSelection ) {

			tableDataRow.addEventListener( 'click', rowClicked );
			tableDataRow.addEventListener( 'dblclick', () => {

				rowClicked();
				button.onclick();

			} );

			if ( index === preselectedRow ) {

				preselectedDataRow = tableDataRow;

			}

			tableDataRow.doClick = rowClicked;

		}

		table.appendChild( tableDataRow );
		tableDataRows.push( tableDataRow );

	}

	function selectPrevious() {

		let i = selectedRow;

		i --;

		if ( i < 0 ) i = tableDataRows.length - 1;

		while ( tableDataRows[ i ].hidden && i >= 0 ) i --;

		if ( i < 0 ) return;

		selectRow( i );

	}
	function selectNext() {

		let i = selectedRow;

		i ++;

		if ( i >= tableDataRows.length ) i = 0;

		while ( tableDataRows[ i ].hidden && i < tableDataRows.length ) i ++;

		if ( i >= tableDataRows.length ) return;

		selectRow( i );
	}

	function selectRow( index ) {

		tableDataRows[ index ].doClick();
		tableDataRows[ index ].scrollIntoView();

	}

	for ( let r = 0, n = data.length; r < n; r ++ ) createRow( r );

	containerElement.appendChild( listDiv );

	if ( rowSelection && preselectedDataRow ) {

		preselectedDataRow.doClick();
		preselectedDataRow.scrollIntoView();

	}

	if ( filterEnabled ) filterEditBox.focus();

	const panel = {
		panel: listDiv,
		button: button,
		closeButton: closeButton,
		selectPrevious: selectPrevious,
		selectNext: selectNext
	};

	lastOpenPanel = panel;

	return panel;

}

function createDataList( id, array ) {


	const dataList = document.createElement( 'datalist' );
	dataList.id = id;

	for ( let i in array ) {

		const option = document.createElement( 'option' );
		option.value = array[ i ];
		dataList.appendChild( option );

	}

	return dataList;

}

function createMenu( title, id, parent, options, callback ) {

	const button = document.createElement( 'input' );
	button.type = 'text';
	button.size = 15;
	button.style.marginLeft = "10px";
	button.placeholder = title;

	button.addEventListener( 'input', ( event ) => {

		const selectedOption = button.value;
		button.value = "";
		callback( selectedOption );

	} );

	parent.appendChild( button );

	const dataList = createDataList( id, options );
	parent.appendChild( dataList );
	button.setAttribute( 'list', id );

	return {
		button: button,
		options: options,
		destroy: () => {
			parent.removeChild( dataList );
			parent.removeChild( button );
		}	};

}

function createScrolledDiv( childDiv ) {

	// Creates a scrolled div. childDiv must be a div and will contain the scrolled content.

	var scrolledDiv = document.createElement( 'div' );

	scrolledDiv.style.overflowY = "scroll";

	scrolledDiv.appendChild( childDiv );

	return scrolledDiv;

}


function getOption( name, parse = true ) {

	const v = localStorage.getItem( name );

	if ( parse ) return JSON.parse( v );

	return v;

}

function isOptionSet( name ) {

	const v = localStorage.getItem( name );

	return v !== null;

}

function setOption( name, value ) {

	localStorage.setItem( name, value );

}

/*
function createOceanAndSky() {

	if ( water ) scene.remove( water );
	if ( sky ) scene.remove( sky );
	if ( sunSphere ) scene.remove( sunSphere );

	sun = new THREE.Vector3();
	sunColor = new THREE.Color();
	sunColor.r = 1;
	sunColor.g = 0.95;
	sunColor.b = 0.65;

	sunSphere = new THREE.Mesh(
		new THREE.SphereGeometry( 1000, 16, 8 ),
		new THREE.MeshStandardMaterial( { color: sunColor, emissive: 0xFFFFFF } )
	);
	scene.add( sunSphere );

	const waterGeometry = new THREE.PlaneGeometry( domeSize, domeSize );

	water = new Water(
		waterGeometry,
		{
			textureWidth: 512,
			textureHeight: 512,
			waterNormals: new THREE.TextureLoader().load( 'textures/waternormals.jpg', function ( texture ) {

				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

			} ),
			sunDirection: sun,
			sunColor: sunColor,
			waterColor: 0x001e0f,
			distortionScale: 3.7,
			fog: scene.fog !== undefined
		}
	);

	water.rotation.x = - Math.PI / 2;
	water.position.y = -500;

	scene.add( water );

	// Skybox

	sky = new Sky();
	sky.scale.setScalar( domeSize );
	scene.add( sky );

	const skyUniforms = sky.material.uniforms;

	skyUniforms[ 'turbidity' ].value = 10;
	skyUniforms[ 'rayleigh' ].value = 2;
	skyUniforms[ 'mieCoefficient' ].value = 0.005;
	skyUniforms[ 'mieDirectionalG' ].value = 0.8;

	const parameters = {
		elevation: 10,
		azimuth: 120
	};

	const pmremGenerator = new THREE.PMREMGenerator( renderer );

	function updateSun() {

		const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
		const theta = THREE.MathUtils.degToRad( parameters.azimuth );

		sun.setFromSphericalCoords( 1, phi, theta );

		sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
		water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

		scene.environment = pmremGenerator.fromScene( sky ).texture;

		sunSphere.position.copy( sun ).multiplyScalar( domeSize * 0.6 );

	}

	updateSun();

}
*/

//

function triggerRender() {

	if ( animationState === ANIM_STOPPED ) render();

}

function animate() {

	if ( animationState !== ANIM_STOPPED ) requestAnimationFrame( animate );

	render();

}

function render() {

	const deltaTime = clock.getDelta() * timeFactor;

	handleAnimation( deltaTime );

	//if ( water ) water.material.uniforms[ 'time' ].value += deltaTime;

	if ( animationState === ANIM_FALLING ) updatePhysics( Math.abs( deltaTime ) );

	renderer.render( scene, camera );

	time += deltaTime;

}

function onProgress( xhr ) {

	if ( xhr.lengthComputable ) {

		updateProgressBar( xhr.loaded / xhr.total );

		console.log( Math.round( xhr.loaded / xhr.total * 100, 2 ) + '% downloaded' );

	}

}

function onError( e ) {

	showUserMessage( 'Error loading model: ' + e );

}

function showUserMessage( message ) {

	console.log( message );
	progressBarDiv.innerText = message;
	showProgressBar();

}

function clearUserMessage( message ) {

	progressBarDiv.innerText = "";
	hideProgressBar();

}

function showProgressBar() {

	if ( ! container.contains( progressBarDiv ) ) container.appendChild( progressBarDiv );

}

function hideProgressBar() {

	if ( container.contains( progressBarDiv ) ) container.removeChild( progressBarDiv );

}

function updateProgressBar( fraction ) {

	progressBarDiv.innerText = 'Loading... ' + Math.round( fraction * 100, 2 ) + '%';

}
