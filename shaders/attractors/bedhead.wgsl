
// sometimes this guy needs a LOT more iterating before it falls into shape (discard the first many)

fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    return vec2f(
        sin(v.x * v.y / b) * v.y + cos(a * v.x - v.y),
        v.x + sin(v.y) / b
    );
}
