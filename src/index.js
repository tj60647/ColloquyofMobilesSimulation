const canvasSketch = require("canvas-sketch");

// Import ThreeJS and assign it to global scope
// This way examples/ folder can use it too
const THREE = require("three");
global.THREE = THREE;

// Import extra THREE plugins
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/geometries/RoundedBoxGeometry.js");
require("three/examples/js/loaders/SVGLoader.js");
require("three/examples/js/loaders/GLTFLoader.js");
require("three/examples/js/loaders/RGBELoader.js");
require("three/examples/js/postprocessing/EffectComposer.js");
require("three/examples/js/postprocessing/RenderPass.js");
require("three/examples/js/postprocessing/ShaderPass.js");
require("three/examples/js/postprocessing/UnrealBloomPass.js");
require("three/examples/js/shaders/LuminosityHighPassShader.js");
require("three/examples/js/shaders/CopyShader.js");

const Stats = require("stats-js");
const { GUI } = require("dat.gui");

const settings = {
  animate: true,
  context: "webgl",
  resizeCanvas: false
};

const sketch = ({ context, canvas, width, height }) => {
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  const gui = new GUI();

  const options = {
    enableSwoopingCamera: false,
    enableRotation: true,
    transmission: 1,
    thickness: 1.2,
    roughness: 0.6,
    envMapIntensity: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    normalScale: 1,
    clearcoatNormalScale: 0.3,
    normalRepeat: 1,
    bloomThreshold: 0.85,
    bloomStrength: 0.5,
    bloomRadius: 0.33
  };

  // Setup
  // -----

  const renderer = new THREE.WebGLRenderer({
    context,
    antialias: false
  });
  renderer.setClearColor(0x1f1e1c, 1);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 10000);
  camera.position.set(0, 0, 5);

  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enabled = !options.enableSwoopingCamera;

  const scene = new THREE.Scene();

  const renderPass = new THREE.RenderPass(scene, camera);
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(width, height),
    options.bloomStrength,
    options.bloomRadius,
    options.bloomThreshold
  );

  const composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  // Content
  // -------

  const colloquyObjectLoader = new THREE.GLTFLoader();
  const colloquySVGLoader = new THREE.SVGLoader();

  const textureLoader = new THREE.TextureLoader();

  //const bgTexture = textureLoader.load("src/texture.jpg");
  //const bgGeometry = new THREE.PlaneGeometry(5, 5);
  //const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
  //const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
  //bgMesh.position.set(0, 0, -1);
  //scene.add(bgMesh);

  const positions = [
    [-0.85, 0.85, 0],
    [0.85, 0.85, 0],
    [-0.85, -0.85, 0],
    [0.0, 0.0, 0]
  ];

  const geometries = [
    //new THREE.IcosahedronGeometry(0.75, 0), // Faceted
    //new THREE.IcosahedronGeometry(0.67, 24), // Sphere
    //new THREE.RoundedBoxGeometry(1.12, 1.12, 1.12, 16, 0.2)
  ];

  const hdrEquirect = new THREE.RGBELoader().load(
    "src/empty_warehouse_01_2k.hdr",
    () => {
      hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
    }
  );

  const normalMapTexture = textureLoader.load("src/normal.jpg");
  normalMapTexture.wrapS = THREE.RepeatWrapping;
  normalMapTexture.wrapT = THREE.RepeatWrapping;
  normalMapTexture.repeat.set(options.normalRepeat, options.normalRepeat);

  const material = new THREE.MeshPhysicalMaterial({
    transmission: options.transmission,
    thickness: options.thickness,
    roughness: options.roughness,
    envMap: hdrEquirect,
    envMapIntensity: options.envMapIntensity,
    clearcoat: options.clearcoat,
    clearcoatRoughness: options.clearcoatRoughness,
    normalScale: new THREE.Vector2(options.normalScale),
    normalMap: normalMapTexture,
    clearcoatNormalMap: normalMapTexture,
    clearcoatNormalScale: new THREE.Vector2(options.clearcoatNormalScale)
  });

  const meshes = geometries.map(
    (geometry) => new THREE.Mesh(geometry, material)
  );

  meshes.forEach((mesh, i) => {
    scene.add(mesh);
    mesh.position.set(...positions[i]);
  });

  // GUI
  // ---

  gui.add(options, "enableSwoopingCamera").onChange((val) => {
    controls.enabled = !val;
    controls.reset();
  });

  gui.add(options, "enableRotation").onChange(() => {
    meshes.forEach((mesh) => mesh.rotation.set(0, 0, 0));
  });

  gui.add(options, "transmission", 0, 1, 0.01).onChange((val) => {
    material.transmission = val;
  });

  gui.add(options, "thickness", 0, 5, 0.1).onChange((val) => {
    material.thickness = val;
  });

  gui.add(options, "roughness", 0, 1, 0.01).onChange((val) => {
    material.roughness = val;
  });

  gui.add(options, "envMapIntensity", 0, 3, 0.1).onChange((val) => {
    material.envMapIntensity = val;
  });

  gui.add(options, "clearcoat", 0, 1, 0.01).onChange((val) => {
    material.clearcoat = val;
  });

  gui.add(options, "clearcoatRoughness", 0, 1, 0.01).onChange((val) => {
    material.clearcoatRoughness = val;
  });

  gui.add(options, "normalScale", 0, 5, 0.01).onChange((val) => {
    material.normalScale.set(val, val);
  });

  gui.add(options, "clearcoatNormalScale", 0, 5, 0.01).onChange((val) => {
    material.clearcoatNormalScale.set(val, val);
  });

  gui.add(options, "normalRepeat", 1, 4, 1).onChange((val) => {
    normalMapTexture.repeat.set(val, val);
  });

  const postprocessing = gui.addFolder("Post Processing");
  postprocessing.open();

  postprocessing.add(options, "bloomThreshold", 0, 1, 0.01).onChange((val) => {
    bloomPass.threshold = val;
  });

  postprocessing.add(options, "bloomStrength", 0, 5, 0.01).onChange((val) => {
    bloomPass.strength = val;
  });

  postprocessing.add(options, "bloomRadius", 0, 1, 0.01).onChange((val) => {
    bloomPass.radius = val;
  });

  //
  // load svg files
  colloquySVGLoader.load("src/diagram_plan.svg", function (loadPlanDiagram) {
    const planDiagramPaths = loadPlanDiagram.paths;

    //console.log(planDiagramPaths);

    const group = new THREE.Group();
    group.scale.multiplyScalar(0.025);
    group.position.x = -0;
    group.position.y = 0;
    //group.scale.y *= -1;
    group.name = "planDiagramSVG";

    for (let i = 0; i < planDiagramPaths.length; i++) {
      const planDiagramPath = planDiagramPaths[i];
      //console.log(planDiagramPath);
      const fillColor = planDiagramPath.userData.style.fill;
      if (true && fillColor !== undefined && fillColor !== "none") {
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setStyle(fillColor).convertSRGBToLinear(),
          opacity: planDiagramPath.userData.style.fillOpacity,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          wireframe: false //guiData.fillShapesWireframe
        });

        const shapes = THREE.SVGLoader.createShapes(planDiagramPath);

        for (let j = 0; j < shapes.length; j++) {
          const shape = shapes[j];

          const geometry = new THREE.ShapeGeometry(shape);
          const mesh = new THREE.Mesh(geometry, material);

          group.add(mesh);
        }
      }
      const strokeColor = planDiagramPath.userData.style.stroke;

      if (true && strokeColor !== undefined && strokeColor !== "none") {
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setStyle(strokeColor).convertSRGBToLinear(),
          opacity: planDiagramPath.userData.style.strokeOpacity,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          wireframe: false
        });

        for (let j = 0, jl = planDiagramPath.subPaths.length; j < jl; j++) {
          const subPath = planDiagramPath.subPaths[j];

          const geometry = THREE.SVGLoader.pointsToStroke(
            subPath.getPoints(),
            planDiagramPath.userData.style
          );

          if (geometry) {
            const mesh = new THREE.Mesh(geometry, material);

            group.add(mesh);
          }
        }
      }
    }
    //console.log(group);
    //scene.add(group);
  });

  // Add fem_shell GLTF model
  colloquyObjectLoader.load(
    "src/fem_2_body_shell.glb",
    (fem_body_shell_source) => {
      console.log("load fem_2_body_shell");
      console.log(fem_body_shell_source);
      //const dragon = fem_2_body_shell.scene.children.find((mesh) => mesh.name === "Dragon");
      const fem_body_shell_mesh = fem_body_shell_source.scene.children[0].children.find(
        (mesh) => mesh.name === "mesh_0"
      );

      // Just copy the geometry from the loaded model
      const fem_body_shell_geo = fem_body_shell_mesh.geometry.clone();

      // Adjust geometry to suit our scene
      //geometry.rotateX(Math.PI / 2);
      fem_body_shell_geo.translate(0, -68, 0);
      fem_body_shell_geo.rotateX(Math.PI / -2);
      // Create a new mesh and place it in the scene
      const fem_body_shell = new THREE.Mesh(fem_body_shell_geo, material);
      //fem_body_shell.position.set(...positions[3]);
      //fem_body_shell.scale.set(0.025, 0.025, 0.025);
      fem_body_shell.scale.set(1, 1, 1);
      meshes.push(fem_body_shell);
      scene.add(fem_body_shell);

      // Discard the model
      //fem_body_shell_source.dispose();

      fem_body_shell_mesh.geometry.dispose();
      fem_body_shell_mesh.material.dispose();
    },
    // called while loading is progressing
    function (xhr) {
      console.log(
        "fem_2_body_shell " + (xhr.loaded / xhr.total) * 100 + "% loaded"
      );
    },
    // called when loading has errors
    function (error) {
      console.log("An error happened");
    }
  );
  // Add fem_head_shell GLTF model
  colloquyObjectLoader.load(
    "src/fem_2_head_shell.gltf",
    (fem_head_shell_source) => {
      console.log("load fem_2_head_shell");
      console.log(fem_head_shell_source);
      const fem_head_shell_mesh =
        fem_head_shell_source.scene.children[0].children; //.find(
      //  (mesh) => mesh.name === "mesh_0"
      //);
      console.log(fem_head_shell_mesh);
      // Just copy the geometry from the loaded model
      //const fem_head_shell_geo = fem_head_shell_mesh.geometry;//.clone();

      // Adjust geometry to suit our scene
      //geometry.rotateX(Math.PI / 2);
      //fem_head_shell_geo.translate(0, -68, 0);
      //fem_head_shell_geo.rotateX(Math.PI / -2);
      // Create a new mesh and place it in the scene
      //const fem_head_shell = new THREE.Mesh(fem_head_shell_geo, material);
      //fem_body_shell.position.set(...positions[3]);
      //fem_body_shell.scale.set(0.025, 0.025, 0.025);
      //fem_head_shell.scale.set(1, 1, 1);
      //meshes.push(fem_head_shell);
      // scene.add(fem_head_shell);

      // Discard the model
      //fem_body_shell_source.dispose();

      //fem_head_shell_mesh.geometry.dispose();
      //fem_head_shell_mesh.material.dispose();
    },
    // called while loading is progressing
    function (xhr) {
      console.log(
        "fem_2_head_shell " + (xhr.loaded / xhr.total) * 100 + "% loaded"
      );
    },
    // called when loading has errors
    function (error) {
      console.log("fem_2_head_shell:  An error happened");
    }
  );

  colloquyObjectLoader.load(
    "src/diagram_plan.gltf",
    // called when the resource is loaded
    function (diagram_plan_source) {
      const diagram_plan = diagram_plan_source;
      diagram_plan.name = "diagram_plan";
      console.log("load diagram_plan");
      console.log(diagram_plan);
      //diagram_plan.scene.scale.set(0.025);

      scene.add(diagram_plan.scene);

      //gltf.animations; // Array<THREE.AnimationClip>
      //gltf.scene; // THREE.Group
      //gltf.scenes; // Array<THREE.Group>
      //gltf.cameras; // Array<THREE.Camera>
      //gltf.asset; // Object
    },
    // called while loading is progressing
    function (xhr) {
      console.log(
        "diagram_plan " + (xhr.loaded / xhr.total) * 100 + "% loaded"
      );
    },
    // called when loading has errors
    function (error) {
      console.log("diagram_plan: An error happened");
    }
  );

  // Update
  // ------

  const update = (time, deltaTime) => {
    const ROTATE_TIME = 10; // Time in seconds for a full rotation
    //const xAxis = new THREE.Vector3(1, 0, 0);
    const yAxis = new THREE.Vector3(0, 1, 0);
    //const rotateX = (deltaTime / ROTATE_TIME) * Math.PI * 2;
    const rotateY = (deltaTime / ROTATE_TIME) * Math.PI * 2;

    if (options.enableRotation) {
      meshes.forEach((mesh) => {
        //mesh.rotateOnWorldAxis(xAxis, rotateX);
        mesh.rotateOnWorldAxis(yAxis, rotateY);
      });
    }

    if (options.enableSwoopingCamera) {
      camera.position.x = Math.sin((time / 10) * Math.PI * 2) * 2;
      camera.position.y = Math.cos((time / 10) * Math.PI * 2) * 2;
      camera.position.z = 4;
      camera.lookAt(scene.position);
    }
  };

  // Lifecycle
  // ---------

  return {
    resize({ canvas, pixelRatio, viewportWidth, viewportHeight }) {
      const dpr = Math.min(pixelRatio, 2); // Cap DPR scaling to 2x

      canvas.width = viewportWidth * dpr;
      canvas.height = viewportHeight * dpr;
      canvas.style.width = viewportWidth + "px";
      canvas.style.height = viewportHeight + "px";

      bloomPass.resolution.set(viewportWidth, viewportHeight);

      renderer.setPixelRatio(dpr);
      renderer.setSize(viewportWidth, viewportHeight);

      composer.setPixelRatio(dpr);
      composer.setSize(viewportWidth, viewportHeight);

      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    render({ time, deltaTime }) {
      stats.begin();
      controls.update();
      update(time, deltaTime);
      // renderer.render(scene, camera);
      composer.render();
      stats.end();
    },
    unload() {
      geometries.forEach((geometry) => geometry.dispose());
      material.dispose();
      hdrEquirect.dispose();
      controls.dispose();
      renderer.dispose();
      bloomPass.dispose();
      gui.destroy();
      document.body.removeChild(stats.dom);
    }
  };
};

canvasSketch(sketch, settings);
