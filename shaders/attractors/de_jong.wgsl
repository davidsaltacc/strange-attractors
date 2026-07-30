
fn attractor(v: vec2f, p: array<f32, 16>) -> vec2f {
    return vec2f(
        sin(p[0] * v.y) - cos(p[1] * v.x),
        sin(p[2] * v.x) - cos(p[3] * v.y)
    );
}
