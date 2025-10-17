uniform float uTime;
uniform float uDeltaTime;
uniform sampler2D uInitialPositions;

const float PI = 3.14159265359;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 data = texture(uPositions, uv);
    vec4 initialData = texture(uInitialPositions, uv);
    
    // Get particle index from UV coordinates
    float index = uv.y * resolution.y * resolution.x + uv.x;
    float totalParticles = resolution.x * resolution.y;
    float normalizedIndex = index / totalParticles;
    
    // Fibonacci sphere distribution
    float goldenRatio = (1.0 + sqrt(5.0)) / 2.0;
    float angleIncrement = PI * 2.0 * goldenRatio;
    
    float t = normalizedIndex;
    float inclination = acos(1.0 - 2.0 * t);
    float azimuth = angleIncrement * index;
    
    float radius = 1.0;
    vec3 position = vec3(
        radius * sin(inclination) * cos(azimuth),
        radius * sin(inclination) * sin(azimuth),
        radius * cos(inclination)
    );
    
    // Add animation
    float angle = uTime * 0.5;
    position.y += sin(angle + position.x * 10.0) * 0.05;
    position.x += cos(angle + position.z * 10.0) * 0.05;
    
    // Store position in RGB and scale in alpha
    float scale = (sin(index * 0.1) * 0.5 + 0.5) * 2.0;
    
    gl_FragColor = vec4(position, scale);
}
