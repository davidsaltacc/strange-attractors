
fn attractor(v: vec2f, p: array<f32, 16>) -> vec2f {
    return vec2f(
        sin(p[0] * v.y) + p[2] * cos(p[0] * v.x),
        sin(p[1] * v.x) + p[3] * cos(p[1] * v.y)
    );
}
