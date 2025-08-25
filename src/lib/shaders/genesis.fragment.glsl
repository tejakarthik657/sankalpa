// genesis.fragment.glsl
// ...shader code...
uniform vec3 u_color;
uniform float u_progress;

void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
    gl_FragColor = vec4(u_color, alpha * (0.2 + u_progress * 0.8));
}