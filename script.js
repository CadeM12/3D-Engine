//import { Matrix, Vector } from './Scripts/tools.js';
//import { createPerspectiveMatrix, transformPoint } from './Scripts/renderer.js';
let cam = {
    pos: [0, 0, 0],
    yaw: 0,
    pitch: 0,
    sensetivity: 50,
    xv: 0,
    yv: 0,
    zv: 0,
    speed: 2
};

let projection;
let camera = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
];

let cube = [[10, 10, 30, 1], [-10, 10, 30, 1], [-10, -10, 30, 1], [10, -10, 30, 1], //Front
[10, 10, 50, 1], [-10, 10, 50, 1], [-10, -10, 50, 1], [10, -10, 50, 1]]; //Back


//TOOLS

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

//P5 FUNCTIONS

function setup(){
    createCanvas(windowWidth, windowHeight);
    background("black");
    projection = createPerspectiveMatrix(Math.PI / 3, width/height, 0, 100)
}

function draw(){
    background("black");
    getCamPos();
    getKey();
    movePlayer();
    let view = createCameraMatrix(cam.pos, cam.pitch, cam.yaw);
    for(let i = 0; i < cube.length; i++){
        let plot = transformPoint(cube[i], camera, projection, view, width, height);
        stroke("white");
        strokeWeight(3);
        point(plot[0], plot[1]);
    }
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

    //W && S
    if(keyIsDown(87) && !keyIsDown(83)){
        cam.xv = cam.speed * Math.sin(cam.yaw);
        cam.zv = cam.speed * Math.cos(cam.yaw);
    } else if(keyIsDown(83) && !keyIsDown(87)){
        cam.xv = -cam.speed * Math.sin(cam.yaw);
        cam.zv = -cam.speed * Math.cos(cam.yaw);
    }

    //A && D
    if(keyIsDown(65) && !keyIsDown(68)){
        cam.zv = -cam.speed * Math.sin(cam.yaw);
        cam.xv = cam.speed * Math.cos(cam.yaw);
    } else if(keyIsDown(68) && !keyIsDown(65)){
        cam.zv = cam.speed * Math.sin(cam.yaw);
        cam.xv = -cam.speed * Math.cos(cam.yaw);
    }

    if(!keyIsDown(87) && !keyIsDown(83) && !keyIsDown(65) && !keyIsDown(68)){
        cam.xv = 0;
        cam.zv = 0;
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

function transformPoint(point, camera, projection, view, width, height){
    let transformed = multiplyVectors(point, camera);
    transformed = multiplyVectors(transformed, view);
    transformed = multiplyVectors(transformed, projection);

    const ndc = transformed.map(val => val / transformed[3]);

    const screenX = ((ndc[0] + 1) / 2) * width;
    const screenY = ((1 - ndc[1]) / 2) * height;

    return [screenX, screenY];
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