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


let fNear = 0.1;
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
    xv: 0,
    yv: 0,
    zv: 0,
    speed: 0.5
};

let map = [{
    mesh: "cube",
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
}, {
    name: "ground",
    vertices: [[100, 20, -100, 1], [-100, 20, -100, 1], [-100, 10, -100, 1], [100, 10, -100, 1], //Front
               [100, 20, 100, 1], [-100, 20, 100, 1], [-100, 10, 100, 1], [100, 10, 100, 1]], //Back
    faces: [[0, 1, 2], [0, 2, 3], // Front
            [1, 5, 6], [1, 6, 2], // Right
            [5, 4, 7], [5, 7, 6], // Back
            [4, 0, 3], [4, 3, 7], // Left
            [3, 2, 6], [3, 6, 7], // Top
            [4, 5, 1], [4, 1, 0]]  // Bottom
}]; 

function subtractVector3(a, b){
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function subtractVector2(a, b){
    return [a[0] - b[0], a[1] - b[1]];
}

function addVector3(a, b){
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2], 1];
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
    return addVector3(lineStart, lineToIntersect);
}

function clipTriangleAgainstPlane(planePoint, planeNormal, inTri){
    planeNormal = normalize(planeNormal);

    function dist(p){
        return dotProduct(planeNormal, p) - dotProduct(planeNormal, planePoint);
    }

    let insidePoints = [];
    let outsidePoints = [];

    let insidePointCount = 0;
    let outsidePointCount = 0;

    let d0 = dist(inTri[0]);
    let d1 = dist(inTri[1]);
    let d2 = dist(inTri[2]);

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

function setup(){
    createCanvas(windowWidth - 20, windowHeight - 20);
    background('black');
    aspect = width/height;
    projMat = createPerspectiveMatrix(fFov, aspect, fNear, fFar);

    for (let i = 0; i < map.length; i++){
        for(let f = 0; f < map[i].faces.length; f++){
            mapFaces.push(
                [map[i].vertices[map[i].faces[f][0]],
                map[i].vertices[map[i].faces[f][1]],
                map[i].vertices[map[i].faces[f][2]]]
            );
        }
    }
}

function draw(){
    facesToRender = [];
    background('black');
    getCamPos();
    getKey();
    movePlayer();
    camera = createCameraMatrix(cam.pos, cam.pitch, cam.yaw);
    for (let i = 0; i < mapFaces.length; i++){
        transformFace([mapFaces[i][0], mapFaces[i][1], mapFaces[i][2]], camera, projMat, width, height);
    }
    quickSortFaces(facesToRender, 0, facesToRender.length - 1);
    renderTriangles();
}

function getKey(){
    cam.xv = 0;
    cam.zv = 0;
    cam.yv = 0;

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

    if(keyIsDown(32)){
        cam.yv -= cam.speed;
    } else if(keyIsDown(16)){
        cam.yv += cam.speed;
    }
}

function getCamPos(){
    if(((cam.pitch - movedY/cam.sensetivity) < (Math.PI/2)) && ((cam.pitch - movedY/cam.sensetivity) > (-Math.PI/2))){
        cam.pitch -= movedY/cam.sensetivity;
    };
    cam.yaw -= movedX/cam.sensetivity;
}

function movePlayer(){
    cam.pos[0] += cam.xv;
    cam.pos[2] += cam.zv;
    cam.pos[1] += cam.yv;
}

function transformFace(face, camera, projection, width, height){
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

    let colour = 125 - 50*lightDP;
    
    transformed1 = multiplyVecMat(transformed1, camera);
    transformed2 = multiplyVecMat(transformed2, camera);
    transformed3 = multiplyVecMat(transformed3, camera);

    let clippedTriangles = clipTriangleAgainstPlane([0, 0, 0.1], [0, 0, 1], [transformed1, transformed2, transformed3]);

    for (let i = 0; i < clippedTriangles[1]; i++){
        let clipped = clippedTriangles[0][i];
        
        transformed1 = multiplyVecMat(clipped[0], projection);
        transformed2 = multiplyVecMat(clipped[1], projection);
        transformed3 = multiplyVecMat(clipped[2], projection);
        
        let z1 = transformed1[2];
        let z2 = transformed2[2];
        let z3 = transformed3[2];
        
        const ndc1 = transformed1.map(val => val / transformed1[3]);
        const screenX1 = ((ndc1[0] + 1) / 2) * width;
        const screenY1 = ((1 - ndc1[1]) / 2) * height;
        
        const ndc2 = transformed2.map(val => val / transformed2[3]);
        const screenX2 = ((ndc2[0] + 1) / 2) * width;
        const screenY2 = ((1 - ndc2[1]) / 2) * height;
        
        const ndc3 = transformed3.map(val => val / transformed3[3]);
        const screenX3 = ((ndc3[0] + 1) / 2) * width;
        const screenY3 = ((1 - ndc3[1]) / 2) * height;

        facesToRender.push([[screenX1, screenY1, z1], [screenX2, screenY2, z2], [screenX3, screenY3, z3], colour]);
    }
}

function shouldCullFace(face){
    let [v1, v2, v3] = face;

    let edge1 = subtractVector3(v2, v1);
    let edge2 = subtractVector3(v3, v1);
    let normal = normalize(crossProduct(edge1, edge2));

    let viewDir = normalize(subtractVector3(cam.pos, v1));

    return [dotProduct(normal, viewDir) > 0, normal];
}

function renderTriangles() {
    for (let i = 0; i < facesToRender.length; i++){
        let face = facesToRender[i];
        stroke(face[3], face[3], face[3]);
        fill(face[3], face[3], face[3]);
        //console.log(face)
        //line(face[0][0], face[0][1], face[1][0], face[1][1]);
        //line(face[1][0], face[1][1], face[2][0], face[2][1]);
        //line(face[2][0], face[2][1], face[0][0], face[0][1]);
        triangle(face[0][0], face[0][1], face[1][0], face[1][1], face[2][0], face[2][1]);
    }
}