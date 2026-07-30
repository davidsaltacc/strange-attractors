
// a bedhead according to https://piellardj.github.io/strange-attractors-webgl/, other sources claim a slightly different function to be the bedhead attractor, maybe a typo

fn attractor(v: vec2f, p: array<f32, 16>) -> vec2f {
    return vec2f(
        sin(v.x * v.y / p[1]) + cos(p[0] * v.x - v.y),
        v.x + sin(v.y) / p[1]
    );
}
