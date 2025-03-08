import * as THREE from "three";
import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "./three/examples/jsm/loaders/DRACOLoader.js";
let camera, scene, renderer;
let mesh;

init();

function init() {
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
	camera.position.z = 2;

	scene = new THREE.Scene();

	// scene.background = new THREE.Color(0xf6eedc);
	scene.background = new THREE.TextureLoader().load("./img/night-sky.png");

	const texture = new THREE.TextureLoader().load("three/examples/textures/crate.gif");
	texture.colorSpace = THREE.SRGBColorSpace;

	const geometry = new THREE.BoxGeometry();
	const material = new THREE.MeshBasicMaterial({ map: texture });

	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	const dracoLoader = new DRACOLoader();
	dracoLoader.setDecoderPath("three/examples/jsm/libs/draco/");

	const loader = new GLTFLoader();
	loader.setDRACOLoader(dracoLoader);
	// loader.setPath("models/gltf/AVIFTest/");
	loader.load("./three/examples/models/gltf/AVIFTest/forest_house.glb", function (gltf) {
		scene.add(gltf.scene);

		render();
	});

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	// renderer.setAnimationLoop(animate);
	document.body.appendChild(renderer.domElement);

	//
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.addEventListener("change", render);
	controls.target.set(0, 2, 0);
	controls.update();

	window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	mesh.rotation.x += 0.005;
	mesh.rotation.y += 0.01;

	renderer.render(scene, camera);
}
function render() {
	renderer.render(scene, camera);
}
