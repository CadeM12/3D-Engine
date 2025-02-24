let projection;
let zBuffer;
let zBufferCopy;
let facesToRender = [];
let mapFaces;

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
}
//, {
//    name: "rect",
//    vertices: [[20, 10, 30, 1], [10, 10, 30, 1], [10, 5, 30, 1], [20, 5, 30, 1], //Front
//               [20, 10, 50, 1], [10, 10, 50, 1], [10, 5, 50, 1], [20, 5, 50, 1]], //Back
//    faces: [[0, 1, 2], [0, 2, 3], // Front
//            [1, 5, 6], [1, 6, 2], // Right
//            [5, 4, 7], [5, 7, 6], // Back
//            [4, 0, 3], [4, 3, 7], // Left
//            [3, 2, 6], [3, 6, 7], // Top
//            [4, 5, 1], [4, 1, 0]]  // Bottom
//}
]; 


//TOOLS

function subtractVectors(a, b){
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function subtractVectors2D(a, b){
    //console.log(a, b);
    return [a[0] - b[0], a[1] - b[1]];
}
//function addVectors(a, b){
//    return [(a[0] + (10*b[0])), (a[1] + (10*b[1])), (a[2] + (10*b[2]))];
//}

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

//function barycentricCoords(x, y, v0, v1, v2) {
//    let denom = (v1[1] - v2[1]) * (v0[0] - v2[0]) + (v2[0] - v1[0]) * (v0[1] - v2[1]);
//    let alpha = ((v1[1] - v2[1]) * (x - v2[0]) + (v2[0] - v1[0]) * (y - v2[1])) / denom;
//    let beta = ((v2[1] - v0[1]) * (x - v2[0]) + (v0[0] - v2[0]) * (y - v2[1])) / denom;
//    let gamma = 1 - alpha - beta;
//    return [alpha, beta, gamma];
//}

function quickSortFaces(array, start, end) {
	let pi;
	//console.log(array);
	if ((end - start) >= 1){
		pi = partition(array, start, end);
		if(start < pi - 1){
			quickSortFaces(array, start, pi-1);
		}
		if(end > pi){
			quickSortFaces(array, pi, end);
		}
	}
	return array;
}

function partition(array, start, end) {
	let p = (array[Math.floor((start + end) / 2)][0][2] + array[Math.floor((start + end) / 2)][1][2] + array[Math.floor((start + end) / 2)][2][2])/3;
	let i = start;
	let j = end;

	while (i <= j){
		while ((array[i][0][2] + array[i][1][2] + array[i][2][2])/3 < p){
			i++;
		}
		while ((array[j][0][2] + array[j][1][2] + array[j][2][2])/3 > p){
			j--;
		}

		if(i <= j){
			let temp = array[i];
			array[i] = array[j];
			array[j] = temp;

			j--;
			i++;
		}
	}
	return i;
}

//P5 FUNCTIONS

function setup(){
    //zBuffer = Array(width).fill().map(() => Array(height).fill(Infinity));
    //zBufferCopy = zBuffer;
    createCanvas(windowWidth-8, windowHeight- 8);
    background("black");
    projection = createPerspectiveMatrix(Math.PI/3, width/height, 0.1, 100)
    requestPointerLock();
    mapFaces = [];
    for (let i = 0; i < map.length; i++){
        for(let f = 0; f < map[i].faces.length; f++){
            mapFaces.push(
                [map[i].vertices[map[i].faces[f][0]],
                map[i].vertices[map[i].faces[f][1]],
                map[i].vertices[map[i].faces[f][2]]]
            );
        }
    }
    //console.log(quickSortFaces([[[0, 0, 3], [0, 0, 3], [0, 0, 3]], [[0, 0, 1], [0, 0, 1], [0, 0, 1]], [[0, 0, 5], [0, 0, 5], [0, 0, 5]], [[0, 0, 4], [0, 0, 4], [0, 0, 4]]], 0, 3));
}

function draw(){
    //zBuffer = Array(width).fill().map(() => Array(height).fill(Infinity));
    facesToRender = [];
    background("black");
    getCamPos();
    getKey();
    movePlayer();
    let camera = createCameraMatrix(cam.pos, cam.pitch, cam.yaw);
    //loadPixels();
    for (let i = 0; i < mapFaces.length; i++){
        let p1 = mapFaces[i][0];
        let p2 = mapFaces[i][1];
        let p3 = mapFaces[i][2];
        let tface = transformFace([p1, p2, p3], camera, projection, width, height);
        if(!tface[0][3]){
            for (let i = 0; i < tface.length; i++){
                facesToRender.push([tface[i][0], tface[i][1], tface[i][2], tface[i][4]]);
            }
        }
    }
    facesToRender = quickSortFaces(facesToRender, 0, facesToRender.length - 1);
    //console.log(facesToRender);
    renderTriangles();
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

function transformFace(face, camera, projection, width, height){

    let transformed1 = face[0];
    let transformed2 = face[1];
    let transformed3 = face[2];
    let cull = shouldCullFace([transformed1, transformed2, transformed3], cam.pos);
    if(cull[0]){
        return [[null, null, null, true]];
    }

    let lightDir = [0, 0, -1];
    lightDir = normalize(lightDir);

    normal = cull[1];

    let lightDP = dotProduct(lightDir, normal);

    let colour = 125 - 50*lightDP;

    transformed1 = multiplyVectors(transformed1, camera);
    transformed2 = multiplyVectors(transformed2, camera);
    transformed3 = multiplyVectors(transformed3, camera);


    transformed1 = multiplyVectors(transformed1, projection);
    transformed2 = multiplyVectors(transformed2, projection);
    transformed3 = multiplyVectors(transformed3, projection);

    if((transformed1[2] > 0) && (transformed2[2] > 0) && (transformed3[2] > 0)){
        return [[null, null, null, true]];
    }

    let z1 = transformed1[2];
    let z2 = transformed2[2];
    let z3 = transformed3[2];

    
    
    //console.log(transformed1[3], transformed2[3], transformed3[3]);
    const ndc1 = transformed1.map(val => val / transformed1[3]);
    const screenX1 = ((ndc1[0] + 1) / 2) * width;
    const screenY1 = ((1 - ndc1[1]) / 2) * height;
    
    const ndc2 = transformed2.map(val => val / transformed2[3]);
    const screenX2 = ((ndc2[0] + 1) / 2) * width;
    const screenY2 = ((1 - ndc2[1]) / 2) * height;
    
    const ndc3 = transformed3.map(val => val / transformed3[3]);
    const screenX3 = ((ndc3[0] + 1) / 2) * width;
    const screenY3 = ((1 - ndc3[1]) / 2) * height;

    if(screenX1 > width || screenX1 < 0 || screenX2 > width || screenX2 < 0 || screenX3 > width || screenX3 < 0 ){
        let interpolatedY = interpolateY([screenX1, screenY1, z1, false, colour], [screenX2, screenY2, z2, false, colour], [screenX3, screenY3, z3, false, colour], colour);
        return interpolatedY;
    }

    if(screenY1 > height || screenY1 < 0 || screenY2 > height || screenY2 < 0 || screenY3 > height || screenY3 < 0){
        let interpolatedX = interpolateX([screenX1, screenY1, z1, false, colour], [screenX2, screenY2, z2, false, colour], [screenX3, screenY3, z3, false, colour], colour);
        return interpolatedX;
    }

    return [[[screenX1, screenY1, z1], [screenX2, screenY2, z2], [screenX3, screenY3, z3], false, colour]];
}

function interpolateY(p1, p2, p3, colour){
    let anchors = [];
    let off = [];
    if(onCanvas(p1[0], p1[1])){
        anchors.push(p1);
    } else {
        off.push(p1);
    }

    if(onCanvas(p2[0], p2[1])){
        anchors.push(p2);
    } else {
        off.push(p2);
    }

    if(onCanvas(p3[0], p3[1])){
        anchors.push(p3);
    } else {
        off.push(p3);
    }

    if (anchors.length == 0){
        return [[null, null, null, true]];
    }

    let interpolatedYs = [];

    if(off.length == 1){
        for(let i = 0; i < anchors.length; i++){
            let sub = subtractVectors2D(off[0], anchors[i]);
            let side = off[0][0] < 0 ? 0 : width;
            let interpolatedY = ((sub[1])/(sub[0] / (side - anchors[i][0])));
            interpolatedYs.push([side, interpolatedY + anchors[i][1], off[0][2], false, colour]);
        }
    } else {
        for(let i = 0; i < off.length; i++){

            let sub = subtractVectors2D(off[i], anchors[0]);
            let side = off[i][0] < 0 ? 0 : width;
            let interpolatedY = ((sub[1])/(sub[0] / (side - anchors[0][0])));
            interpolatedYs.push([side, interpolatedY + anchors[0][1], off[i][2], false, colour]);
        }
    }

    interpolatedYs.push(...anchors);

    let faces = [];
    if(anchors.length == 2){
        faces.push([interpolatedYs[0], interpolatedYs[2], interpolatedYs[3], false, colour]); 
        faces.push([interpolatedYs[0], interpolatedYs[1], interpolatedYs[3], false, colour]);
    } else {
        faces.push([interpolatedYs[0], interpolatedYs[1], interpolatedYs[2], false, colour]);
    }

    return faces;
}

function interpolateX(p1, p2, p3, colour){
    let anchors = [];
    let off = [];
    if(onCanvas(p1[0], p1[1])){
        anchors.push(p1);
    } else {
        off.push(p1);
    }

    if(onCanvas(p2[0], p2[1])){
        anchors.push(p2);
    } else {
        off.push(p2);
    }

    if(onCanvas(p3[0], p3[1])){
        anchors.push(p3);
    } else {
        off.push(p3);
    }

    if (anchors.length == 0){
        return [[null, null, null, true]];
    }

    let interpolatedXs = [];

    if(off.length == 1){
        for(let i = 0; i < anchors.length; i++){
            let sub = subtractVectors2D(off[0], anchors[i]);
            let side = off[0][1] < 0 ? 0 : height;
            let interpolatedX = ((sub[0])/(sub[1] / (side - anchors[i][1])));
            interpolatedXs.push([interpolatedX + anchors[i][0], side, off[0][2], false, colour]);
        }
    } else {
        for(let i = 0; i < off.length; i++){

            let sub = subtractVectors2D(off[i], anchors[0]);
            let side = off[i][1] < 0 ? 0 : height;
            let interpolatedX = ((sub[0])/(sub[1] / (side - anchors[0][1])));
            interpolatedXs.push([interpolatedX + anchors[0][0], side, off[i][2], false, colour]);
        }
    }

    interpolatedXs.push(...anchors);

    let faces = [];
    if(anchors.length == 2){
        faces.push([interpolatedXs[0], interpolatedXs[2], interpolatedXs[3], false, colour]); 
        faces.push([interpolatedXs[0], interpolatedXs[1], interpolatedXs[3], false, colour]);
    } else {
        faces.push([interpolatedXs[0], interpolatedXs[1], interpolatedXs[2], false, colour]);
    }

    return faces;
}

function onCanvas(x, y){
    return x >= 0 && x <= width && y >= 0 && y <= height;
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

function renderTriangles(){
    for(let i = 0; i < facesToRender.length; i++){
        //let colour = color(facesToRender[3], facesToRender[3], facesToRender[3]);
        stroke(facesToRender[i][3], facesToRender[i][3], facesToRender[i][3]);
        fill(facesToRender[i][3], facesToRender[i][3], facesToRender[i][3]);
        //console.log(facesToRender);
        triangle(facesToRender[i][0][0], facesToRender[i][0][1], facesToRender[i][1][0], facesToRender[i][1][1], facesToRender[i][2][0], facesToRender[i][2][1]);
    }
}
//function drawTriangle(triangle, color) {
//    let [v0, v1, v2] = triangle; // Get triangle vertices in screen space
//
//    // Loop over pixels in bounding box
//    for (let x = Math.min(v0[0], v1[0], v2[0]); x <= Math.max(v0[0], v1[0], v2[0]); x++) {
//        for (let y = Math.min(v0[1], v1[1], v2[1]); y <= Math.max(v0[1], v1[1], v2[1]); y++) {
//            let [alpha, beta, gamma] = barycentricCoords(x, y, v0, v1, v2);
//            if (alpha >= 0 && beta >= 0 && gamma >= 0) {
//                let depth = alpha * v0[2] + beta * v1[2] + gamma * v2[2];
//
//                if(x >= 0 && y >= 0 && x <= width && y <= height){
//                    if (depth < zBuffer[Math.floor(x)][Math.floor(y)]) { // Depth test
//                        zBuffer[Math.floor(x)][Math.floor(y)] = depth;
//                        set(Math.floor(x), Math.floor(y), color); // Function to set pixel color
//                        //stroke('white');
//                        //point(Math.floor(x), Math.floor(y));
//                    }
//                }
//            }
//        }
//    }
//}
