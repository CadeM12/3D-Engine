precision highp float;

varying vec3 v_normal;
varying vec3 v_position;

uniform vec3 u_lightPos;
uniform vec3 u_lightColor;
uniform vec3 u_ambientColor;

void main() {
    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(u_lightPos - v_position);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = u_lightColor * diff;
    vec3 ambient = u_ambientColor;
    gl_FragColor = vec4(diffuse + ambient, 1.0);
}