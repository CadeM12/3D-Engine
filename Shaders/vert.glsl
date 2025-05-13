#version 300 es

precision highp float;

in vec3 aPosition; // Vertex position in world space
in vec3 aNormal;   // Vertex normal in world space
in vec3 aColor;    // Vertex color

uniform mat4 uViewMatrix;       // View (camera) matrix
uniform mat4 uProjectionMatrix; // Projection matrix
uniform vec3 uColor;

out vec3 vColor;    // Pass color to the fragment shader
out vec3 vNormal;   // Pass normal to the fragment shader
out vec3 vPosition; // Pass position to the fragment shader

void main() {
    // Transform the vertex position to clip space

    gl_Position = mat4(uViewMatrix)  * mat4(uProjectionMatrix) * vec4(aPosition, 1.0);

    // Pass the normal and color to the fragment shader
    vNormal = aNormal; // Normals are already in world space
    vColor = aColor;   // Pass the vertex color
    vPosition = aPosition;
}