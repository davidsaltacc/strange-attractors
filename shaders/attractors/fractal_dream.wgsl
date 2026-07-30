
fn attractor(v: vec2f, p: array<f32, 16>) -> vec2f {
    return vec2f(
        sin(p[1] * v.y) + p[2] * sin(p[1] * v.x),
        sin(p[0] * v.x) + p[3] * sin(p[0] * v.y)
    );
}
