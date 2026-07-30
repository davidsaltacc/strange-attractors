
// i flipped x and y because it was sideways and i did not like that
// also, comparing it to paul bourke's render, mine appears squished! how unpleasant
// maybe bourke de-squished it manually.

fn attractor(v: vec2f, p: array<f32, 16>) -> vec2f {
    return vec2f(
        2. * cos(p[2] * v.y) * sin(p[3] * v.x),
        pow(cos(p[0] * v.y), 2.) - pow(sin(p[1] * v.x), 2.)
    );
}
