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

//VARIABLE INITIALIZATION
let gravity = 0.1;
let fNear = 1;
let fFar = 100;
let fFov = Math.PI/3;
let mapFaces = [];
let facesToRender = [];
let aspect;
let projMat;

let camera = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
];

let cam = {
    pos: [0, 0, 0, 1],
    yaw: 0,
    pitch: 0,
    sensetivity: 100,
    vel: [0, 0, 0],
    speed: 0.5,
    grounded: true
};

//MAP
let map = [{
    mesh: "cube",
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
}]; 

//TOOLS

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

function quickSortFaces(array, start, end) {
	let pi;
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
	let p = Math.min(array[Math.floor((start + end) / 2)][0][2], array[Math.floor((start + end) / 2)][1][2], array[Math.floor((start + end) / 2)][2][2]);
	let i = start;
	let j = end;

	while (i <= j){
		while (Math.min(array[i][0][2], array[i][1][2], array[i][2][2]) < p){
			i++;
		}
		while (Math.min(array[j][0][2], array[j][1][2], array[j][2][2]) > p){
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

function setup(){
    createCanvas(windowWidth - 20, windowHeight - 20);
    aspect = width/height;
    projMat = createPerspectiveMatrix(fFov, aspect, fNear, fFar);
    for (let i = 0; i < map.length; i++){
        for(let f = 0; f < map[i].faces.length; f++){
            mapFaces.push(
                [map[i].vertices[map[i].faces[f][0]],
                map[i].vertices[map[i].faces[f][1]],
                map[i].vertices[map[i].faces[f][2]], map[i].color]
            );
        }
    }
}

function draw(){
    background('skyBlue');    
    facesToRender = [];
    getCamPos();
    getKey();
    checkCollisions();
    movePlayer();
    camera = createCameraMatrix(cam.pos, cam.pitch, cam.yaw);
    for (let i = 0; i < mapFaces.length; i++){
        transformFace([mapFaces[i][0], mapFaces[i][1], mapFaces[i][2]], camera, projMat, width, height, mapFaces[i][3]);
    }
    quickSortFaces(facesToRender, 0, facesToRender.length - 1);
    renderTriangles();
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

function movePlayer(){
    cam.pos[0] += cam.vel[0];
    cam.pos[2] += cam.vel[2];
    cam.pos[1] += cam.vel[1];
}

function checkCollisions(){
    let isGrounded = false;
    for (let i = 0; i < map.length; i++){
        let toPlanes = 0;
        let crossingNormal = [0, 0, 0];

        for (let face = 0; face < map[i].faces.length; face++){
            let plane = [
                map[i].vertices[map[i].faces[face][0]], 
                map[i].vertices[map[i].faces[face][1]], 
                map[i].vertices[map[i].faces[face][2]]
            ];
            
            let planeNormal = normalize(crossProduct(
                subtractVector3(plane[1], plane[0]), 
                subtractVector3(plane[2], plane[0])
            ));
            
            let planePoint = plane[0];
            let footPosition = [cam.pos[0], cam.pos[1] + 7, cam.pos[2]];
            let point = addVector3([cam.pos[0], cam.pos[1] + 5, cam.pos[2]], cam.vel);

            let d = distance(point, planePoint, planeNormal);
            if(d >= -2){
                if(distance([cam.pos[0], cam.pos[1] + 5, cam.pos[2]], planePoint, planeNormal) < -2){
                    crossingNormal = planeNormal;
                }
                toPlanes++;
            }
        }

        if(toPlanes == map[i].faces.length){
            let normalVelocity = dotProduct(cam.vel, crossingNormal);
            let newVel = subtractVector3(cam.vel, crossingNormal.map(val => val * normalVelocity));
            cam.vel = newVel;
            if(crossingNormal[1] > 0.7){        
                isGrounded = true;
            }
            
        }
    }
    if(isGrounded){
        if(Math.abs(cam.vel[1]) < 0.1) {
            cam.vel[1] = 0;
        }
        cam.grounded = true;
    } else {
        cam.grounded = false;
    }
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
        
        let z1 = transformed1[2] / transformed1[3];
        let z2 = transformed2[2] / transformed2[3];
        let z3 = transformed3[2] / transformed3[3];
        
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
    for (let i = 0; i < facesToRender.length; i++){

        let face = facesToRender[i];
        stroke(face[3], face[3], face[3]);
        fill(face[3], face[3], face[3]);
        triangle(face[0][0], face[0][1], face[1][0], face[1][1], face[2][0], face[2][1]);
    }
}