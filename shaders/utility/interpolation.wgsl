
fn lerp(a: f32, b: f32, t: f32) -> f32 {
    return (1. - t) * a + t * b;
}

fn lerp4(a: vec4f, b: vec4f, t: f32) -> vec4f {
    return vec4f(
        lerp(a.x, b.x, t),
        lerp(a.y, b.y, t),
        lerp(a.z, b.z, t),
        lerp(a.w, b.w, t)
    );
}
