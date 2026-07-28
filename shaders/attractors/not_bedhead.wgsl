
// a bedhead according to https://piellardj.github.io/strange-attractors-webgl/, other sources claim a slightly different function to be the bedhead attractor, maybe a typo

fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    return vec2f(
        sin(v.x * v.y / b) + cos(a * v.x - v.y),
        v.x + sin(v.y) / b
    );
}
