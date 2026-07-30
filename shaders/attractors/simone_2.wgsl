
// low iter/disc counts lead to haziness. can be desired or not

// i turned all the numbers into params so there is some variability. holy fuck this has some art potential now

fn attractor(v: vec2f, p: array<f32, 16>) -> vec2f {
    if (random_from_vec2u(bitcast<vec2u>(v)) >= 0.5) {
        return vec2f(
            p[0] * v.x + p[1] * v.y + p[8],
            p[2] * v.x + p[3] * v.y + p[9]
        );
    } else {
        return vec2f(
            p[4] * v.x + p[5] * v.y + p[10],
            p[6] * v.x + p[7] * v.y + p[11]
        );
    }
}
