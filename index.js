import * as THREE from "three";
import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "./three/examples/jsm/loaders/DRACOLoader.js";
import { OBJLoader } from "./three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "./three/examples/jsm/loaders/FBXLoader.js";
import Stats from "./three/examples/jsm/libs/stats.module.js";

let camera, scene, renderer, island, controls, house, island2;
let forestHouse; // Переменная для модели дома
let houseBoundingBox = new THREE.Box3(); // Границы дома
let stars; // Переменная для звёзд
let selectedModel = null;
let deleteButton = null;
const starsCount = 10000; // Количество звёзд
let stats;

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let highlightedModel = null;
let originalMaterials = new Map();

init();

function init() {
	initStats();
	// window.addEventListener("click", onMouseMove);
	window.addEventListener("click", pris);

	// Создание сцены
	scene = new THREE.Scene();

	// // Фон ближе
	// const bgTexture = new THREE.TextureLoader().load("./img/night-sky.png");
	// bgTexture.wrapS = bgTexture.wrapT = THREE.RepeatWrapping;
	// scene.background = bgTexture;

	// Камера
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
	camera.position.set(0, 10, 20);
	// Освещение
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
	scene.add(ambientLight);
	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(10, 20, 10);
	scene.add(directionalLight);

	// scene.fog = new THREE.Fog(0xaaaaaa, 10, 30); // Цвет тумана, начало, конец
	//туман
	scene.fog = new THREE.FogExp2(0xaaaaaa, 0.05); // Чем больше значение, тем гуще туман

	// Создание острова
	const textureLoader = new THREE.TextureLoader();
	// const islandTexture = textureLoader.load("./img/i.jpg");
	const islandGeometry = new THREE.CylinderGeometry(26, 26, 5, 6);
	// радиус верхней части, нижней части, высота, колличество сегментов

	// const islandMaterial = new THREE.MeshStandardMaterial({ map: islandTexture, depthTest: true });
	const islandMaterial = new THREE.MeshStandardMaterial({ color: 0x20e80e, depthTest: true });
	island = new THREE.Mesh(islandGeometry, islandMaterial);
	island.position.set(0, 2.5, 0);
	island.geometry.center(); // Центрирует вершины относительно (0, 0, 0)

	island.receiveShadow = true;
	island.castShadow = true;
	scene.add(island);

	// const islandGeometry2 = new THREE.CylinderGeometry(26, 26, 5, 6);
	const islandMaterial2 = new THREE.MeshStandardMaterial({ color: 0xbebd7f, depthTest: true });
	island2 = new THREE.Mesh(islandGeometry, islandMaterial2);
	island2.position.set(35, 2.5, 35);
	island2.receiveShadow = true;
	island2.castShadow = true;
	scene.add(island2);
	//

	// 1. Создаём геометрию шестигранника
	const islandGeometry3 = new THREE.CylinderGeometry(26, 26, 5, 6);
	// 2. Создаём материал для тела (например, синий)
	const islandMaterial3 = new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide });

	const topMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Верх — зелёный
	const bottomMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Низ — синий
	const sideMaterial = new THREE.MeshBasicMaterial({ color: 0x00aa00 }); // Боковина — красная

	// 3. Создаём меш для основного объекта
	// const islandMesh = new THREE.Mesh(islandGeometry3, islandMaterial3);
	const islandMesh = new THREE.Mesh(islandGeometry3, [sideMaterial, topMaterial, bottomMaterial]);

	islandMesh.position.set(80, 2.5, 80);
	scene.add(islandMesh);

	const edgesGeometry = new THREE.EdgesGeometry(islandGeometry3);
	const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x008800 }); // Чёрные рёбра
	const edgesMesh = new THREE.LineSegments(edgesGeometry, edgesMaterial);
	edgesMesh.position.set(80, 2.5, 80);
	scene.add(edgesMesh); // Добавляем рёбра

	// 2. Создаём материалы

	// // 4. Создаём геометрию рёбер
	// const edgesGeometry = new THREE.EdgesGeometry(islandGeometry3);
	// const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Красные рёбра
	// const edgesMesh = new THREE.LineSegments(edgesGeometry, edgesMaterial);
	// edgesMesh.position.set(80, 2.5, 80);

	// 5. Добавляем рёбра поверх основного меша
	// scene.add(edgesMesh);

	// Рендерер
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	// Управление камерой
	controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 2.5, 0);
	controls.enableRotate = true; // Отключаем вращение камеры
	controls.enablePan = true; // Включаем перемещение по карте
	controls.screenSpacePanning = false; // Двигаем по плоскости
	controls.maxPolarAngle = Math.PI / 3; // Фиксируем угол обзора
	controls.minDistance = 10; // Минимальное приближение
	controls.maxDistance = 300; // Увеличиваем максимальное отдаление, чтобы остров не исчезал

	controls.update();
	createStars();
	// Загрузка моделей
	loadModels();

	window.addEventListener("resize", onWindowResize);
	window.addEventListener("dblclick", onIslandClick);
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
		// scene.add(object);

		forestHouse = object;

		// Обновляем границы дома
		houseBoundingBox.setFromObject(forestHouse);
	});

	const loader2 = new FBXLoader();
	loader2.load(
		"./three/examples/models/Cartoon_house_low_poly_FBX.FBX", // Укажите путь к модели
		(object) => {
			object.scale.set(0.01, 0.01, 0.01); // Измени масштаб модели, если нужно
			object.position.set(5, 5, 1); // Установи позицию
			scene.add(object);
			console.log("FBX модель загружена:", object);
		},
		(xhr) => {
			console.log(`Загрузка FBX: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}%`);
		},
		(error) => {
			console.error("Ошибка загрузки FBX:", error);
		},
	);

	const loader3 = new FBXLoader();
	loader3.load(
		"./three/examples/models/uploads_files_2577117.fbx", // Укажите путь к модели
		(object) => {
			object.scale.set(0.01, 0.01, 0.01); // Измени масштаб модели, если нужно
			object.position.set(8, 5, 2); // Установи позицию
			scene.add(object);
			console.log("FBX модель загружена:", object);
		},
		(xhr) => {
			console.log(`Загрузка FBX: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}%`);
		},
		(error) => {
			console.error("Ошибка загрузки FBX:", error);
		},
	);

	const hexRadius = 20; // Радиус шестиугольника
	const treeCount = 50; // Количество деревьев

	for (let i = 0; i < treeCount; i++) {
		const { x, z } = randomPointInHexagon(hexRadius);
		makeTree(x, z);
	}
	const rockCount = 50; // Количество камней

	for (let i = 0; i < rockCount; i++) {
		const { x, z } = randomPointInHexagon(hexRadius);
		makeRock(x, z);
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	stats.begin(); // Запускаем измерение FPS
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

	//
	// Двигаем звёзды влево и вглубь сцены
	stars.position.x -= 0.02;
	stars.position.z -= 0.01;

	// Если звёзды сильно сдвинулись, сбрасываем их позицию
	if (stars.position.x < -1000) {
		stars.position.x = 1000;
	}
	if (stars.position.z < -1000) {
		stars.position.z = 1000;
	}

	controls.update();
	renderer.render(scene, camera);
	stats.end(); // Завершаем измерение FPS
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

		const geometry = new THREE.CylinderGeometry(1, 1, 5, 6);
		const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
		const cylinder = new THREE.Mesh(geometry, material);
		cylinder.position.set(intersectionPoint.x, intersectionPoint.y + 2.5, intersectionPoint.z);
		// house
		scene.add(cylinder);
	}
}

function createStars() {
	const starGeometry = new THREE.BufferGeometry();
	const starVertices = [];

	for (let i = 0; i < starsCount; i++) {
		const x = (Math.random() - 0.5) * 1000; // Разброс по X
		const y = (Math.random() - 0.5) * 1000; // Разброс по Y (выше сцены)
		const z = (Math.random() - 0.5) * 1000; // Разброс по Z

		starVertices.push(x, y, z);
	}

	starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starVertices, 3));

	const starMaterial = new THREE.PointsMaterial({
		color: 0xffffff,
		size: 0.5,
		transparent: true,
	});

	stars = new THREE.Points(starGeometry, starMaterial);
	scene.add(stars);
}
function initStats() {
	stats = new Stats();
	stats.showPanel(0); // 0 - FPS, 1 - MS, 2 - MB
	document.body.appendChild(stats.dom);
}

document.getElementById("resetCamera").addEventListener("click", () => {
	camera.position.set(0, 10, 20); // Начальные координаты камеры
	controls.target.set(0, 2.5, 0); // Смотрим на остров
	controls.update(); // Обновляем управление
});

function pris(event) {
	// Нормализуем координаты мыши (-1 до 1)
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);

	// Проверяем, попали ли в island2
	const intersects = raycaster.intersectObject(island2);
	if (intersects.length > 0) {
		captureIsland();
	}
}
function captureIsland() {
	const distance = 26 + 20; // Радиус 1-го + радиус 2-го
	const targetPosition = new THREE.Vector3(
		island.position.x + distance,
		island.position.y,
		island.position.z,
	);

	const duration = 2; // Время анимации (сек)
	const startTime = performance.now();

	function animate() {
		const elapsed = (performance.now() - startTime) / 1000;
		const t = Math.min(elapsed / duration, 1);

		// Плавное перемещение
		island2.position.lerp(targetPosition, t);

		if (t < 1) requestAnimationFrame(animate);
		// else createBridge();
	}

	animate();
}

function onMouseMove(event) {
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);
	let intersects = raycaster.intersectObjects(scene.children, true);

	if (intersects.length > 0) {
		let object = intersects[0].object;
		let model = findParentModel(object);
		console.log("🚀 ~ onMouseMove ~ model:", model);
		console.log("🚀 ~ onMouseMove ~ model:", island);
		console.log("🚀 ~ onMouseMove ~ selectedModel:", selectedModel);

		if (model == island) {
			console.log("оно");
		} else if (selectedModel !== model) {
			resetPreviousSelection();
			selectedModel = model;
			saveOriginalMaterials(model);
			applyHighlight(model);
			createDeleteButton(model);
		}
	} else {
		resetPreviousSelection();
	}
}

// Функция поиска родительской модели
function findParentModel(object) {
	while (object.parent && object.parent !== scene) {
		object = object.parent;
	}
	return object;
}

// Сохраняем оригинальные материалы модели
function saveOriginalMaterials(model) {
	originalMaterials.clear();
	model.traverse((child) => {
		if (child.isMesh) {
			originalMaterials.set(child, child.material);
		}
	});
}

// Применяем подсветку ко всей модели
function applyHighlight(model) {
	model.traverse((child) => {
		if (child.isMesh) {
			child.material = new THREE.MeshBasicMaterial({
				color: 0xff0000,
				wireframe: true,
			});
		}
	});
}

// Сбрасываем подсветку предыдущей модели
function resetPreviousModel() {
	if (highlightedModel) {
		highlightedModel.traverse((child) => {
			if (child.isMesh && originalMaterials.has(child)) {
				child.material = originalMaterials.get(child);
			}
		});
		highlightedModel = null;
	}
}

// Сбрасываем выделение предыдущей модели
function resetPreviousSelection() {
	if (selectedModel) {
		selectedModel.traverse((child) => {
			if (child.isMesh && originalMaterials.has(child)) {
				child.material = originalMaterials.get(child);
			}
		});
		selectedModel = null;
	}

	if (deleteButton) {
		document.body.removeChild(deleteButton);
		deleteButton = null;
	}
}

// Создаём кнопку удаления (крестик)
function createDeleteButton(model) {
	if (deleteButton) {
		document.body.removeChild(deleteButton);
	}

	deleteButton = document.createElement("button");
	deleteButton.innerHTML = "❌";
	deleteButton.style.position = "absolute";
	deleteButton.style.top = "20px";
	deleteButton.style.right = "20px";
	deleteButton.style.fontSize = "20px";
	deleteButton.style.padding = "10px";
	deleteButton.style.background = "red";
	deleteButton.style.color = "white";
	deleteButton.style.border = "none";
	deleteButton.style.cursor = "pointer";

	deleteButton.onclick = function () {
		scene.remove(model);
		resetPreviousSelection();
	};

	document.body.appendChild(deleteButton);
}
function randomPointInHexagon(radius) {
	let x, z;
	do {
		x = (Math.random() * 2 - 1) * radius; // От -R до R
		z = (Math.random() * 2 - 1) * (Math.sqrt(3) / 2) * radius; // От -√3/2 * R до √3/2 * R
	} while (Math.abs(x) + Math.abs(z) / Math.sqrt(3) > radius); // Проверяем, внутри ли точка
	return { x, z };
}

function makeTree(x, z) {
	const trunkRadius = 0.2;
	const trunkHeight = 1;
	const trunkRadialSegments = 12;
	const trunkGeometry = new THREE.CylinderGeometry(
		trunkRadius,
		trunkRadius,
		trunkHeight,
		trunkRadialSegments,
	);

	const topRadius = trunkRadius * 4;
	const topHeight = trunkHeight * 2;
	const topSegments = 12;
	const topGeometry = new THREE.ConeGeometry(topRadius, topHeight, topSegments);

	const trunkMaterial = new THREE.MeshPhongMaterial({ color: "brown" });
	const topMaterial = new THREE.MeshPhongMaterial({ color: "green" });

	const root = new THREE.Object3D();
	const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
	trunk.position.y = trunkHeight / 2;
	root.add(trunk);

	const top = new THREE.Mesh(topGeometry, topMaterial);
	top.position.y = trunkHeight + topHeight / 2;
	root.add(top);

	root.position.set(x, 5, z);
	scene.add(root);

	return root;
}

function makeRock(x, z) {
	const size = 0.3 + Math.random() * 0.4; // Размер камня от 0.3 до 0.7
	const geometry = new THREE.DodecahedronGeometry(size, 0); // Граненый камень
	const material = new THREE.MeshStandardMaterial({ color: 0x888888 }); // Серый цвет

	const rock = new THREE.Mesh(geometry, material);
	rock.position.set(x, 5, z); // Размещаем на высоте 5 (можно поменять)
	rock.rotation.y = Math.random() * Math.PI; // Случайный поворот

	scene.add(rock);
	return rock;
}
