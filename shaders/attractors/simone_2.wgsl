
// what the fuck
// low iter/disc counts lead to haziness. can be desired or not

// i added a,b,c,d params so there is some variability. holy fuck this has some art potential now

fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    if (random_from_vec2u(bitcast<vec2u>(v)) >= 0.5) {
        return vec2f(
            a * 0.39505327 * v.x + b * 0.32002643 * v.y + 0.3487955,
            b * 0.6965192 * v.x - a * 0.80431921 * v.y + 0.84773523
        );
    } else {
        return vec2f(
            c * 0.76247098 * v.x - d * 0.81701046 * v.y + 0.3182037,
            d * 0.40676562 * v.x + c * 0.36789809 * v.y + 0.47010137
        );
    }
}
