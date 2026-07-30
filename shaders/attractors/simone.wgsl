
fn attractor(v: vec2f, p: array<f32, 16>) -> vec2f {
    return vec2f(
        sin(v.x * v.x - v.y * v.y + p[0]),
        cos(2. * v.x * v.y + p[1])
    );
}
