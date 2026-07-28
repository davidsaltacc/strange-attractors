
fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    return vec2f(
        sin(a * v.y) + c * cos(a * v.x),
        sin(b * v.x) + d * cos(b * v.y)
    );
}
