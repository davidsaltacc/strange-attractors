
// an attractor that has that many parameters i will probably need to scale the uniform buffer up for
// my renders look off when compared to bourkes. his coloring game is more on point than mine for sure.

fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    let e = -0.6;
    let f = -0.1;
    let g = -0.5;
    let h = 0.8;
    let i = 1.0;
    let j = -0.3;
    let k = -0.6;
    let l = -0.3;
    let m = -1.2;
    let n = -0.3;
    return vec2f(
        a + b * v.x + c * v.y + d * pow(abs(v.x), e) + f * pow(abs(v.y), g),
        h + i * v.x + j * v.y + k * pow(abs(v.x), l) + m * pow(abs(v.y), n)
    );
}
