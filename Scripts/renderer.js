import { Matrix } from "./tools.js";

function createPerspectiveMatrix(fov, aspect, near, far){
    let f = 1 / Math.tan(fov / 2);
    return new Matrix([
        [f/aspect, 0, 0, 0],
        [0, f, 0, 0],
        [0, 0, (far + near) / (near - far), (2 * near * far) / (near - far)],
        [0, 0, -1, 0]
    ]);
}

function transformPoint(point, projection, width, height){
    let transformed = point.multiply(projection);

    const ndc = transformed.map(val => val / transformed[3]);

    const screenX = ((ndc[0] + 1) / 2) * width;
    const screenY = ((1 - ndc[1]) / 2) * height;

    return [screenX, screenY];
}

export { createPerspectiveMatrix, transformPoint };