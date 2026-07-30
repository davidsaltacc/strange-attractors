
fn attractor(v: vec2f, p: array<f32, 16>) -> vec2f {
    return vec2f(
        p[0] * sin(v.y - (v.y * (v.y * v.y + 1.)) / 2.) + p[1] * tanh(v.x - (v.x * (v.x * v.x + 1.)) / 2.),
        p[2] * sin(v.x - (v.x * (v.x * v.x + 1.)) / 2.) + p[3] / cosh(v.y - (v.y * (v.y * v.y + 1.)) / 2.)
    );
}
