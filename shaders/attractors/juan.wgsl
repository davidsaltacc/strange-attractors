
// i flipped x and y because it was sideways and i did not like that
// also, comparing it to paul bourke's render, mine appears squished! how unpleasant
// maybe bourke de-squished it manually.

fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    return vec2f(
        2. * cos(c * v.y) * sin(d * v.x),
        pow(cos(a * v.y), 2.) - pow(sin(b * v.x), 2.)
    );
}
