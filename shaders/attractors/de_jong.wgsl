
fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    return vec2f(
        sin(a * v.y) - cos(b * v.x),
        sin(c * v.x) - cos(d * v.y)
    );
}
