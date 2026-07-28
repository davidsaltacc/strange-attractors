
// the second attractor after bad hair day that requires special attention (12 parameters)
// as always, low iter/disc causes haziness
// also damn, bourke's coloring game REALLY is much better than mine. am i just not throwing enough particles at it? could be, especially because i am rendering in realtime... i need to make a proper render functionality

// here's a little cheatsheep for me deciphering bourke's notes in the future
// A    B    C  D   E   F   G   H   I   J   K   L   M N  O  P  Q  R  S  T  U  F  V X   Y
// -1.2 -1.1 -1 -.9 -.8 -.7 -.6 -.5 -.4 -.3 -.2 -.1 0 .1 .2 .3 .4 .5 .6 .7 .8 .9 1 1.1 1.2

fn attractor(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    let e = -0.9; // bourke lovingly calls this one "FIRCDERRPVLD".
    let f = -0.8;
    let g = 0.5;
    let h = 0.5;
    let i = 0.3;
    let j = 1.;
    let k = -0.1;
    let l = -0.9;
    return vec2f(
        a + b * v.x + c * v.x * v.x + d * v.x * v.y + e * v.y + f * v.y * v.y,
        g + h * v.x + i * v.x * v.x + j * v.x * v.y + k * v.y + l * v.y * v.y
    );
}
