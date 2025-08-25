// genesis.vertex.glsl
// ...shader code...
attribute vec3 a_endPosition;
uniform float u_progress;
uniform float u_pointSize;

// 2D Random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    float swirl = u_progress * 15.0;
    vec3 startPos = position;
    vec3 pos = mix(startPos, a_endPosition, u_progress);

    // Add organic, swirling motion that fades out as progress completes
    pos.x += sin(pos.y * 0.1 + swirl + random(position.xy) * 5.0) * (1.0 - u_progress) * 5.0;
    pos.z += cos(pos.y * 0.1 + swirl + random(position.yz) * 5.0) * (1.0 - u_progress) * 5.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = u_pointSize * (30.0 / -mvPosition.z) * (1.0 - u_progress * 0.5);
    gl_Position = projectionMatrix * mvPosition;
}