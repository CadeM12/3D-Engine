#version 300 es

precision highp float;

in vec3 vColor;    // Color from the vertex shader
in vec3 vNormal;   // Normal from the vertex shader
in vec3 vPosition; // Position from the vertex shader

uniform vec3 uLightPos;    // Light position in world space
uniform vec3 uLightColor;  // Light color
uniform vec3 uAmbientColor; // Ambient light color

out vec4 fragColor; // Final fragment color

void main() {
    // Calculate the light direction
    vec3 lightDir = normalize(uLightPos - vPosition);

    // Calculate the diffuse lighting
    float diff = max(dot(normalize(vNormal), lightDir), 0.0);
    vec3 diffuse = diff * uLightColor;

    // Combine diffuse and ambient lighting
    vec3 lighting = diffuse + uAmbientColor;

    // Apply lighting to the vertex color
    vec3 finalColor = vColor * lighting;

    fragColor = vec4(finalColor, 1.0); // Output the final color
}