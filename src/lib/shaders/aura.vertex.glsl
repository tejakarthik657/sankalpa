// aura.vertex.glsl
// ...shader code...
uniform float u_time;
varying float v_intensity;

void main() {
    vec3 n = normalize(normalMatrix * normal);
    vec3 v = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
    v_intensity = pow(1.0 - abs(dot(n, v)), 2.5);
    
    float pulsate = sin(u_time * 2.0) * 0.05 + 0.05;
    vec3 pos = position + normal * pulsate;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}