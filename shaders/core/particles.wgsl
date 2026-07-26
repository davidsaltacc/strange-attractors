
@group(0) @binding(0) var<storage, read_write> finalBuffer: array<atomic<u32>>;

struct Uniforms {
    size: vec2u,
    iters: u32,
    discs: u32,
    startRange: u32,
    a: f32,
    b: f32, 
    c: f32,
    d: f32,
    zoom: f32,
    pan: vec2f
};

@group(0) @binding(1) var<uniform> uniforms: Uniforms;

// ----------- RNG by https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl/17479300#17479300

fn hash_u32(x_in: u32) -> u32 {
    var x = x_in;
    x += (x << 10u); x ^= (x >> 6u); x += (x << 3u); x ^= (x >> 11u); x += (x << 15u);
    return x;
}

fn hash_vec2u(v: vec2u) -> u32 { return hash_u32(v.x ^ hash_u32(v.y)); }
fn hash_vec3u(v: vec3u) -> u32 { return hash_u32(v.x ^ hash_u32(v.y) ^ hash_u32(v.z)); }
fn hash_vec4u(v: vec4u) -> u32 { return hash_u32(v.x ^ hash_u32(v.y) ^ hash_u32(v.z) ^ hash_u32(v.w)); }

fn float_construct_from_u32(m_in: u32) -> f32 {
    let ieeeMantissa = 0x007fffffu;
    let ieeeOne = 0x3f800000u; 
    var m = m_in;
    m &= ieeeMantissa; 
    m |= ieeeOne;
    let f = bitcast<f32>(m);
    return f - 1.;
}

fn random_from_u32(seed: u32) -> f32 { return float_construct_from_u32(hash_u32(seed)); }
fn random_from_vec2u(seed: vec2u) -> f32 { return float_construct_from_u32(hash_vec2u(seed)); }
fn random_from_vec3u(seed: vec3u) -> f32 { return float_construct_from_u32(hash_vec3u(seed)); }
fn random_from_vec4u(seed: vec4u) -> f32 { return float_construct_from_u32(hash_vec4u(seed)); }

// -----------


// https://piellardj.github.io/strange-attractors-webgl/ 
// implement others from here? 

// https://www.williamrchase.com/writing/2019-02-28-strange-attractors-12-months-of-art-february
// lots of good ideas

// here too 
// https://softologyblog.wordpress.com/2017/03/04/2d-strange-attractors/

fn clifford(v: vec2f, a: f32, b: f32, c: f32, d: f32) -> vec2f {
    return vec2f(
        sin(a * v.y) + c * cos(a * v.x),
        sin(b * v.x) + d * cos(b * v.y)
    );
}

const workgroupSizeX = 8;
const workgroupSizeY = 8;
const workgroupSizeZ = 1;
const workgroupThreadCount = workgroupSizeX * workgroupSizeY * workgroupSizeZ;
 
@compute @workgroup_size(workgroupSizeX, workgroupSizeY, workgroupSizeZ) 
fn computeParticles(
    @builtin(global_invocation_id) gid: vec3u,
    @builtin(workgroup_id) wid: vec3u,
    @builtin(local_invocation_id) lid: vec3u,
    @builtin(local_invocation_index) lii: u32,
    @builtin(num_workgroups) num_w: vec3u
) {

    let wi = wid.x + wid.y * num_w.x + wid.z * num_w.x * num_w.y;
    let gii = wi * workgroupThreadCount + lii; // please make this a builtin

    let dimX = uniforms.size.x;
    let dimY = uniforms.size.y;

    let startX = random_from_u32(gii);
    let startY = random_from_u32(bitcast<u32>(startX));

    var startRange = f32(uniforms.startRange);

    var pos = vec2f(
        startX * startRange * 2. - startRange,
        startY * startRange * 2. - startRange
    );

    let ratio = f32(dimX) / f32(dimY);
    var mX = 1.;
    var mY = 1.;
    var oX = 0.;
    var oY = 0.;

    if (ratio > 1.) {
        mX = 1. / ratio;
        oX = (f32(dimX) - f32(dimY)) / 2.;
    } else {
        mY = ratio;
        oY = (f32(dimY) - f32(dimX)) / 2.;
    }

    for (var i = 0u; i < uniforms.iters; i++) {

        pos = clifford(pos, uniforms.a, uniforms.b, uniforms.c, uniforms.d);

        if (i >= uniforms.discs) {

            var x2 = round(((pos.x - uniforms.pan.x) + 1. / uniforms.zoom) * uniforms.zoom / 2. * f32(dimX) * mX + oX);
            var y2 = round(((-pos.y + uniforms.pan.y) + 1. / uniforms.zoom) * uniforms.zoom / 2. * f32(dimY) * mY + oY);

            if (x2 >= 0. && x2 < f32(dimX) && y2 >= 0. && y2 < f32(dimY)) {
                atomicAdd(&finalBuffer[u32(y2) * dimX + u32(x2)], 1u);
            }
        }
    }
}
