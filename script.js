//PAUSE GAME WITH Q
let paused = false;
document.addEventListener("keydown", (e) => {
    if (e.key === "q") {
        paused = !paused;
        if(paused){
            document.body.requestPointerLock();
        } else {
            document.exitPointerLock();
        }
    }
});

document.addEventListener("click", (e) => {
    castShot();
    console.log("click");
});
        

//VARIABLE INITIALIZATION
let gravity = 0.1;
let fNear = 1;
let fFar = 100;
let fFov = Math.PI/3;
let mapFaces = [];
let facesToRender = [];
let aspect;
let projMat;
let shaderProgram;

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
    grounded: true
};

//MAP
let map = [{
    name: "cube",
    color: [120, 108, 155],
    vertices: [[10, 10, 30, 1], [-10, 10, 30, 1], [-10, -10, 30, 1], [10, -10, 30, 1], //Front
               [10, 10, 50, 1], [-10, 10, 50, 1], [-10, -10, 50, 1], [10, -10, 50, 1]], //Back
    faces: [[0, 1, 2], [0, 2, 3], // Front
            [1, 5, 6], [1, 6, 2], // Right
            [5, 4, 7], [5, 7, 6], // Back
            [4, 0, 3], [4, 3, 7], // Left
            [3, 2, 6], [3, 6, 7], // Top
            [4, 5, 1], [4, 1, 0]] // Bottom
}, {
    name: "cube",
    color: [2, 7, 93],
    vertices: [[30, 10, 30, 1], [20, 10, 30, 1], [20, -10, 30, 1], [30, -10, 30, 1], //Front
               [30, 10, 50, 1], [20, 10, 50, 1], [20, -10, 50, 1], [30, -10, 50, 1]], //Back
    faces: [[0, 1, 2], [0, 2, 3], // Front
            [1, 5, 6], [1, 6, 2], // Right
            [5, 4, 7], [5, 7, 6], // Back
            [4, 0, 3], [4, 3, 7], // Left
            [3, 2, 6], [3, 6, 7], // Top
            [4, 5, 1], [4, 1, 0]]  // Bottom
}, {
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
}, {
    name: "slant",
    color: [0, 150, 60],
    vertices: [[-30, 10, -40, 1], [-40, 10, -40, 1], [-40, 0, -40, 1], [-30, 0, -40, 1], 
               [-30, 10, -10, 1], [-40, 10, -10, 1]],
    faces: [[0, 1, 2], [0, 2, 3], // Front
            [4, 5, 1], [1, 5, 2], // Right
            [4, 5, 0], [4, 0, 3], // Top
            [3, 2, 4], [2, 5, 4]] // Bottom
}, {
    name: "pyramid",
    color: [200, 0, 0],
    vertices: [[-10, 10, -40, 1], [-20, 10, -30, 1], [-10, 10, -20, 1], [0, 10, -30, 1], 
               [-10, 0, -30, 1]],
    faces: [[2, 1, 0], [3, 2, 0], // Bottom
            [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]] // Sides
}, {
    name: "slanted box",
    color: [200, 0, 200],
    vertices: [[40, 10, -30, 1], [30, 10, -20, 1], [20, 10, -30, 1], [30, 10, -40, 1], //Front
               [40, 0, -30, 1], [30, 0, -20, 1], [20, 0, -30, 1], [30, 0, -40, 1]],
    faces: [[0, 1, 2], [0, 2, 3], // Frontw
            [1, 5, 6], [1, 6, 2], // Right
            [5, 4, 7], [5, 7, 6], // Back
            [4, 0, 3], [4, 3, 7], // Left
            [3, 2, 6], [3, 6, 7], // Top
            [4, 5, 1], [4, 1, 0]] // Sides
}, {
    name: "box",
    color: [0, 200, 200],
    vertices: [[50, 10, 50, 1], [45, 10, 50, 1], [45, 5, 50, 1], [50, 5, 50, 1], //Front
               [50, 10, 55, 1], [45, 10, 55, 1], [45, 5, 55, 1], [50, 5, 55, 1]],
    faces: [[0, 1, 2], [0, 2, 3], // Front
            [1, 5, 6], [1, 6, 2], // Right
            [5, 4, 7], [5, 7, 6], // Back
            [4, 0, 3], [4, 3, 7], // Left
            [3, 2, 6], [3, 6, 7], // Top
            [4, 5, 1], [4, 1, 0]] // Bottoma
}]; 

let enemies = [{
    name: "original",
    health: 100,
    pos: [0, 0, 0],
    vel: [0, 0, 0],
    speed: 0.5,
    grounded: true,
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
function preload(){
    shaderProgram = loadShader('./Shaders/vert.glsl', './Shaders/frag.glsl');
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
    let faces = mapFaces.concat(enemyFaces);

    background('skyBlue');    
    facesToRender = [];
    getCamPos();
    getKey();
    movePlayer();
    camera = createCameraMatrix(cam.pos, cam.pitch, cam.yaw);

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

    stroke("white");
    strokeWeight(0.5);
    fill(0, 0, 0, 0)
    beginShape();

        fill(0, 0, 0, 0);
        
        vertex(-1, -1, 700);
        vertex(1, -1, 700);
        vertex(1, 1, 700);
        vertex(-1, 1, 700);



    endShape(CLOSE);
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
    if(keyIsDown(32) && cam.grounded){
        cam.vel[1] = -2;
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

//function movePlayer(){
//    cam.pos[0] += cam.vel[0];
//    cam.pos[2] += cam.vel[2];
//    cam.pos[1] += cam.vel[1];
//}

function moveEnemies(){
    for (let i = 0; i < enemies.length; i++){
        enemies[i].vel = [0.1, 0, 0.1];
        //checkCollisions(enemies[i]);
        enemies[i].pos = addVector3(enemies[i].pos, enemies[i].vel);
        for (let j = 0; j < enemies[i].vertices.length; j++){
            enemies[i].vertices[j][0] += enemies[i].vel[0];
            enemies[i].vertices[j][1] += enemies[i].vel[1];
            enemies[i].vertices[j][2] += enemies[i].vel[2];
        }
    }
}

function doEnemyAI(enemy){}

// function checkCollisions(entity){
//     const COLLISION_OFFSET = 5;
//     const GROUND_THRESHOLD = 0.7;
//     let isGrounded = false;
    
//     for (let i = 0; i < map.length; i++){
//         let crossingNormal = [0, 0, 0];
//         let insidePlanes = 0;

//         for (let face = 0; face < map[i].faces.length; face++){
//             let plane = [
//                 map[i].vertices[map[i].faces[face][0]], 
//                 map[i].vertices[map[i].faces[face][1]], 
//                 map[i].vertices[map[i].faces[face][2]]
//             ];
            
//             let planeNormal = normalize(crossProduct(
//                 subtractVector3(plane[1], plane[0]), 
//                 subtractVector3(plane[2], plane[0])
//             ));
            
//             let planePoint = plane[0];
//             let footPos = [entity.pos[0], entity.pos[1] + COLLISION_OFFSET, entity.pos[2]];
//             //let headPos = [entity.pos[0], entity.pos[1] - COLLISION_OFFSET, entity.pos[2]];
//             let nextPosFoot = addVector3(footPos, entity.vel);
//             //let nextPosHead = addVector3(headPos, entity.vel);

//             let dFoot = distance(nextPosFoot, planePoint, planeNormal);
//             //let dHead = distance(nextPosHead, planePoint, planeNormal);
//             if(dFoot >= -2){
//                 insidePlanes++;
//                 if(distance(footPos, planePoint, planeNormal) < -2){
//                     crossingNormal = planeNormal;
//                 }
//             }
//         }

//         if(insidePlanes == map[i].faces.length){
//             let normalVelocity = dotProduct(entity.vel, crossingNormal);
//             let newVel = subtractVector3(entity.vel, crossingNormal.map(val => val * normalVelocity));
//             entity.vel = newVel;
//             if(crossingNormal[1] > GROUND_THRESHOLD){
//                 isGrounded = true;

//                 let gravityComponent = [0, gravity, 0];
//                 let normalComponent = dotProduct(gravityComponent, crossingNormal);
//                 let projectedGravity = subtractVector3(gravityComponent, crossingNormal.map(val => val * normalComponent));

//                 entity.vel = subtractVector3(entity.vel, projectedGravity);
//             }
//         }
//     }
//     entity.grounded = isGrounded;
// }

function movePlayer() {
    // Predict next position

    let footPos = [cam.pos[0], cam.pos[1] + 5, cam.pos[2]];

    let nextPos = addVector3(footPos, cam.vel);

    // Check for collisions along the movement vector
    checkCollisionsSegment(footPos, nextPos, map, 2);

    cam.pos = addVector3(cam.pos, cam.vel);
}

// Segment (swept) collision check
function checkCollisionsSegment(start, end, meshList = map, radius = 2) {
    cam.grounded = false;
    for (const mesh of meshList) {
        for (const face of mesh.faces) {
            const a = mesh.vertices[face[2]];
            const b = mesh.vertices[face[1]];
            const c = mesh.vertices[face[0]];

            // Plane normal
            const normal = normalize(crossProduct(
                subtractVector3(b, a),
                subtractVector3(c, a)
            ));

            // Compute intersection of movement segment with plane
            const planeD = -dotProduct(normal, a);
            const startDist = dotProduct(normal, start) + planeD;
            const endDist = dotProduct(normal, end) + planeD;

            // If segment crosses the plane
            if ((startDist >= radius && endDist <= radius) || (startDist <= radius && endDist >= radius)) {
                // Find intersection point
                let t = startDist / (startDist - endDist);
                let intersection = [
                    start[0] + (end[0] - start[0]) * t,
                    start[1] + (end[1] - start[1]) * t,
                    start[2] + (end[2] - start[2]) * t
                ];

                // Check if intersection is inside triangle
                if (pointInTriangle(intersection, a, b, c)) {

                    //cam.pos[0] = intersection[0];
                    //cam.pos[1] = intersection[1] + 5;
                    //cam.pos[2] = intersection[2];

                    let vDotN = dotProduct(cam.vel, normal);
                    cam.vel = subtractVector3(cam.vel, normal.map(n => n * vDotN));
                    if(normal[1] < -0.7){
                        cam.grounded = true;
                    
                        let gravityComponent = [0, gravity, 0];
                        let normalComponent = dotProduct(gravityComponent, normal);
                        let projectedGravity = subtractVector3(gravityComponent, normal.map(val => val * normalComponent));
                    
                        cam.vel = subtractVector3(cam.vel, projectedGravity);
                    }
                }
            }
        }
    }
}

function pointInTriangle(p, a, b, c) {
    // All are 3D vectors
    const v0 = subtractVector3(c, a);
    const v1 = subtractVector3(b, a);
    const v2 = subtractVector3(p, a);

    const dot00 = dotProduct(v0, v0);
    const dot01 = dotProduct(v0, v1);
    const dot02 = dotProduct(v0, v2);
    const dot11 = dotProduct(v1, v1);
    const dot12 = dotProduct(v1, v2);

    const denom = dot00 * dot11 - dot01 * dot01;
    if (denom === 0) return false; // Degenerate triangle

    const u = (dot11 * dot02 - dot01 * dot12) / denom;
    const v = (dot00 * dot12 - dot01 * dot02) / denom;

    return (u >= 0) && (v >= 0) && (u + v <= 1);
}

function prepareFace(face, color){
    let v1 = face[0];
    let v2 = face[1];
    let v3 = face[2];

    let cull = shouldCullFace([v1, v2, v3], cam.pos);
    if(cull[0]){
        return;
    }

    //let clippedTriangles = clipTriangleAgainstPlane([0, 0, fNear], [0, 0, 1], [v1, v2, v3]);

    //for(let i = 0; i < clippedTriangles[1]; i++){
    //    facesToRender.push([clippedTriangles[0][i][0], clippedTriangles[0][i][1], clippedTriangles[0][i][2], color]);
    //}

    facesToRender.push([v1, v2, v3, color]);
}

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

function castShot() {
    const origin = cam.pos.slice(0, 3); // Camera position
    const direction = normalize([
        Math.cos(cam.pitch) * Math.sin(cam.yaw),
        -Math.sin(cam.pitch),
        Math.cos(cam.pitch) * Math.cos(cam.yaw)
    ]); // Camera direction

    const maxDistance = 1000; // Maximum ray distance
    const enemy = castRay(origin, direction, maxDistance);

    if (enemy != null) {
        console.log("Looking at enemy at index:", enemy);
    } else {
        console.log("No enemy in sight.");
    }
}

function castRay(origin, direction, maxDistance) {
    let closestEnemy = null;
    let closestIndex = null;
    let closestDistance = maxDistance;

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
                    closestEnemy = enemy;
                    closestIndex = i;
                }
            }
        }
    }
    return closestIndex;
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