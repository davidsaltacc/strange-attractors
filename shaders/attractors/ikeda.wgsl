
// saw the complex formulation. wanted to re-write it in two real parts myself. got lazy, looked it up

fn attractor(v: vec2f, p: array<f32, 16>) -> vec2f {
    let t = p[2] - p[3] / (v.x * v.x + v.y * v.y + 1.);
    return vec2f(
        p[0] + p[1] * (v.x * cos(t) + v.y * sin(t)),
        p[1] * (v.x * sin(t) - v.y * cos(t))
    );
}
