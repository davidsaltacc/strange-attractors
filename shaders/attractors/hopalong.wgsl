
// needs fixed start point of 0,0. keep out of ui until possible

fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    return vec2f(
        v.y - 1. - sqrt(abs(b * v.x - 1. - c)) * sign(v.x - 1.),
        a - v.x - 1.
    );
}
