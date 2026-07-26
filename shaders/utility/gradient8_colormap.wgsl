
//#include shaders/utility/interpolation.wgsl

// important! ignore alpha, force 1
// also positions have to be sorted otherwise unwanted things may happen
fn colormap_gradient8(x: f32, used: u32, colors: array<vec4f, 8>, positions: array<f32, 8>, biases: array<f32, 7>) -> vec4<f32> {

    if (used == 0u) {
        return vec4f(vec3f(0.), 1.);
    }
    
    if (used == 1u) {
        return vec4f(colors[0].rgb, 1.);
    }

    if (x < positions[0]) {
        return vec4f(colors[0].rgb, 1.);
    }

    if (x > positions[used - 1]) {
        return vec4f(colors[used - 1].rgb, 1.);
    }

    var before = 0u;

    for (var i = 0u; i < used; i++) {

        if (x == positions[i]) {
            return vec4f(colors[i].rgb, 1.);
        }

        if (x < positions[i]) {
            before = i - 1;
            break;
        }

    }

    let col1 = colors[before];
    let col2 = colors[before + 1u];
    let bias = biases[before];

    var x2 = x;

    x2 = (x2 - positions[before]) / (positions[before + 1u] - positions[before]);

    if (bias < 0.5) { // TODO this is to be tweaked with once we have a proper ui to configure the gradient
        x2 = 1. - pow(1. - x2, pow(2., 4. * pow((1. - bias) * 2. - 1., 2.)));
    } else if (bias < 0.5) {
        x2 = pow(x2, pow(2., 4. * pow((1. - bias) * 2. - 1., 2.)));
    }

    return vec4f((
        lerp4(col1, col2, x2)
    ).rgb, 1.);
}