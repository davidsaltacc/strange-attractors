
fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    return vec2f(
        sin(b * v.y) + c * sin(b * v.x),
        sin(a * v.x) + d * sin(a * v.y)
    );
}
