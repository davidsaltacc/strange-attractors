
// very unstable fella. probably needs a fixed start pos. keep out of ui until possible

fn gumowski_mira_f(a: f32, x: f32) -> f32 {
    return a * x + (2. * (1. - a) * x * x) / (1. + x * x);
}

fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    let xn = b * v.y + gumowski_mira_f(a, v.x);
    return vec2f(
        xn,
        gumowski_mira_f(a, xn) - v.x
    );
}
