
struct Uniforms {
    colorsUsed: u32,
    gradientColors: array<vec4f, 8>,
    gradientPositions: array<vec4f, 2>, // technically 8 seperate values, but wrap in vec4f to make webgpu happy
    gradientBiases: array<vec4f, 2> // technically 7 f32's, but webgpu is picky
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) fragPos: vec2f,
};

//#include shaders/utility/gradient8_colormap.wgsl

@vertex
fn vertex(
    @builtin(vertex_index) vi : u32
) -> VSOutput {

    let pos = array(
        vec2f(1., 1.),
        vec2f(-1., 1.),
        vec2f(1., -1.),
        vec2f(-1., -1.)
    );
    
    var vsOutput: VSOutput;
    vsOutput.position = vec4f(pos[vi], 0.0, 1.0);
    vsOutput.fragPos = vec2f(pos[vi]);
    return vsOutput;
}
 
@fragment 
fn fragment(
    vsout: VSOutput
) -> @location(0) vec4f {

    var positions = array<f32, 8>();
    var biases = array<f32, 7>();

    positions[0] = uniforms.gradientPositions[0].x;
    positions[1] = uniforms.gradientPositions[0].y;
    positions[2] = uniforms.gradientPositions[0].z;
    positions[3] = uniforms.gradientPositions[0].w;
    positions[4] = uniforms.gradientPositions[1].x;
    positions[5] = uniforms.gradientPositions[1].y;
    positions[6] = uniforms.gradientPositions[1].z;
    positions[7] = uniforms.gradientPositions[1].w;

    biases[0] = uniforms.gradientBiases[0].x;
    biases[1] = uniforms.gradientBiases[0].y;
    biases[2] = uniforms.gradientBiases[0].z;
    biases[3] = uniforms.gradientBiases[0].w;
    biases[4] = uniforms.gradientBiases[1].x;
    biases[5] = uniforms.gradientBiases[1].y;
    biases[6] = uniforms.gradientBiases[1].z;

    return colormap_gradient8((vsout.fragPos.x + 1.) / 2., uniforms.colorsUsed, uniforms.gradientColors, positions, biases);

}
