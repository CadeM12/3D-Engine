precision highp float;

attribute vec3 aPosition; // Vertex position in world space
attribute vec3 aNormal;   // Vertex normal in world space
attribute vec4 aVertexColor;    // Vertex color

uniform mat4 uViewMatrix;       // View (camera) matrix
uniform mat4 uProjectionMatrix; // Projection matrix

varying vec3 vColor;    // Pass color to the fragment shader
varying vec3 vNormal;   // Pass normal to the fragment shader
varying vec3 vPosition; // Pass position to the fragment shader

void main() {
    // Transform the vertex position to clip space
    // Pass the normal and color to the fragment shader
    vNormal = aNormal; // Normals are already in world space
    vColor = aVertexColor.rgb;   // Pass the vertex color
    vPosition = aPosition;

    gl_Position = mat4(1, 0, 0, 0, 
                       0, 1, 0, 0.099,
                       0, 0, 1, 0, 
                       0, 0, 0, 1) * uProjectionMatrix * vec4(-aPosition.x, aPosition.y, -aPosition.z, 1.0);
}