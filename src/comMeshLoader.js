// Import ThreeJS and assign it to global scope
// This way examples/ folder can use it too
const THREE = require("three");
global.THREE = THREE;

// Add dragon GLTF model
new THREE.GLTFLoader().load("src/dragon.glb", (gltf) => {
  const dragon = gltf.scene.children.find((mesh) => mesh.name === "Dragon");

  // Just copy the geometry from the loaded model
  const geometry = dragon.geometry.clone();

  // Adjust geometry to suit our scene
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, -4, 0);

  // Create a new mesh and place it in the scene
  //const mesh = new THREE.Mesh(geometry, material);
  //mesh.position.set(...positions[3]);
  //mesh.scale.set(0.135, 0.135, 0.135);
  //meshes.push(mesh);
  //scene.add(mesh);

  // Discard the model
  dragon.geometry.dispose();
  dragon.material.dispose();
});
