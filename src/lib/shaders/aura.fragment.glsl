// aura.fragment.glsl
// ...shader code...
uniform vec3 u_color;
varying float v_intensity;

void main() {
    gl_FragColor = vec4(u_color, v_intensity * 0.5);
}
