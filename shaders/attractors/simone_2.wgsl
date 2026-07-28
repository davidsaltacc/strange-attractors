
// what the fuck
// low iter/disc counts lead to haziness. can be desired or not

fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    if (random_from_vec2u(bitcast<vec2u>(v)) >= 0.5) {
        return vec2f(
            0.39505327 * v.x + 0.32002643 * v.y + 0.3487955,
            0.6965192 * v.x - 0.80431921 * v.y + 0.84773523
        );
    } else {
        return vec2f(
            0.76247098 * v.x - 0.81701046 * v.y + 0.3182037,
            0.40676562 * v.x + 0.36789809 * v.y + 0.47010137
        );
    }
}
