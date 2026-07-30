
// here's a little cheatsheep for me deciphering bourke's notes on this attractor in the future
// A    B    C  D   E   F   G   H   I   J   K   L   M N  O  P  Q  R  S  T  U  F  V X   Y
// -1.2 -1.1 -1 -.9 -.8 -.7 -.6 -.5 -.4 -.3 -.2 -.1 0 .1 .2 .3 .4 .5 .6 .7 .8 .9 1 1.1 1.2

fn attractor(v: vec2f, p: array<f32, 16>) -> vec2f {
    return vec2f(
        p[0] + p[1] * v.x + p[2] * v.x * v.x + p[3] * v.x * v.y + p[4] * v.y + p[5] * v.y * v.y,
        p[6] + p[7] * v.x + p[8] * v.x * v.x + p[9] * v.x * v.y + p[10] * v.y + p[11] * v.y * v.y
    );
}
