
// funky. might want to zoom out a bit though

fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    return vec2f(
        a * sin(v.y - (v.y * (v.y * v.y + 1.)) / 2.) + b * tanh(v.x - (v.x * (v.x * v.x + 1.)) / 2.),
        c * sin(v.x - (v.x * (v.x * v.x + 1.)) / 2.) + d / cosh(v.y - (v.y * (v.y * v.y + 1.)) / 2.)
    );
}
