const q = s => document.querySelector(s);
const qa = s => document.querySelectorAll(s);

const adapter = await navigator.gpu?.requestAdapter();
const device = await adapter?.requestDevice({
    requiredLimits: { 
        maxBufferSize: adapter.limits.maxBufferSize,
        maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
        maxTextureDimension2D: adapter.limits.maxTextureDimension2D,
        maxComputeWorkgroupsPerDimension: adapter.limits.maxComputeWorkgroupsPerDimension
    },
    requiredFeatures: [
        ...(adapter.features.has("timestamp-query") ? ["timestamp-query"] : [])
    ]
});

if (!device) {
    [ alert, e => { throw new Error(e) } ].forEach(f => f("WebGPU does not appear to be supported in your browser."));
}

function reshapeDispatches(n) {
    const x = Math.ceil(Math.cbrt(n));
    const y = Math.ceil(Math.sqrt(n / x));
    const z = Math.ceil(n / (x * y));
    return [ x, y, z ];
}

window.saveDraft = () => {
    draw();
    var data = canvas.toDataURL("image/png");
    var a = document.createElement("a");
    a.href = data;
    a.download = "attractor.preview.png";
    a.click();
    a.remove();
}

window.toggleCanvas = () => {
    if (canvas.style.display !== "none") {
        canvas.style.display = "none";
        q("#savePreviewButton").style.display = "none";
        q("#hideCanvasButton").innerHTML = "Show canvas";
    } else {
        canvas.style.display = "";
        q("#savePreviewButton").style.display = "";
        q("#hideCanvasButton").innerHTML = "Hide canvas";
    }
};

function setupNumberInput(id, getter, _setter, withSlider = true, defaultMin = -5, defaultMax = 5) {

    const input = q("#" + id + "-input");

    const slider = withSlider ? q("#" + id + "-slider-input") : null;

    const setter = v => {
        input.value = v;
        _setter(v);
    };

    const make = (bid, delta) => {
        const button = q("#" + id + "-button-" + bid);
        if (button) {
            button.onclick = () => {
                const maxDigitsBefore = Math.max(parseFloat(input.value).toString().split(".")[1]?.length ?? 0, parseFloat(delta).toString().split(".")[1]?.length ?? 0);
                input.value = parseFloat((parseFloat(input.value) + parseFloat(delta)).toFixed(maxDigitsBefore));
                input.dispatchEvent(new Event("change"));
            }
        }
    }

    make("p1000", 1000);
    make("p100", 100);
    make("p10", 10);
    make("p1", 1);
    make("p01", 0.1);
    make("p001", 0.01);

    make("m001", -0.01);
    make("m01", -0.1);
    make("m1", -1);
    make("m10", -10);
    make("m100", -100);
    make("m1000", -1000);

    input.onchange = () => {
        const newV = parseFloat(input.value);
        if (Number.isFinite(newV)) {
            _setter(newV);
            if (withSlider) {
                slider.value = newV;
            }
        } else {
            input.value = getter();
        }
    };

    if (withSlider) {

        const sMin = q("#" + id + "-slider-min");
        const sMax = q("#" + id + "-slider-max");

        const slider = q("#" + id + "-slider-input");

        sMin.value = slider.min = defaultMin;
        sMax.value = slider.max = defaultMax;

        slider.step = (slider.max - slider.min) / 1000;

        slider.value = getter();

        sMin.onchange = () => {
            let newV = parseFloat(sMin.value);

            if (!Number.isFinite(newV)) {
                sMin.value = newV = defaultMin;
            }

            slider.min = newV;
            slider.step = (slider.max - slider.min) / 1000;
        };

        sMax.onchange = () => {
            let newV = parseFloat(sMax.value);

            if (!Number.isFinite(newV)) {
                sMax.value = newV = defaultMax;
            }

            slider.max = newV;
            slider.step = (slider.max - slider.min) / 1000;
        };

        slider.oninput = () => {
            const newV = parseFloat(slider.value);
            if (Number.isFinite(newV)) {
                setter(newV);
            } else {
                slider.value = getter();
            }
        };

    }

    setter(getter());

}

const canvas = q("#canvas");
const context = canvas.getContext("webgpu");
const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
    device,
    format: presentationFormat
});

let resolutionX = 500;
let resolutionY = 500;
let particleCount = 1_000_000;
let particleIntensity = 0.3;
let timeGPU = true;
let iters = 20;
let discs = 5;
let startRange = 2;
let a = 2;
let b = 2;
let c = 1;
let d = -1;
let zoom = 0.33;

let canDraw = false;

setupNumberInput("value-a", () => a ?? 0, v => { a = v ?? a; draw(); });
setupNumberInput("value-b", () => b ?? 0, v => { b = v ?? b; draw(); });
setupNumberInput("value-c", () => c ?? 0, v => { c = v ?? c; draw(); });
setupNumberInput("value-d", () => d ?? 0, v => { d = v ?? d; draw(); });

setupNumberInput("value-particle-intensity", () => particleIntensity ?? 1, v => { particleIntensity = v ?? particleIntensity; draw(); }, true, 0, 1);

setupNumberInput("value-canvas-x", () => resolutionX ?? 0, v => { 

    resolutionX = Math.max(v ?? 1, 1);
    canvas.width = resolutionX; 

    if (canDraw) {
        createParticleCountBuffer();
        createBindGroups();
        draw(); 
    }
    
}, false);

setupNumberInput("value-canvas-y", () => resolutionY ?? 0, v => { 

    resolutionY = Math.max(v ?? 1, 1);
    canvas.height = resolutionY; 

    if (canDraw) {
        createParticleCountBuffer();
        createBindGroups();
        draw(); 
    }
    
}, false);

canvas.width = resolutionX;
canvas.height = resolutionY;

// --- buffers ---

let particleCountBuffer;

function createParticleCountBuffer() {
    particleCountBuffer = device.createBuffer({
        size: resolutionX * resolutionY * Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
}

createParticleCountBuffer();

const particleUniformBuffer = device.createBuffer({
    size: 40,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

const colorizationUniformBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

// --- uniform utility stuff ---

const particleUniformsValues = new ArrayBuffer(40);
const particleUniformsViews = {
    size: new Uint32Array(particleUniformsValues, 0, 2),
    iters: new Uint32Array(particleUniformsValues, 8, 1),
    discs: new Uint32Array(particleUniformsValues, 12, 1),
    startRange: new Uint32Array(particleUniformsValues, 16, 1),
    a: new Float32Array(particleUniformsValues, 20, 1),
    b: new Float32Array(particleUniformsValues, 24, 1),
    c: new Float32Array(particleUniformsValues, 28, 1),
    d: new Float32Array(particleUniformsValues, 32, 1),
    zoom: new Float32Array(particleUniformsValues, 36, 1)
};

const colorizationUniformsValues = new ArrayBuffer(16);
const colorizationUniformsViews = {
    size: new Uint32Array(colorizationUniformsValues, 0, 2),
    particleIntensity: new Float32Array(colorizationUniformsValues, 8, 1)
};

// --- modules --- 

const particleModule = device.createShaderModule({
    label: "particle attractor module",
    code: await (
        await fetch("particles.wgsl")
    ).text()
});

const colorizationModule = device.createShaderModule({
    label: "colorization module",
    code: await (
        await fetch("colorization.wgsl")
    ).text()
});

// --- pipelines ---

const particlePipeline = device.createComputePipeline({
    label: "particle attractor pipeline",
    layout: "auto",
    compute: {
        module: particleModule
    }
});

const colorizationPipeline = device.createRenderPipeline({
    label: "colorization pipeline",
    layout: "auto",
    primitive: { 
        topology: "triangle-strip"
    },
    vertex: {
        module: colorizationModule
    },
    fragment: {
        module: colorizationModule,
        targets: [{ 
            format: presentationFormat 
        }]
    }
});

// --- bind groups ---

let particleBindGroup;
let colorizationBindGroup;

function createBindGroups() {

    particleBindGroup = device.createBindGroup({
        label: "particle attractor bind group",
        layout: particlePipeline.getBindGroupLayout(0),
        entries: [
            { 
                binding: 0, 
                resource: particleCountBuffer 
            },
            { 
                binding: 1, 
                resource: particleUniformBuffer 
            }
        ]
    });

    colorizationBindGroup = device.createBindGroup({
        label: "colorization bind group",
        layout: colorizationPipeline.getBindGroupLayout(0),
        entries: [
            { 
                binding: 0, 
                resource: particleCountBuffer 
            },
            { 
                binding: 1, 
                resource: colorizationUniformBuffer 
            }
        ]
    });

}

createBindGroups();

// --- timing --- 

let timeQuerySet;
let timeResolveBuffer;
let timeResultBuffer;

const doTimestamp = timeGPU && adapter.features.has("timestamp-query");

if (doTimestamp) {
    
    timeQuerySet = device.createQuerySet({
        type: "timestamp",
        count: 4
    });

    timeResolveBuffer = device.createBuffer({
        size: timeQuerySet.count * 8,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
    });

    timeResultBuffer = device.createBuffer({
        size: timeResolveBuffer.size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    
}

// --- rendering ---

let gpuTimeCompute = -1;
let gpuTimeRender = -1;

const perfCpuText = q("#perf-cpu");
const perfGpuComputeText = q("#perf-gpu-compute");
const perfGpuRenderText = q("#perf-gpu-render");

function draw(clearParticles = true) {

    if (!canDraw) {
        return;
    }

    const startTime = performance.now();

    particleUniformsViews.size[0] = colorizationUniformsViews.size[0] = resolutionX;
    particleUniformsViews.size[1] = colorizationUniformsViews.size[1] = resolutionY;
    particleUniformsViews.iters[0] = iters;
    particleUniformsViews.discs[0] = discs;
    particleUniformsViews.startRange[0] = startRange;
    particleUniformsViews.zoom[0] = zoom;
    particleUniformsViews.a[0] = a;
    particleUniformsViews.b[0] = b;
    particleUniformsViews.c[0] = c;
    particleUniformsViews.d[0] = d;

    colorizationUniformsViews.particleIntensity[0] = particleIntensity;

    device.queue.writeBuffer(particleUniformBuffer, 0, particleUniformsValues);
    device.queue.writeBuffer(colorizationUniformBuffer, 0, colorizationUniformsValues);

    const encoder = device.createCommandEncoder({ label: "command encoder" });

    if (clearParticles) {
        encoder.clearBuffer(particleCountBuffer);
    }

    const computePass = encoder.beginComputePass({
        label: "particle attractor pass",
        ...(doTimestamp && {
            timestampWrites: {
                querySet: timeQuerySet,
                beginningOfPassWriteIndex: 0,
                endOfPassWriteIndex: 1
            }
        })
    });
    computePass.setPipeline(particlePipeline);
    computePass.setBindGroup(0, particleBindGroup);
    computePass.dispatchWorkgroups(...reshapeDispatches(Math.ceil(particleCount / 64)));
    computePass.end();

    const renderPass = encoder.beginRenderPass({
        label: "colorization pass",
        colorAttachments: [
            {
                view: context.getCurrentTexture().createView(),
                clearValue: [0, 0, 0, 0],
                loadOp: "clear",
                storeOp: "store"
            }
        ],
        ...(doTimestamp && {
            timestampWrites: {
                querySet: timeQuerySet,
                beginningOfPassWriteIndex: 2,
                endOfPassWriteIndex: 3
            }
        })
    });

    renderPass.setPipeline(colorizationPipeline);
    renderPass.setBindGroup(0, colorizationBindGroup);
    renderPass.draw(4);
    renderPass.end();

    if (doTimestamp) {
        encoder.resolveQuerySet(timeQuerySet, 0, 4, timeResolveBuffer, 0);
        if (timeResultBuffer.mapState === "unmapped") {
            encoder.copyBufferToBuffer(timeResolveBuffer, 0, timeResultBuffer, 0, timeResultBuffer.size);
        }
    }

    device.queue.submit([ encoder.finish() ]);

    const jsTime = performance.now() - startTime;

    function updatePerfText() {
        perfCpuText.innerText = jsTime.toFixed(0) + "ms";
        perfGpuComputeText.innerText = gpuTimeCompute == -1 ? "not timed" : (gpuTimeCompute / 1_000_000).toFixed(3) + "ms";
        perfGpuRenderText.innerText = gpuTimeRender == -1 ? "not timed" : (gpuTimeRender / 1_000_000).toFixed(3) + "ms";
    }

    if (doTimestamp && timeResultBuffer.mapState === "unmapped") {
        timeResultBuffer.mapAsync(GPUMapMode.READ).then(() => {
            const times = new BigUint64Array(timeResultBuffer.getMappedRange());
            gpuTimeCompute = Number(times[1] - times[0]);
            gpuTimeRender = Number(times[3] - times[2]);
            timeResultBuffer.unmap();
            updatePerfText();
        });
    }

    updatePerfText();
    
}

canDraw = true;
draw();