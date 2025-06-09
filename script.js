//PAUSE GAME WITH Q
let paused = false;
let editorMode = false;
let placing = false;
let blockPlacing;
const maxEnemies = 5;
let enemiesCount = 0;
let sx = 1.1;
let sy = 1;
let sz = 1;
let tx = 0;
let ty = 0;
let tz = 0;
let rx = 0;
let tMatrix;
let rMatrix;
const enemySpawnRate = 10000;
let spawnTimer = 0;

document.addEventListener("keydown", (e) => {
    e.preventDefault();
    if (e.key === "q") {
        paused = !paused;
        if(paused){
            document.body.requestPointerLock();
        } else {
            document.exitPointerLock();
        }
    }
    
    if (e.key === "l") {
        editorMode = !editorMode;
        
    }
    
    if(e.key === "c" && editorMode){
        blockPlacing = baseCube;
        placing = true;
        sx = 1;
        sy = 1;
        sz = 1;
        tx = 0;
        ty = 0;
        tz = 0;
        rx = 0;
    }
    
    if(e.key === "p" && editorMode){
        blockPlacing = basePyramid;
        placing = true;
        sx = 1;
        sy = 1;
        sz = 1;
        tx = 0;
        ty = 0;
        tz = 0;
        rx = 0;
    }
    
    if(e.key === "o" && editorMode){
        blockPlacing = baseSlant;
        placing = true;
        sx = 1;
        sy = 1;
        sz = 1;
        tx = 0;
        ty = 0;
        tz = 0;
        rx = 0;
    }

    if(e.key === "Enter" && editorMode && placing){

        //let blockcolor = prompt("Enter color for the object:", [36, 36, 36]);
        //blockPlacing.color = blockcolor;

        let newObject = JSON.parse(JSON.stringify(blockPlacing));
        for(let i = 0; i < newObject.vertices.length; i++){
            newObject.vertices[i] = multiplyVecMat(newObject.vertices[i], rMatrix);
            newObject.vertices[i] = multiplyVecMat(newObject.vertices[i], tMatrix);
        }
        placedObjects.push(newObject);
        placing = false;
    }

    if(e.key === "Alt" && editorMode){
        let entireMap = map.concat(placedObjects);
        const data = {
            map: entireMap,
            enemies: enemies
        }

        const jsonData = JSON.stringify(data, null, 2);

        saveJSON(jsonData, './map.json');
    }
});

document.addEventListener("click", (e) => {
    e.preventDefault();
    let enemy = null;
    let damage = 0;
    if(e.button == 0){
        enemy = castShot(1000);
        damage = 10;
        shot = true;
        shotTimer = shotDuration;
    } else if(e.button == 2){
        enemy = castShot(10);
        damage = 20;
        punch = true;
        punchStarted = true;
        punchTimer = punchDuration;
    }
    if(enemy != null){
        enemies[enemy].health -= damage;
        if(enemies[enemy].health <= 0){
            console.log("Enemy: " + enemy + " killed");
            enemies.splice(enemy, 1);
            enemiesCount--;
        }
    }
});


let baseEnemy = {
    name: "original",
    health: 100,
    pos: [0, 0, 0],
    vel: [0, 0, 0],
    speed: 0.25,
    grounded: false,
    collisionOffset: 7,
    color: [100, 150, 150],
    vertices: [[2.5, 10, -2.5, 1], [-2.5, 10, -2.5, 1], [-2.5, 0, -2.5, 1], [2.5, 0, -2.5, 1], //Front
    [2.5, 10, 2.5, 1], [-2.5, 10, 2.5, 1], [-2.5, 0, 2.5, 1], [2.5, 0, 2.5, 1]], //Back
    faces: [[0, 1, 2], [0, 2, 3], // Front
    [1, 5, 6], [1, 6, 2], // Right
    [5, 4, 7], [5, 7, 6], // Back
    [4, 0, 3], [4, 3, 7], // Left
    [3, 2, 6], [3, 6, 7], // Top
    [4, 5, 1], [4, 1, 0]] // Bottom
};

let baseCube = {
    name: "cube",
    color: [100, 150, 150],
    vertices: [[10, 10, -10, 1], [-10, 10, -10, 1], [-10, -10, -10, 1], [10, -10, -10, 1], //Front
    [10, 10, 10, 1], [-10, 10, 10, 1], [-10, -10, 10, 1], [10, -10, 10, 1]], //Back
    faces: [[0, 1, 2], [0, 2, 3], // Front
    [1, 5, 6], [1, 6, 2], // Right
    [5, 4, 7], [5, 7, 6], // Back
    [4, 0, 3], [4, 3, 7], // Left
    [3, 2, 6], [3, 6, 7], // Top
    [4, 5, 1], [4, 1, 0]] // Bottom
};

let basePyramid = {
    name: "pyramid",
    color: [100, 150, 150],
    vertices: [[10, 10, 10, 1], [-10, 10, 10, 1], [-10, 10, -10, 1], [10, 10, -10, 1], 
    [0, 0, 0, 1]],
    faces: [[0, 1, 2], [0, 2, 3], // Bottom
    [4, 1, 0], [4, 2, 1], [4, 3, 2], [4, 0, 3]] // Sides
};

let baseSlant = {
    name: "slant",
    color: [0, 150, 60],
    vertices: [[10, 10, -10, 1], [-10, 10, -10, 1], [-10, 0, -10, 1], [10, 0, -10, 1], 
               [10, 10, 10, 1], [-10, 10, 10, 1]],
               faces: [[0, 1, 2], [0, 2, 3], // Front
               [4, 5, 1], [1, 5, 2], // Right
               [4, 5, 0], [4, 0, 3], // Sides
               [3, 2, 4], [2, 5, 4]] // Top
};

//VARIABLE INITIALIZATION
let gravity = 0.1;
let handOverlay;
let punchTimer = 0;
let punch = false;
let punchStarted = false;
const punchDuration = 300;
let shot = false;
let shotTimer = 0;
const shotDuration = 100;
let punchOffset = 0;
let fNear = 1;
let fFar = 100;
let fFov = Math.PI/3;
let mapFaces = [];
let facesToRender = [];
let aspect;
let projMat;
let shaderProgram;
let gunOverlay;

let camera = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
];

let cam = {
    pos: [0, 0, -15, 1],
    yaw: 0,
    pitch: 0,
    sensetivity: 200,
    vel: [0, 0, 0],
    speed: 0.5,
    grounded: true,
    collisionOffset: 5
};

//MAP

let bullets = [];

let placedObjects = [];

let map = [{
    name: "ground",
    color: [36, 36, 36],
    vertices: [[100, 20, -100, 1], [-100, 20, -100, 1], [-100, 10, -100, 1], [100, 10, -100, 1], //Front
               [100, 20, 100, 1], [-100, 20, 100, 1], [-100, 10, 100, 1], [100, 10, 100, 1]], //Back
    faces: [[0, 1, 2], [0, 2, 3], // Front
            [1, 5, 6], [1, 6, 2], // Right
            [5, 4, 7], [5, 7, 6], // Back
            [4, 0, 3], [4, 3, 7], // Left
            [3, 2, 6], [3, 6, 7], // Top
            [4, 5, 1], [4, 1, 0]]  // Bottom
}]; 

let enemies = [{
    name: "original",
    health: 100,
    pos: [0, 0, 0],
    vel: [0, 0, 0],
    speed: 0.25,
    grounded: true,
    collisionOffset: 7,
    color: [100, 150, 150],
    vertices: [[2.5, 10, -2.5, 1], [-2.5, 10, -2.5, 1], [-2.5, 0, -2.5, 1], [2.5, 0, -2.5, 1], //Front
               [2.5, 10, 2.5, 1], [-2.5, 10, 2.5, 1], [-2.5, 0, 2.5, 1], [2.5, 0, 2.5, 1]], //Back
    faces: [[0, 1, 2], [0, 2, 3], // Front
            [1, 5, 6], [1, 6, 2], // Right
            [5, 4, 7], [5, 7, 6], // Back
            [4, 0, 3], [4, 3, 7], // Left
            [3, 2, 6], [3, 6, 7], // Top
            [4, 5, 1], [4, 1, 0]] // Bottom
}]

//TOOLS

function flattenMatrix(matrix) {
    return matrix.reduce((flat, row) => flat.concat(row), []);
}

function subtractVector3(a, b){
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function subtractVector2(a, b){
    return [a[0] - b[0], a[1] - b[1]];
}

function addColor(a, b){
    return [a[0] + b[0] > 255 ? 255: a[0] + b[0], a[1] + b[1] > 255 ? 255: a[1] + b[1], a[2] + b[2] > 255 ? 255: a[2] + b[2]];
}

function addVector3(a, b){
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function normalize(v){
    let length = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
    return length === 0 ? [0, 0, 0] : [v[0] / length, v[1] / length, v[2] / length];
}

function normalize2D(v){
    let length = Math.sqrt(v[0]**2 + v[1]**2);
    return length === 0 ? [0, 0] : [v[0] / length, v[1] / length];
}

function crossProduct(a, b){
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

function dotProduct(a, b){
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function multiplyVecMat(v, m){
    let result = [0, 0, 0, 0];

    for(let i = 0; i < 4; i++){
        result[i] = 
        v[0] * m[i][0] +            
        v[1] * m[i][1] +        
        v[2] * m[i][2] +        
        v[3] * m[i][3];       
    }
    return result;
}

function multiplyMat3(a, b){
    const result = [];
    for (let i = 0; i < 3; i++){
        result[i] = [];
        for(let j = 0; j < 3; j++){
            result[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
        }
    }
    return result;
}

function multiplyMat4(a, b){
    const result = [];
    for (let i = 0; i < 4; i++){
        result[i] = [];
        for(let j = 0; j < 4; j++){
            result[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j] + a[i][3] * b[3][j];
        }
    }
    return result;
}

function vecIntersectsPlane(planePoint, planeNormal, lineStart, lineEnd){
    planeNormal = normalize(planeNormal);
    let planeD = -dotProduct(planeNormal, planePoint);
    let ad = dotProduct(lineStart, planeNormal);
    let bd = dotProduct(lineEnd, planeNormal);
    let t = (-planeD - ad) / (bd - ad);
    let line = subtractVector3(lineEnd, lineStart);
    let lineToIntersect = [line[0] * t, line[1] * t, line[2] * t];
    return [...addVector3(lineStart, lineToIntersect), 1];
}

function distance(p, planePoint, planeNormal){
    return dotProduct(planeNormal, p) - dotProduct(planeNormal, planePoint);
}

function clipTriangleAgainstPlane(planePoint, planeNormal, inTri){
    planeNormal = normalize(planeNormal);

    let insidePoints = [];
    let outsidePoints = [];

    let insidePointCount = 0;
    let outsidePointCount = 0;

    let d0 = distance(inTri[0], planePoint, planeNormal);
    let d1 = distance(inTri[1], planePoint, planeNormal);
    let d2 = distance(inTri[2], planePoint, planeNormal);

    if(d0 >= 0) {insidePoints.push(inTri[0]); insidePointCount++;}
    else {outsidePoints.push(inTri[0]); outsidePointCount++;}
    if(d1 >= 0) {insidePoints.push(inTri[1]); insidePointCount++;}
    else {outsidePoints.push(inTri[1]); outsidePointCount++;}
    if(d2 >= 0) {insidePoints.push(inTri[2]); insidePointCount++;}
    else {outsidePoints.push(inTri[2]); outsidePointCount++;}

    if(insidePointCount === 0){
        return [[], 0];
    }

    if(insidePointCount === 3){
        return [[inTri], 1];
    }

    if(insidePointCount === 1 && outsidePointCount === 2){
        let out1 = vecIntersectsPlane(planePoint, planeNormal, insidePoints[0], outsidePoints[0]);
        let out2 = vecIntersectsPlane(planePoint, planeNormal, insidePoints[0], outsidePoints[1]);
        return [[[insidePoints[0], out1, out2]], 1];
    }

    if(insidePointCount === 2 && outsidePointCount === 1){
        let in1 = vecIntersectsPlane(planePoint, planeNormal, insidePoints[0], outsidePoints[0]);
        let in2 = vecIntersectsPlane(planePoint, planeNormal, insidePoints[1], outsidePoints[0]);
        return [[[insidePoints[0], insidePoints[1], in1], [insidePoints[1], in1, in2]], 2];
    }
}

function createPerspectiveMatrix(fov, aspect, near, far){
    let f = 1 / Math.tan(fov / 2);
    return [
        [f/aspect, 0, 0, 0],
        [0, f, 0, 0],
        [0, 0, (far + near) / (near - far), (2 * near * far) / (near - far)],
        [0, 0, -1, 0]
    ];
}

function createCameraMatrix (cameraPos, pitch, yaw){
    const Rx = [
        [1, 0, 0],
        [0, Math.cos(pitch), -Math.sin(pitch)],
        [0, Math.sin(pitch), Math.cos(pitch)]
    ];

    const Ry = [
        [Math.cos(yaw), 0, Math.sin(yaw)],
        [0, 1, 0],
        [-Math.sin(yaw), 0, Math.cos(yaw)],
    ];

    const R = multiplyMat3(Ry, Rx);

    const Rt = [
        [R[0][0], R[1][0], R[2][0]],
        [R[0][1], R[1][1], R[2][1]],
        [R[0][2], R[1][2], R[2][2]]
    ];

    const tx = -(Rt[0][0] * cameraPos[0] + Rt[0][1] * cameraPos[1] + Rt[0][2] * cameraPos[2]);
    const ty = -(Rt[1][0] * cameraPos[0] + Rt[1][1] * cameraPos[1] + Rt[1][2] * cameraPos[2]);
    const tz = -(Rt[2][0] * cameraPos[0] + Rt[2][1] * cameraPos[1] + Rt[2][2] * cameraPos[2]);

    const viewMatrix = [
        [Rt[0][0], Rt[0][1], Rt[0][2], tx],
        [Rt[1][0], Rt[1][1], Rt[1][2], ty],
        [Rt[2][0], Rt[2][1], Rt[2][2], tz],
        [0,        0,        0,        1]
    ];
    
    return viewMatrix;
}

function shouldCullFace(face){
    let [v1, v2, v3] = face;

    let edge1 = subtractVector3(v2, v1);
    let edge2 = subtractVector3(v3, v1);
    let normal = normalize(crossProduct(edge1, edge2));

    let viewDir = normalize(subtractVector3(cam.pos, v1));

    return [dotProduct(normal, viewDir) > 0, normal];
}

//END TOOLS

//P5 FUNCTIONS
async function preload(){
    gunOverlay = loadImage('/Sources/Images/gun.png');
    handOverlay = loadImage('/Sources/Images/hands.png');
    shaderProgram = loadShader('./Shaders/vert.glsl', './Shaders/frag.glsl');
    try {
        let mapData = await fetch('./_map.json');
        if (!mapData.ok) {
            throw new Error(`Failed to fetch map data: ${mapData.statusText}`);
        }
        let mapJson = await mapData.json();
        map = JSON.parse(mapJson).map;
        console.log("Map loaded successfully");
    } catch (error) {
        console.error("Error loading map:", error);
    }
}

function setup(){
    createCanvas(windowWidth - 20, windowHeight - 20, WEBGL);

    aspect = width/height;
    projMat = createPerspectiveMatrix(fFov, aspect, fNear, fFar);
    for (let i = 0; i < map.length; i++){
        for(let f = 0; f < map[i].faces.length; f++){
            mapFaces.push(
                [map[i].vertices[map[i].faces[f][0]],
                map[i].vertices[map[i].faces[f][1]],
                map[i].vertices[map[i].faces[f][2]], map[i].color]
            );
        };
    };
    // for (let i = 0; i < enemies.length; i++){
    //     for(let f = 0; f < enemies[i].faces.length; f++){
    //         mapFaces.push(
    //             [enemies[i].vertices[enemies[i].faces[f][0]],
    //             enemies[i].vertices[enemies[i].faces[f][1]],
    //             enemies[i].vertices[enemies[i].faces[f][2]], enemies[i].color]
    //         );
    //     };
    // };
}

function draw(){
    moveEnemies();

    spawnTimer += deltaTime;
    if(spawnTimer >= enemySpawnRate && enemiesCount < maxEnemies){
        spawnTimer = 0;
        enemiesCount++;
        enemies.push(JSON.parse(JSON.stringify(baseEnemy)));
    }

    let enemyFaces = [];
    for (let i = 0; i < enemies.length; i++){
        for(let f = 0; f < enemies[i].faces.length; f++){
            enemyFaces.push(
                [enemies[i].vertices[enemies[i].faces[f][0]],
                enemies[i].vertices[enemies[i].faces[f][1]],
                enemies[i].vertices[enemies[i].faces[f][2]], enemies[i].color]
            );
        };
    };
    let placedObjectFaces = [];
    for (let i = 0; i < placedObjects.length; i++){
        for(let f = 0; f < placedObjects[i].faces.length; f++){
            placedObjectFaces.push(
                [placedObjects[i].vertices[placedObjects[i].faces[f][0]],
                placedObjects[i].vertices[placedObjects[i].faces[f][1]],
                placedObjects[i].vertices[placedObjects[i].faces[f][2]], placedObjects[i].color]
            );
        };
    };
    let faces = mapFaces.concat(enemyFaces);
    faces = faces.concat(placedObjectFaces);

    background(64, 3, 3);    
    facesToRender = [];
    getCamPos();
    getKey();
    if(!editorMode){
        checkCollisions(cam);
        gravity = 0.1;
        cam.speed = 0.5;
    } else {
        cam.speed = 1;
        gravity = 0;

        if(placing){
            tMatrix = [[sx, 0, 0, tx],
                       [0, sy, 0, ty],
                       [0, 0, sz, tz],
                       [0, 0, 0, 1]];
            rMatrix = [[Math.cos(rx), 0, Math.sin(rx), 0],
                       [0, 1, 0, 0],
                       [-Math.sin(rx), 0, Math.cos(rx), 0],  
                       [0, 0, 0, 1]];

            let transformedShape = JSON.parse(JSON.stringify(blockPlacing));
            for(let i = 0; i < transformedShape.vertices.length; i++){
                transformedShape.vertices[i] = multiplyVecMat(transformedShape.vertices[i], rMatrix);
                transformedShape.vertices[i] = multiplyVecMat(transformedShape.vertices[i], tMatrix);
            }

            let placingObjectFaces = [];
            for(let f = 0; f < transformedShape.faces.length; f++){
                placingObjectFaces.push(
                    [transformedShape.vertices[transformedShape.faces[f][0]],
                    transformedShape.vertices[transformedShape.faces[f][1]],
                    transformedShape.vertices[transformedShape.faces[f][2]], transformedShape.color]
                );
            };
            faces = faces.concat(placingObjectFaces);
        }
    }
    if(punchStarted){
        punchOffset = 0;
        punchStarted = false;
    }
    movePlayer();
    camera = createCameraMatrix(cam.pos, cam.pitch, cam.yaw);
    if(shotTimer >= 0){
        shotTimer -= deltaTime;
    }

    if(punchTimer >= 0){
        punchTimer -= deltaTime;
    }
    
    //console.log("original: " + camera.length);
    //console.log("flattened: " + flattenMatrix(camera).length);
    
    //shader(shaderProgram);
    
    //shaderProgram.setUniform('uProjectionMatrix', flattenMatrix(projMat));
    //shaderProgram.setUniform('uViewMatrix', flattenMatrix(camera));
    //shaderProgram.setUniform('uLightPos', cam.pos.slice(0, 3));
    //shaderProgram.setUniform('uLightColor', [1.0, 1.0, 1.0]);
    //shaderProgram.setUniform('uAmbientColor', [0.2, 0.2, 0.2]);
    
    for (let i = 0; i < faces.length; i++){
        //prepareFace([faces[i][0], faces[i][1], faces[i][2]], faces[i][3]);
        transformFace([faces[i][0], faces[i][1], faces[i][2]], camera, projMat, width, height, faces[i][3]);
    }
    
    renderTriangles();

    showHealthbars();

    stroke("white");
    strokeWeight(1);
    fill(0, 0, 0, 0)

    let gl = this._renderer.GL;
    gl.disable(gl.DEPTH_TEST);

    // Draw the rect in front of everything
    rect(-2.5, -2.5, 5, 5);
    noFill();
    noStroke();
    
    if(shotTimer > 0){
        stroke(42, 245, 255);
        strokeWeight(5);
        line(0, 0, width / 4, height / 4.3);
        line(0, 0, width / 4, height / 4.3 - 5);
        line(0, 0, width / 4, height / 4.3 - 10);
    } else {
        shot = false;
    }


    if(punchTimer > 0 && punchTimer < 150){
        punchOffset -= 10;
    } else if(punchTimer > 150 && punchTimer < punchDuration){
        punchOffset += 10;
    } else {
        punch = false;
        punchOffset = 0;
    }

    image(gunOverlay, -width/6, -height/6, width/1.5, height/1.5);

    image(handOverlay, -width*2/3 + punchOffset, -height/6 - punchOffset, width/1.5, height/1.25);

    // Re-enable depth test
    gl.enable(gl.DEPTH_TEST);

}

//GAME FUNCTIONS

function getKey(){
    cam.vel[0] = 0;
    cam.vel[1] += gravity;
    cam.vel[2] = 0;

    //W && S
    if(keyIsDown(87) && !keyIsDown(83)){
        cam.vel[0] += Math.sin(cam.yaw);
        cam.vel[2] += Math.cos(cam.yaw);
    } else if(keyIsDown(83) && !keyIsDown(87)){
        cam.vel[0] -= Math.sin(cam.yaw);
        cam.vel[2] -= Math.cos(cam.yaw);
    }

    //A && D
    if(keyIsDown(65) && !keyIsDown(68)){
        cam.vel[2] -= Math.sin(cam.yaw);
        cam.vel[0] += Math.cos(cam.yaw);
    } else if(keyIsDown(68) && !keyIsDown(65)){
        cam.vel[2] += Math.sin(cam.yaw);
        cam.vel[0] -= Math.cos(cam.yaw);
    }
    //SPACE
    if(keyIsDown(32) && cam.grounded && !editorMode){
        cam.vel[1] = -2;
    }
    // EDITORMODE KEYS
    if(keyIsDown(32) && !keyIsDown(16) && editorMode){
        cam.vel[1] = -1;
    } else if(keyIsDown(16) && !keyIsDown(32) && editorMode){
        cam.vel[1] = 1;
    } else if (((!keyIsDown(32) && !keyIsDown(16)) || (keyIsDown(32) && keyIsDown(16))) && editorMode){
        cam.vel[1] = 0;
    }

    if(keyIsDown(38) && editorMode && !keyIsDown(17)){
        tz += 0.5;
    } else if(keyIsDown(40) && editorMode && !keyIsDown(17)){
        tz += -0.5;
    }
    if(keyIsDown(37) && editorMode && !keyIsDown(17)){    
        tx += 0.5;
    } else if(keyIsDown(39) && editorMode && !keyIsDown(17)){
        tx += -0.5;
    }
    if(keyIsDown(66) && editorMode && !keyIsDown(17)){
        ty += 0.5;
    } else if(keyIsDown(86) && editorMode && !keyIsDown(17)){
        ty += -0.5;
    }

    if(keyIsDown(38) && editorMode && keyIsDown(17)){
        sz += 0.1;
    } else if(keyIsDown(40) && editorMode && keyIsDown(17)){
        sz -= 0.1;
    }
    if(keyIsDown(37) && editorMode && keyIsDown(17)){    
        sx += 0.1;
    } else if(keyIsDown(39) && editorMode && keyIsDown(17)){
        sx -= 0.1;
    }
    if(keyIsDown(86) && editorMode && keyIsDown(17)){
        sy += 0.1;
    } else if(keyIsDown(66) && editorMode && keyIsDown(17)){
        sy -= 0.1;
    }

    if(keyIsDown(82) && editorMode && !keyIsDown(17)){
        rx += 0.05;
    } else if(keyIsDown(82) && editorMode && keyIsDown(17)){
        rx -= 0.05;
    }

    //SHIFT
    //if(keyIsDown(16)){
    //    cam.vel[1] += 1;
    //}

    let normalizedVel = normalize2D([cam.vel[0], cam.vel[2]]);
    cam.vel[0] = normalizedVel[0];
    cam.vel[2] = normalizedVel[1];
    cam.vel[0] *= cam.speed;
    cam.vel[2] *= cam.speed;
}

function getCamPos(){
    if(((cam.pitch - movedY/cam.sensetivity) < (Math.PI/2)) && ((cam.pitch - movedY/cam.sensetivity) > (-Math.PI/2))){
        cam.pitch -= movedY/cam.sensetivity;
    };
    cam.yaw -= movedX/cam.sensetivity;
}

function movePlayer(){
    cam.pos[0] += cam.vel[0];
    cam.pos[2] += cam.vel[2];
    cam.pos[1] += cam.vel[1];
}

function moveEnemies(){
    for (let i = 0; i < enemies.length; i++){
        enemies[i].vel = doEnemyAI(enemies[i]);
        enemies[i].vel[1] += gravity;
        checkCollisions(enemies[i]);
        enemies[i].pos = addVector3(enemies[i].pos, enemies[i].vel);
        for (let j = 0; j < enemies[i].vertices.length; j++){
            enemies[i].vertices[j][0] += enemies[i].vel[0];
            enemies[i].vertices[j][1] += enemies[i].vel[1];
            enemies[i].vertices[j][2] += enemies[i].vel[2];
        }
    }
}

function showHealthbars(){
    for (let i = 0; i < enemies.length; i++){
        let enemyScreenPos = multiplyVecMat([...enemies[i].pos, 1], camera);
        let enemyScreenPos2 = multiplyVecMat(enemyScreenPos, projMat);

        if (enemyScreenPos2[3] === 0) continue;

        let ndc = [enemyScreenPos2[0] / enemyScreenPos2[3], enemyScreenPos2[1] / enemyScreenPos2[3], enemyScreenPos2[2] / enemyScreenPos2[3]];

        let screenX = ((ndc[0] + 1)/2) * width;
        let screenY = ((1 - ndc[1])/2) * height;

        let z = ndc[2] * 100;

        screenX = Math.max(50, Math.min(width - 50, screenX));
        screenY = Math.max(20, Math.min(height - 20, screenY));
        if(enemyScreenPos2[2] < 0){

            noStroke();
            fill(255, 0, 0);
            beginShape();
            vertex(screenX - 50 - width/2, screenY - 20 - height/2-50, z);
            vertex(screenX + 50 - width/2, screenY - 20 - height/2-50, z);
            vertex(screenX + 50 - width/2, screenY - 10 - height/2-50, z);
            vertex(screenX - 50 - width/2, screenY - 10 - height/2-50, z);
            endShape(CLOSE);

            // Draw health bar foreground
            fill(0, 255, 0);
            let healthWidth = (enemies[i].health / 100) * 100;
            beginShape();
            vertex(screenX - 50 - width/2, screenY - 20 - height/2-50, z);
            vertex(screenX - 50 + healthWidth - width/2, screenY - 20 - height/2-50, z);
            vertex(screenX - 50 + healthWidth - width/2, screenY - 10 - height/2-50, z);
            vertex(screenX - 50 - width/2, screenY - 10 - height/2-50, z);
            endShape(CLOSE);

        }
    }
}

function doEnemyAI(enemy) {
    let directionToPlayer = subtractVector3(cam.pos, enemy.pos);

    let normalizedDirection = normalize(directionToPlayer);

    if(Math.sqrt((enemy.pos[0] - cam.pos[0])**2 + (enemy.pos[2] - cam.pos[2])**2) < 5){
        return [0, 0, 0]; // Enemy is too far away, do not move'
    }

    let newVel = [0, enemy.vel[1], 0];

    newVel[0] = normalizedDirection[0] * enemy.speed;
    newVel[2] = normalizedDirection[2] * enemy.speed;

    return newVel;
}

function checkCollisions(entity){
    const COLLISION_OFFSET = entity.collisionOffset; // Default to 5 if not specified
    const GROUND_THRESHOLD = 0.7;
    const STEP_HEIGHT = COLLISION_OFFSET - 3;
    let isGrounded = false;

    collidingFaces = map.concat(enemies);
 
    for (let i = 0; i < collidingFaces.length; i++){
        let crossingNormal = [0, 0, 0];
        let insidePlanes = 0;
        let step = false;
        for (let face = 0; face < collidingFaces[i].faces.length; face++){
            let plane = [
                collidingFaces[i].vertices[collidingFaces[i].faces[face][0]], 
                collidingFaces[i].vertices[collidingFaces[i].faces[face][1]], 
                collidingFaces[i].vertices[collidingFaces[i].faces[face][2]]
            ];
         
            let planeNormal = normalize(crossProduct(
                subtractVector3(plane[1], plane[0]), 
                subtractVector3(plane[2], plane[0])
            ));
         
            let planePoint = plane[0];
            let footPos = [entity.pos[0], entity.pos[1] + COLLISION_OFFSET, entity.pos[2]];
            //let headPos = [entity.pos[0], entity.pos[1] - COLLISION_OFFSET, entity.pos[2]];
            let nextPosFoot = addVector3(footPos, entity.vel);
            //let nextPosHead = addVector3(headPos, entity.vel);
            let dFoot = distance(nextPosFoot, planePoint, planeNormal);

            if(distance(addVector3([entity.pos[0], entity.pos[1] + STEP_HEIGHT, entity.pos[2]], entity.vel), planePoint, planeNormal) < -2){
                step = true;
            }

            //let dHead = distance(nextPosHead, planePoint, planeNormal);
            if(dFoot >= -2){
                insidePlanes++;
                if(distance(footPos, planePoint, planeNormal) < -2){
                    crossingNormal = planeNormal;
                }
            }
        }
        if(insidePlanes == collidingFaces[i].faces.length){
            let normalVelocity = dotProduct(entity.vel, crossingNormal);
            let newVel = subtractVector3(entity.vel, crossingNormal.map(val => val * normalVelocity));
            entity.vel = newVel;

            if(step && crossingNormal[1] < GROUND_THRESHOLD && entity.grounded){
                if(entity == cam){
                    entity.pos[1] -= STEP_HEIGHT;
                }
                entity.pos[1] -= STEP_HEIGHT;
                if(entity != cam){
                    for(let j = 0; j < entity.vertices.length; j++){
                        entity.vertices[j][1] -= STEP_HEIGHT;
                    }
                }
            }

            if(crossingNormal[1] > GROUND_THRESHOLD){
                isGrounded = true;

                let gravityComponent = [0, gravity, 0];
                let normalComponent = dotProduct(gravityComponent, crossingNormal);
                let projectedGravity = subtractVector3(gravityComponent, crossingNormal.map(val => val * normalComponent));
                entity.vel = subtractVector3(entity.vel, projectedGravity);
            }
        }
    }
    entity.grounded = isGrounded;
}

// function movePlayer() {
//     // Predict next position

//     let footPos = [cam.pos[0], cam.pos[1] + 5, cam.pos[2]];

//     let nextPos = addVector3(footPos, cam.vel);

//     // Check for collisions along the movement vector
//     checkCollisionsSegment(footPos, nextPos, map, 2);

//     cam.pos = addVector3(cam.pos, cam.vel);
// }

// // Segment (swept) collision check
// function checkCollisionsSegment(start, end, meshList = map, radius = 2) {
//     cam.grounded = false;
//     for (const mesh of meshList) {
//         for (const face of mesh.faces) {
//             const a = mesh.vertices[face[2]];
//             const b = mesh.vertices[face[1]];
//             const c = mesh.vertices[face[0]];

//             // Plane normal
//             const normal = normalize(crossProduct(
//                 subtractVector3(b, a),
//                 subtractVector3(c, a)
//             ));

//             if (normal[0] === 0 && normal[1] === 0 && normal[2] === 0) {
//                 //console.error("Invalid plane normal: vertices may be collinear or degenerate.");
//                 continue; // Skip this face
//             }

//             // Compute intersection of movement segment with plane
//             const planeD = -dotProduct(normal, a);
//             const startDist = dotProduct(normal, start) + planeD;
//             const endDist = dotProduct(normal, end) + planeD;

//             // If segment crosses the plane
//             if ((startDist >= radius && endDist <= radius) || (startDist <= radius && endDist >= radius)) {
//                 // Find intersection point
//                 let t = startDist / (startDist - endDist);
//                 let intersection = [
//                     start[0] + (end[0] - start[0]) * t,
//                     start[1] + (end[1] - start[1]) * t,
//                     start[2] + (end[2] - start[2]) * t
//                 ];

//                 // Check if intersection is inside triangle
//                 if (pointInTriangle(intersection, a, b, c)) {

//                     //cam.pos[0] = intersection[0];
//                     //cam.pos[1] = intersection[1] + 5;q
//                     //cam.pos[2] = intersection[2];

//                     let vDotN = dotProduct(cam.vel, normal);
//                     cam.vel = subtractVector3(cam.vel, normal.map(n => n * vDotN));
//                     if(normal[1] < -0.7){
//                         cam.grounded = true;
                    
//                         let gravityComponent = [0, gravity, 0];
//                         let normalComponent = dotProduct(gravityComponent, normal);
//                         let projectedGravity = subtractVector3(gravityComponent, normal.map(val => val * normalComponent));
                    
//                         cam.vel = subtractVector3(cam.vel, projectedGravity);
//                     }
//                 }
//             }
//         }
//     }
// }

// function pointInTriangle(p, a, b, c) {
//     // All are 3D vectors
//     const v0 = subtractVector3(c, a);
//     const v1 = subtractVector3(b, a);
//     const v2 = subtractVector3(p, a);

//     const dot00 = dotProduct(v0, v0);
//     const dot01 = dotProduct(v0, v1);
//     const dot02 = dotProduct(v0, v2);
//     const dot11 = dotProduct(v1, v1);
//     const dot12 = dotProduct(v1, v2);

//     const denom = dot00 * dot11 - dot01 * dot01;
//     if (denom === 0) return false; // Degenerate triangle

//     const u = (dot11 * dot02 - dot01 * dot12) / denom;
//     const v = (dot00 * dot12 - dot01 * dot02) / denom;

//     const epsilon = 1e-6;
//     return (u >= -epsilon) && (v >= -epsilon) && (u + v <= 1 + epsilon);
// }

// function prepareFace(face, color){
//     let v1 = face[0];
//     let v2 = face[1];
//     let v3 = face[2];

//     let cull = shouldCullFace([v1, v2, v3], cam.pos);
//     if(cull[0]){
//         return;
//     }

    //let clippedTriangles = clipTriangleAgainstPlane([0, 0, fNear], [0, 0, 1], [v1, v2, v3]);

    //for(let i = 0; i < clippedTriangles[1]; i++){
    //    facesToRender.push([clippedTriangles[0][i][0], clippedTriangles[0][i][1], clippedTriangles[0][i][2], color]);
    //}

//     facesToRender.push([v1, v2, v3, color]);
// }

function transformFace(face, camera, projection, width, height, color){
    let transformed1 = face[0];
    let transformed2 = face[1];
    let transformed3 = face[2];

    let cull = shouldCullFace([transformed1, transformed2, transformed3], cam.pos);
    if(cull[0]){
        return;
    }

    let lightDir = normalize([cam.pos[0] - transformed1[0], cam.pos[1] - transformed1[1], cam.pos[2] - transformed1[2]]);
    lightDir = normalize(lightDir);

    normal = cull[1];

    let lightDP = dotProduct(lightDir, normal);

    let lighting = -70*lightDP;

    color = addColor(color, [lighting, lighting, lighting]);
    
    transformed1 = multiplyVecMat(transformed1, camera);
    transformed2 = multiplyVecMat(transformed2, camera);
    transformed3 = multiplyVecMat(transformed3, camera);

    let clippedTriangles = clipTriangleAgainstPlane([0, 0, fNear], [0, 0, 1], [transformed1, transformed2, transformed3]);

    for (let i = 0; i < clippedTriangles[1]; i++){
        let clipped = clippedTriangles[0][i];
        
        transformed1 = multiplyVecMat(clipped[0], projection);
        transformed2 = multiplyVecMat(clipped[1], projection);
        transformed3 = multiplyVecMat(clipped[2], projection);
        
        let z1 = transformed1[2] / transformed1[3] * 100;
        let z2 = transformed2[2] / transformed2[3] * 100;
        let z3 = transformed3[2] / transformed3[3] * 100;
        
        const ndc1 = transformed1.map(val => val / transformed1[3]);
        const screenX1 = ((ndc1[0] + 1) / 2) * width;
        const screenY1 = ((1 - ndc1[1]) / 2) * height;
        
        const ndc2 = transformed2.map(val => val / transformed2[3]);
        const screenX2 = ((ndc2[0] + 1) / 2) * width;
        const screenY2 = ((1 - ndc2[1]) / 2) * height;
        
        const ndc3 = transformed3.map(val => val / transformed3[3]);
        const screenX3 = ((ndc3[0] + 1) / 2) * width;
        const screenY3 = ((1 - ndc3[1]) / 2) * height;

        facesToRender.push([[screenX1, screenY1, z1], [screenX2, screenY2, z2], [screenX3, screenY3, z3], color]);
    }
}


function renderTriangles() {
    //shader(shader);
//
    //shader.setUniform('u_lightPos', [cam.pos[0], cam.pos[1], cam.pos[2]]);
    //shader.setUniform('u_lightColor', [1.0, 1.0, 1.0]);
    //shader.setUniform('u_ambientColor', [0.2, 0.2, 0.2]);

    for (let i = 0; i < facesToRender.length; i++){
        
        let face = facesToRender[i];

        let edge1 = subtractVector3(face[1], face[0]);
        let edge2 = subtractVector3(face[2], face[0]);
        let normalLine = normalize(crossProduct(edge1, edge2));
        noStroke();
        fill(face[3]);

        beginShape(TRIANGLES);

        fill(face[3]);
        //normal(normalLine[0], normalLine[1], normalLine[2]);
        vertex(face[0][0] - width/2, face[0][1] - height/2, face[0][2]);

        fill(face[3]);
        //normal(normalLine[0], normalLine[1], normalLine[2]);
        vertex(face[1][0] - width/2, face[1][1] - height/2, face[1][2]);

        fill(face[3]);
        //normal(normalLine[0], normalLine[1], normalLine[2]);
        vertex(face[2][0] - width/2, face[2][1] - height/2, face[2][2]);

        endShape(CLOSE);
        //triangle(face[0][0], face[0][1], face[1][0], face[1][1], face[2][0], face[2][1]);

        
    }
}

function castShot(distance) {
    const origin = cam.pos.slice(0, 3); // Camera position
    const direction = normalize([
        Math.cos(cam.pitch) * Math.sin(cam.yaw),
        -Math.sin(cam.pitch),
        Math.cos(cam.pitch) * Math.cos(cam.yaw)
    ]); // Camera direction

    const maxDistance = distance; // Maximum ray distance
    const enemy = castRay(origin, direction, maxDistance);

    if (enemy != null) {
        console.log("Looking at enemy at index:", enemy);
        return enemy;
    } else {
        console.log("No enemy in sight.");
        return null;
    }
}

function castRay(origin, direction, maxDistance) {
    let closestIndex = null;
    let closestDistance = maxDistance;

    for (let i = 0; i < map.length; i++) {
        const block = map[i];

        for (let face of block.faces) {
            const v1 = block.vertices[face[0]];
            const v2 = block.vertices[face[1]];
            const v3 = block.vertices[face[2]];

            const intersection = rayIntersectsTriangle(origin, direction, v1, v2, v3);

            if (intersection) {
                const distance = Math.sqrt(
                                              Math.pow(intersection[0] - origin[0], 2) +
                                              Math.pow(intersection[1] - origin[1], 2) +
                                              Math.pow(intersection[2] - origin[2], 2)
                                          );
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = null;
                }
            }
        }
    }

    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];

        for (let face of enemy.faces) {
            const v1 = enemy.vertices[face[0]];
            const v2 = enemy.vertices[face[1]];
            const v3 = enemy.vertices[face[2]];

            const intersection = rayIntersectsTriangle(origin, direction, v1, v2, v3);

            if (intersection) {
                const distance = Math.sqrt(
                                              Math.pow(intersection[0] - origin[0], 2) +
                                              Math.pow(intersection[1] - origin[1], 2) +
                                              Math.pow(intersection[2] - origin[2], 2)
                                          );
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = i;
                }
            }
        }
    }

    if(editorMode){
        let closestZappedBlockDistance = maxDistance;
        let closestZappedIndex;
        for (let i = 0; i < placedObjects.length; i++) {
            const placedObject = placedObjects[i];

            for (let face of placedObject.faces) {
                const v1 = placedObject.vertices[face[0]];
                const v2 = placedObject.vertices[face[1]];
                const v3 = placedObject.vertices[face[2]];

                const intersection = rayIntersectsTriangle(origin, direction, v1, v2, v3);

                if (intersection) {
                    const distance = Math.sqrt(
                                                  Math.pow(intersection[0] - origin[0], 2) +
                                                  Math.pow(intersection[1] - origin[1], 2) +
                                                  Math.pow(intersection[2] - origin[2], 2)
                                              );
                    if (distance < closestDistance) {
                        closestZappedBlockDistance = distance;
                        closestZappedIndex = i;
                    }
                }
            }
        }
        if(closestZappedIndex != null){
            placedObjects.splice(closestZappedIndex, 1);
        }
        return null;
    }

    if(closestIndex != null){
        return closestIndex;
    }
}

function rayIntersectsTriangle(origin, direction, v1, v2, v3) {
    const edge1 = subtractVector3(v2, v1);
    const edge2 = subtractVector3(v3, v1);
    const h = crossProduct(direction, edge2);
    const a = dotProduct(edge1, h);

    if (Math.abs(a) < 1e-4) {
        return null; // Ray is parallel to the triangle
    }

    const f = 1 / a;
    const s = subtractVector3(origin, v1);
    const u = f * dotProduct(s, h);

    if (u < 0 || u > 1) {
        return null; // Intersection is outside the triangle
    }

    const q = crossProduct(s, edge1);
    const v = f * dotProduct(direction, q);

    if (v < 0 || u + v > 1) {
        return null; // Intersection is outside the triangle
    }

    const t = f * dotProduct(edge2, q);

    if (t > 1e-6) {
        // Intersection point
        return addVector3(origin, direction.map(d => d * t));
    }

    return null; // No intersection
}

// function showBullets(){
//     for (let i = 0; i < bullets.length; i++){
//         bullets[i].pos[0] += bullets[i].vel[0] * bullets[i].speed;
//         bullets[i].pos[1] += bullets[i].vel[1] * bullets[i].speed;
//         bullets[i].pos[2] += bullets[i].vel[2] * bullets[i].speed;

//         let bulletScreenPos = multiplyVecMat([...bullets[i].pos, 1], camera);
//         let bulletScreenPos2 = multiplyVecMat(bulletScreenPos, projMat);
//         let z = bulletScreenPos2[2];
//         let ndc = bulletScreenPos2.map(val => val / bulletScreenPos2[3]);
//         let screenX = ((ndc[0] + 1) / 2) * width;
//         let screenY = ((1 - ndc[1]) / 2) * height;
//         let distance = Math.sqrt(
//             Math.pow(bullets[i].pos[0] - cam.pos[0], 2) +
//             Math.pow(bullets[i].pos[1] - cam.pos[1], 2) +
//             Math.pow(bullets[i].pos[2] - cam.pos[2], 2)
//         );

//         console.log(distance)
//         if(distance > 1000){
//             bullets.splice(i, 1);
//             i--;
//             continue;
//         }

//         beginShape();
//         fill(0, 0, 0);
//         strokeWeight(z);
//         point(screenX - width/2, screenY - height/2, z + 1000);

//         endShape(CLOSE);

//     }
// }

// function shootBullet(){
//     let bullet = {
//         pos: [cam.pos[0], cam.pos[1], cam.pos[2]],
//         vel: [Math.cos(cam.pitch) * Math.sin(cam.yaw), -Math.sin(cam.pitch), Math.cos(cam.pitch) * Math.cos(cam.yaw)],
//         speed: 5
//     }
//     bullets.push(bullet);
// }