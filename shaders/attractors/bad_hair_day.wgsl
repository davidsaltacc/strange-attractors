
// my renders look off when compared to bourkes. his coloring game is more on point than mine for sure.

fn attractor(v: vec2f, p: array<f32, 16>) -> vec2f {
    
    return vec2f(
        p[0] + p[1] * v.x + p[2] * v.y + p[3] * pow(abs(v.x), p[4]) + p[5] * pow(abs(v.y), p[6]),
        p[7] + p[8] * v.x + p[9] * v.y + p[10] * pow(abs(v.x), p[11]) + p[12] * pow(abs(v.y), p[13])
    );
}
