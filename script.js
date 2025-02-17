//import { Matrix, Vector } from './Scripts/tools.js';
//import { createPerspectiveMatrix, transformPoint } from './Scripts/renderer.js';

let projection;
let zBuffer;
let zBufferCopy;
let facesToRender;

let cam = {
    pos: [0, 0, 0, 1],
    yaw: 0,
    pitch: 0,
    sensetivity: 100,
    xv: 0,
    yv: 0,
    zv: 0,
    speed: 0.5
};
let player = {
    paused: false
}

let camera = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
];

let map = [{
    name: "cube",
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
    vertices: [[30, 10, 30, 1], [20, 10, 30, 1], [20, -10, 30, 1], [30, -10, 30, 1], //Front
               [30, 10, 50, 1], [20, 10, 50, 1], [20, -10, 50, 1], [30, -10, 50, 1]], //Back
    faces: [[0, 1, 2], [0, 2, 3], // Front
            [1, 5, 6], [1, 6, 2], // Right
            [5, 4, 7], [5, 7, 6], // Back
            [4, 0, 3], [4, 3, 7], // Left
            [3, 2, 6], [3, 6, 7], // Top
            [4, 5, 1], [4, 1, 0]]  // Bottom
}]; 


//TOOLS

function subtractVectors(a, b){
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function addVectors(a, b){
    return [(a[0] + (10*b[0])), (a[1] + (10*b[1])), (a[2] + (10*b[2]))];
}

function normalize(v){
    let length = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
    return length === 0 ? [0, 0, 0] : [v[0] / length, v[1] / length, v[2] / length];
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

function multiplyVectors(vector, matrix){
    let result = [0, 0, 0, 0];

    for(let i = 0; i < 4; i++){
        result[i] = 
        vector[0] * matrix[i][0] +            
        vector[1] * matrix[i][1] +        
        vector[2] * matrix[i][2] +        
        vector[3] * matrix[i][3];       
    }
    
    return result;
}

function multiplyMatrix3(a, b){
    const result = [];
    for (let i = 0; i < 3; i++){
        result[i] = [];
        for(let j = 0; j < 3; j++){
            result[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
        }
    }
    return result;
}

function barycentricCoords(x, y, v0, v1, v2) {
    let denom = (v1[1] - v2[1]) * (v0[0] - v2[0]) + (v2[0] - v1[0]) * (v0[1] - v2[1]);
    let alpha = ((v1[1] - v2[1]) * (x - v2[0]) + (v2[0] - v1[0]) * (y - v2[1])) / denom;
    let beta = ((v2[1] - v0[1]) * (x - v2[0]) + (v0[0] - v2[0]) * (y - v2[1])) / denom;
    let gamma = 1 - alpha - beta;
    return [alpha, beta, gamma];
}

//P5 FUNCTIONS

function setup(){
    zBuffer = Array(width).fill().map(() => Array(height).fill(Infinity));
    zBufferCopy = zBuffer;
    createCanvas(windowWidth-8, windowHeight- 8);
    background("black");
    projection = createPerspectiveMatrix(Math.PI/3, width/height, 0, 100)
    requestPointerLock();
    facesToRender = [];
    for (let i = 0; i < map.length; i++){
        for(let f = 0; f < map[i].faces.length; f++){
            facesToRender.push(
                [map[i].vertices[map[i].faces[f][0]],
                map[i].vertices[map[i].faces[f][1]],
                map[i].vertices[map[i].faces[f][2]]]
            );
        }
    }
}

function draw(){
    //zBuffer = zBufferCopy;
    background("black");
    getCamPos();
    getKey();
    movePlayer();
    let view = createCameraMatrix(cam.pos, cam.pitch, cam.yaw);
    //loadPixels();
    for (let i = 0; i < facesToRender.length; i++){
        let p1 = facesToRender[i][0];
        let p2 = facesToRender[i][1];
        let p3 = facesToRender[i][2];
        let tface = transformFace([p1, p2, p3], camera, projection, view, width, height);
        if(!tface[3]){
            //strokeWeight(1);
            //stroke(tface[4], tface[4], tface[4]);
            //fill(tface[4], tface[4], tface[4]);
            //triangle(tface[0][0], tface[0][1], tface[1][0], tface[1][1],tface[2][0], tface[2][1]);
            drawTriangle(tface, color(tface[4], tface[4], tface[4]));
        }
    }
    updatePixels();
    //for(let i = 0; i < map.length; i++){
    //    for(let f = 0; f < map[i].faces.length; f++){
    //        let p1 = map[i].vertices[map[i].faces[f][0]];
    //        let p2 = map[i].vertices[map[i].faces[f][1]];
    //        let p3 = map[i].vertices[map[i].faces[f][2]];
    //        let tface = transformFace([p1, p2, p3], camera, projection, view, width, height);
    //        if(!tface[3]){
    //                //stroke("white");
    //                strokeWeight(1);
    //                //line(tface[0][0], tface[0][1], tface[1][0], tface[1][1]);
    //                //line(tface[2][0], tface[2][1], tface[1][0], tface[1][1]);
    //                //line(tface[0][0], tface[0][1], tface[2][0], tface[2][1]);
    //                stroke(tface[4], tface[4], tface[4]);
    //                fill(tface[4], tface[4], tface[4]);
    //                //stroke(100, 100, 100);
    //                triangle(tface[0][0], tface[0][1], tface[1][0], tface[1][1],tface[2][0], tface[2][1]);
    //        }
    //    }
    //    
    //}
}

//INPUT

function getCamPos(){

    if(((cam.pitch - movedY/cam.sensetivity) < (Math.PI/2)) && ((cam.pitch - movedY/cam.sensetivity) > (-Math.PI/2))){
        cam.pitch -= movedY/cam.sensetivity;
    };
    cam.yaw -= movedX/cam.sensetivity;
    //console.log(cam.yaw, cam.pitch);
}

function getKey(){
    cam.xv = 0;
    cam.zv = 0;

    //W && S
    if(keyIsDown(87) && !keyIsDown(83)){
        cam.xv += cam.speed * Math.sin(cam.yaw);
        cam.zv += cam.speed * Math.cos(cam.yaw);
    } else if(keyIsDown(83) && !keyIsDown(87)){
        cam.xv += -cam.speed * Math.sin(cam.yaw);
        cam.zv += -cam.speed * Math.cos(cam.yaw);
    }

    //A && D
    if(keyIsDown(65) && !keyIsDown(68)){
        cam.zv += -cam.speed * Math.sin(cam.yaw);
        cam.xv += cam.speed * Math.cos(cam.yaw);
    } else if(keyIsDown(68) && !keyIsDown(65)){
        cam.zv += cam.speed * Math.sin(cam.yaw);
        cam.xv += -cam.speed * Math.cos(cam.yaw);
    }
}

function doubleClicked(){
    player.paused = !player.paused;
    if(player.paused){
        requestPointerLock();
    } else {
        exitPointerLock();
    }
}


function movePlayer(){
    cam.pos[0] += cam.xv;
    cam.pos[2] += cam.zv;
}

//MATRIX MANIPULATION

function createPerspectiveMatrix(fov, aspect, near, far){
    let f = 1 / Math.tan(fov / 2);
    return [
        [f/aspect, 0, 0, 0],
        [0, f, 0, 0],
        [0, 0, (far + near) / (near - far), (2 * near * far) / (near - far)],
        [0, 0, -1, 0]
    ];
}

function transformFace(face, camera, projection, view, width, height){

    let transformed1 = face[0];
    let transformed2 = face[1];
    let transformed3 = face[2];
    let cull = shouldCullFace([transformed1, transformed2, transformed3], cam.pos);
    if(cull[0]){
        return [null, null, null, true];
    }

    let lightDir = [0, 0, -1];
    lightDir = normalize(lightDir);

    normal = cull[1];

    let lightDP = dotProduct(lightDir, normal);

    let colour = 125 - 50*lightDP;

    transformed1 = multiplyVectors(transformed1, view);
    transformed2 = multiplyVectors(transformed2, view);
    transformed3 = multiplyVectors(transformed3, view);


    transformed1 = multiplyVectors(transformed1, projection);
    transformed2 = multiplyVectors(transformed2, projection);
    transformed3 = multiplyVectors(transformed3, projection);

    if((transformed1[2] > 0) && (transformed2[2] > 0) && (transformed3[2] > 0)){
        return [null, null, null, true];
    }

    const ndc1 = transformed1.map(val => val / transformed1[3]);
    const screenX1 = ((ndc1[0] + 1) / 2) * width;
    const screenY1 = ((1 - ndc1[1]) / 2) * height;

    const ndc2 = transformed2.map(val => val / transformed2[3]);
    const screenX2 = ((ndc2[0] + 1) / 2) * width;
    const screenY2 = ((1 - ndc2[1]) / 2) * height;

    const ndc3 = transformed3.map(val => val / transformed3[3]);
    const screenX3 = ((ndc3[0] + 1) / 2) * width;
    const screenY3 = ((1 - ndc3[1]) / 2) * height;

    return [[screenX1, screenY1, transformed1[2]], [screenX2, screenY2, transformed2[2]], [screenX3, screenY3, transformed3[2]], false, colour];
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

    const R = multiplyMatrix3(Ry, Rx);

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

//RENDERING

function shouldCullFace(face, cameraPos){
    let [v1, v2, v3] = face;

    let edge1 = subtractVectors(v2, v1);
    let edge2 = subtractVectors(v3, v1);
    let normal = normalize(crossProduct(edge1, edge2));

    //let normalLine = addVectors(v1, normal);
    //normalLine.push(1);
    //normalLine = multiplyVectors(normalLine, projection);

    let viewDir = normalize(subtractVectors(cam.pos, v1));

    return [dotProduct(normal, viewDir) > 0, normal];
}

function drawTriangle(triangle, color) {
    let [v0, v1, v2] = triangle; // Get triangle vertices in screen space

    // Loop over pixels in bounding box
    for (let x = Math.min(v0[0], v1[0], v2[0]); x <= Math.max(v0[0], v1[0], v2[0]); x++) {
        for (let y = Math.min(v0[1], v1[1], v2[1]); y <= Math.max(v0[1], v1[1], v2[1]); y++) {
            let [alpha, beta, gamma] = barycentricCoords(x, y, v0, v1, v2);
            if (alpha >= 0 && beta >= 0 && gamma >= 0) {
                let depth = alpha * v0[2] + beta * v1[2] + gamma * v2[2];

                if(x >= 0 && y >= 0 && x <= width && y <= height){
                    if (depth < zBuffer[Math.floor(x)][Math.floor(y)]) { // Depth test
                        zBuffer[Math.floor(x)][Math.floor(y)] = depth;
                        set(Math.floor(x), Math.floor(y), 'white'); // Function to set pixel color
                        //stroke('white');
                        //point(Math.floor(x), Math.floor(y));
                    }
                }
            }
        }
    }
}
