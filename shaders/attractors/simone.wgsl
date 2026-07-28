
// needs more discards, otherwise sometimes artefacts will show. although a low discard+iter count can produce some nice haziness somtimes

fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    return vec2f(
        sin(v.x * v.x - v.y * v.y + a),
        cos(2. * v.x * v.y + b)
    );
}
