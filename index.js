import * as THREE from "three";
import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "./three/examples/jsm/loaders/DRACOLoader.js";
import { OBJLoader } from "./three/examples/jsm/loaders/OBJLoader.js";

let camera, scene, renderer, island, controls, house;
let forestHouse; // Переменная для модели дома
let houseBoundingBox = new THREE.Box3(); // Границы дома
init();

function init() {
	// Создание сцены
	scene = new THREE.Scene();

	// Фон ближе
	const bgTexture = new THREE.TextureLoader().load("./img/night-sky.png");
	bgTexture.wrapS = bgTexture.wrapT = THREE.RepeatWrapping;
	scene.background = bgTexture;

	// Камера
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
	camera.position.set(0, 10, 20);

	// Освещение
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
	scene.add(ambientLight);
	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(10, 20, 10);
	scene.add(directionalLight);

	// Создание острова
	const textureLoader = new THREE.TextureLoader();
	const islandTexture = textureLoader.load("./img/i.jpg");
	const islandGeometry = new THREE.CylinderGeometry(25, 26, 5, 64);
	const islandMaterial = new THREE.MeshStandardMaterial({ map: islandTexture, depthTest: true });
	island = new THREE.Mesh(islandGeometry, islandMaterial);
	island.position.set(0, 2.5, 0);
	island.receiveShadow = true;
	island.castShadow = true;
	scene.add(island);

	// Рендерер
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	// Управление камерой
	controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 2.5, 0);
	controls.enableRotate = false; // Отключаем вращение камеры
	controls.enablePan = true; // Включаем перемещение по карте
	controls.screenSpacePanning = false; // Двигаем по плоскости
	controls.maxPolarAngle = Math.PI / 3; // Фиксируем угол обзора
	controls.minDistance = 10; // Минимальное приближение
	controls.maxDistance = 300; // Увеличиваем максимальное отдаление, чтобы остров не исчезал

	controls.update();

	// Загрузка моделей
	loadModels();

	window.addEventListener("resize", onWindowResize);
	window.addEventListener("click", onIslandClick);
	renderer.setAnimationLoop(animate);
}

function loadModels() {
	const dracoLoader = new DRACOLoader();
	dracoLoader.setDecoderPath("three/examples/jsm/libs/draco/");
	const loader = new GLTFLoader();
	loader.setDRACOLoader(dracoLoader);

	loader.load("./three/examples/models/gltf/AVIFTest/forest_house.glb", function (gltf) {
		gltf.scene.position.set(0, 5, 0);
		house = gltf.scene;
		scene.add(house);
	});

	const objLoader = new OBJLoader();
	objLoader.load("./three/examples/models/Cartoon_house_low_poly_OBJ.obj", (object) => {
		object.scale.set(0.01, 0.01, 0.01); // Измени масштаб модели, если нужно
		object.position.set(5, 5, 1); // Установи позицию
		scene.add(object);

		forestHouse = object;

		// Обновляем границы дома
		houseBoundingBox.setFromObject(forestHouse);
	});
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	// // Проверяем, входит ли камера в дом
	const cameraBox = new THREE.Box3().setFromCenterAndSize(
		camera.position,
		new THREE.Vector3(1, 1, 1), // Размер хитбокса камеры
	);

	if (houseBoundingBox.intersectsBox(cameraBox)) {
		console.log("Камера столкнулась с домом!");
		camera.position.sub(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.5));
	}

	if (houseBoundingBox.containsPoint(camera.position)) {
		camera.position.y += 1; // Отталкиваем камеру вверх, чтобы не застревала
	}

	controls.update();
	renderer.render(scene, camera);
}

function onIslandClick(event) {
	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();
	// console.log("🚀 ~ onIslandClick ~ event.clientX:", event.clientX);
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	// console.log("🚀 ~ onIslandClick ~ mouse:", mouse);

	// Обновляем луч (Raycaster)
	raycaster.setFromCamera(mouse, camera);

	const intersects = raycaster.intersectObject(island);
	console.log("🚀 ~ onIslandClick ~ intersects:", intersects);

	if (intersects.length > 0) {
		console.log("🚀 ~ onIslandClick ~ intersects.length:", intersects.length);
		const intersectionPoint = intersects[0].point;

		const geometry = new THREE.CylinderGeometry(1, 1, 10, 32);
		const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
		const cylinder = new THREE.Mesh(geometry, material);
		cylinder.position.set(intersectionPoint.x, intersectionPoint.y + 2.5, intersectionPoint.z);
		// house
		scene.add(cylinder);
	}
}
