"use strict";

{
	window.addEventListener('load', init);

	function init() {
		const width = window.innerWidth;
		const height = window.innerHeight;

		const scene = new THREE.Scene();

		const light = new THREE.DirectionalLight(0xffffff);
		light.position.set(0, 0, 0);
		scene.add(light);

		const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
		camera.position.set(50, -10, 100);
		camera.lookAt(30, 0, 0);

		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(width, height);
		renderer.setClearColor(0x000000);
		renderer.setPixelRatio(window.devicePixelRatio);
		document.getElementById('stage').appendChild(renderer.domElement);

		let text1;
		let text2;
		let text3;
		let title;

		let audioContext;
		let audioSource;
		let audioBufferSource;
		let audioAnalyser;
		let audioCount;
		let buffer;

		const loader = new THREE.FontLoader();
		loader.load('./libs/helvetiker_regular.typeface.json', font => {
			document.getElementById("start").addEventListener("click", () => {
				initAudio().then(data => {
					buffer = data;
				});
				createText(font);
				setTimeout(() => {
					setAudio(buffer);
					render();
				}, 1000);
				document.getElementById("start").classList.add('btn-pushed');
			});
		});


		function createText(font) {
			text1 = new THREE.Mesh(
				new THREE.TextGeometry('Product', {
					font: font,
					size: 12,
					height: 4
				}),
				new THREE.MeshBasicMaterial({ color: 0x7777ff, side: THREE.DubleSide, wireframe: true })
			);
			text2 = new THREE.Mesh(
				new THREE.TextGeometry('Engineer', {
					font: font,
					size: 12,
					height: 4
				}),
				new THREE.MeshBasicMaterial({ color: 0x7777ff, side: THREE.DubleSide, wireframe: true })
			);
			text3 = new THREE.Mesh(
				new THREE.TextGeometry('Salon', {
					font: font,
					size: 12,
					height: 4
				}),
				new THREE.MeshBasicMaterial({ color: 0x7777ff, side: THREE.DubleSide, wireframe: true })
			);
			title = new THREE.Group();
			text1.position.set(0, 20, 10);
			text2.position.set(10, 0, 0);
			text3.position.set(40, -20, 0);
			title.add(text1)
			title.add(text2)
			title.add(text3)
			scene.add(title);
		}

		const initAudio = () =>
			new Promise(resolve => {
				// AudioContext の生成
				audioContext = new (window.AudioContext || window.webkitAudioContext)();
				// 取得する音声データ
				audioSource = "./audio2.mp3";
				// 音声データの入力機能
				audioBufferSource = audioContext.createBufferSource();
				// 音声データの波形取得機能
				audioAnalyser = audioContext.createAnalyser();

				let request = new XMLHttpRequest();
				request.open("GET", audioSource, true);
				request.responseType = "arraybuffer";
				// 取得した音声データをデコードし、
				// デコードされた音声データをこの後の処理に渡す
				request.onload = () => {
					audioContext.decodeAudioData(request.response, buffer => resolve(buffer));
				};
				request.send();
			});

		const setAudio = buffer => {
			// 描画の更新をスムーズにするかどうかを決める
			audioAnalyser.smoothingTimeConstant = 1.0;

			// fftサイズを指定する
			// audioAnalyser.fftSize = 1024;

			// 渡ってきた音声データを音源として設定する
			audioBufferSource.buffer = buffer;

			// 音源がループするように設定する
			audioBufferSource.loop = true;

			// 時間領域の波形データを格納する配列を生成
			audioCount = new Uint8Array(audioAnalyser.frequencyBinCount);

			// 音源を波形取得機能に接続
			audioBufferSource.connect(audioAnalyser);

			// 波形取得機能を出力機能に接続
			audioAnalyser.connect(audioContext.destination);
			
			// 音源の再生を開始する
			audioBufferSource.start(0);
		};



		function render() {
			// 時間領域の波形データを格納する
			audioAnalyser.getByteTimeDomainData(audioCount);

			// この関数実行タイミングでの波形データの最大値を取得
			let number = audioCount.reduce((a, b) => Math.max(a, b));

			// 0 〜 255 の値が入るので、 0 〜 1 になるように調整
			number = number / 511;

			// 取得した値を2乗(大きい値はより大きく、小さい値はより小さく)して
			// 0.5 以上になるよう調整する
			title.scale.x = Math.pow(number, 2) + 0.5;
			title.scale.y = Math.pow(number, 2) + 0.5;
			title.scale.z = Math.pow(number, 2) + 0.5;
			
			let speed = 0.005;
			let titleRotaX = title.rotation.x + speed,
					titleRotaY = title.rotation.y + speed,
					titleRotaZ = title.rotation.z + speed;
			title.rotation.set(titleRotaX, titleRotaY, titleRotaZ);
			renderer.render(scene, camera);
			requestAnimationFrame(render)
		}
	}
}
