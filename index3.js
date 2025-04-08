import * as THREE from "three";
import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "./three/examples/jsm/loaders/DRACOLoader.js";
import { OBJLoader } from "./three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "./three/examples/jsm/loaders/FBXLoader.js";
import Stats from "./three/examples/jsm/libs/stats.module.js";

// Создаём сцену, камеру и рендерер
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Создаём геометрию острова
const islandGeometry2 = new THREE.CylinderGeometry(26, 26, 5, 6);

// Создаём материалы
const topMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Верх — зелёный
const bottomMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Низ — синий
const sideMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Боковина — красная

// Создаём меш для острова
const islandMesh = new THREE.Mesh(islandGeometry2, [sideMaterial, topMaterial, bottomMaterial]);

// Создаём рёбра
const edgesGeometry = new THREE.EdgesGeometry(islandGeometry2);
const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }); // Чёрные рёбра
const edgesMesh = new THREE.LineSegments(edgesGeometry, edgesMaterial);

// Группа для острова и предметов
const islandGroup = new THREE.Group();
islandGroup.add(islandMesh);
islandGroup.add(edgesMesh);

// Добавляем группу в сцену
scene.add(islandGroup);

// Создаём дополнительные предметы, которые будут двигаться вместе с островом
const cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(10, 5, 0); // Размещаем куб рядом с островом

// Добавляем куб в группу
islandGroup.add(cube);

// Камера
camera.position.z = 50;
camera.position.y = 10;

// Создаём Raycaster для отслеживания кликов
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Функция для обновления позиции мыши
function onMouseMove(event) {
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
// Функция для обработки клика
// Функция для обработки клика
function onMouseClick(event) {
	// Создаём луч, который будет идти от мыши
	raycaster.setFromCamera(mouse, camera);

	// Проверяем, что находится под курсором
	const intersects = raycaster.intersectObjects(islandGroup.children);

	// Если есть пересечение с объектом
	if (intersects.length > 0) {
		const object = intersects[0].object;

		// Если это куб, удаляем его
		if (object === cube) {
			islandGroup.remove(cube); // Удаляем куб из группы
			scene.remove(cube); // Удаляем куб из сцены
		}
	}
}

// Слушаем события мыши
window.addEventListener("mousemove", onMouseMove, false);
window.addEventListener("click", onMouseClick, false);
window.addEventListener("dblclick", onDoubleClick, false);
// Функция анимации
function animate() {
	requestAnimationFrame(animate);

	// Двигаем остров и все объекты внутри группы
	islandGroup.rotation.y += 0.01; // Поворот всей группы

	// Рендерим сцену
	renderer.render(scene, camera);
}

// Запускаем анимацию
animate();

// Функция для обработки двойного клика

// Функция для обработки двойного клика
function onDoubleClick(event) {
	// Создаём луч, который будет идти от мыши
	raycaster.setFromCamera(mouse, camera);

	// Проверяем, что находится под курсором
	const intersects = raycaster.intersectObject(islandMesh); // Проверяем только остров

	// Если пересечение с островом
	if (intersects.length > 0) {
		const intersectPoint = intersects[0].point; // Точка пересечения с объектом

		// Создаём новый куб, который будет добавлен на шестигранник
		const newCubeGeometry = new THREE.BoxGeometry(5, 5, 5);
		const newCubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
		const newCube = new THREE.Mesh(newCubeGeometry, newCubeMaterial);

		// Размещаем новый куб на точке пересечения
		newCube.position.copy(intersectPoint);

		// Добавляем куб в группу острова
		islandGroup.add(newCube);
	}
}
