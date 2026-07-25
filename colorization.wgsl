
@group(0) @binding(0) var<storage, read_write> particleCounts: array<u32>;

struct Uniforms {
    size: vec2u,
    particleIntensity: f32
};

@group(0) @binding(1) var<uniform> uniforms: Uniforms;

@vertex
fn vertex(
    @builtin(vertex_index) vi : u32
) -> @builtin(position) vec4f {

    let pos = array(
        vec2f(1., 1.),
        vec2f(-1., 1.),
        vec2f(1., -1.),
        vec2f(-1., -1.)
    );
    
    return vec4f(pos[vi], 0.0, 1.0);
}
 
@fragment 
fn fragment(
    @builtin(position) pos : vec4f
) -> @location(0) vec4f {

    let dimX = uniforms.size.x;
    let dimY = uniforms.size.y;

    let i = u32(floor(pos.y)) * dimX + u32(floor(pos.x));
    let value = particleCounts[i];

    var v = saturate(f32(value) / 1000. * uniforms.particleIntensity);
    v = pow(v, 0.65);

    return vec4f(v, pow(v, 0.85), pow(v, 0.65), 1.);

}
