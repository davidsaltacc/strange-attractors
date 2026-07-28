
// saw the complex formulation. wanted to re-write it in two real parts myself. got lazy, looked it up
// high discards alert!!! works in multiple-particle mode but will produce lots of artefacts sometimes (with low iter/disc)

fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    let t = c - d / (v.x * v.x + v.y * v.y + 1.);
    return vec2f(
        a + b * (v.x * cos(t) + v.y * sin(t)),
        b * (v.x * sin(t) - v.y * cos(t))
    );
}
