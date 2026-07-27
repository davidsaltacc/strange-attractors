const q = s => document.querySelector(s);
const qa = s => document.querySelectorAll(s);
const cq = (c, s) => c.querySelector(s);
const cqa = (c, s) => c.querySelectorAll(s);

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

    [ 0.01, 0.1, 1, 10, 100, 1000, 10_000, 100_000, 1_000_000 ].forEach(n => {
        const s = n.toString().replace(".", "");
        make("m" + s, -n);
        make("p" + s, n);
    });

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

function rgbf2hsv(r, g, b) { // https://stackoverflow.com/a/54070620
    let v = Math.max(r, g, b);
    let c = v - Math.min(r, g, b);
    let h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c)); 
    return [ 60 * (h < 0 ? h + 6 : h), v && c / v, v ];
}

function hsv2rgbf(h, s, v) // https://stackoverflow.com/a/54024653
{                              
    let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);     
    return [ f(5), f(3), f(1) ];
}

function rgbf2hex(r, g, b) {
    return "#" + 
        Math.floor(r * 255).toString(16).padStart(2, "0") + 
        Math.floor(g * 255).toString(16).padStart(2, "0") + 
        Math.floor(b * 255).toString(16).padStart(2, "0");
}

function hex2rgbf(hex) {
    if (hex.startsWith("#")) {
        hex = hex.substring(1);
    }
    const s = hex.length == 3;
    return [
        parseInt(hex[0] + (s ? hex[0] : hex[1]), 16) / 255,
        parseInt((s ? hex[1] : hex[2]) + (s ? hex[1] : hex[3]), 16) / 255,
        parseInt((s ? hex[2] : hex[4]) + (s ? hex[2] : hex[5]), 16) / 255
    ];
}

function setupColorPicker(id, getter, setter) {
        
    const element = q("#" + id);
    const colorPreview = cq(element, ".color-picker-preview");
    const hue = cq(element, ".color-picker-h");
    const hueCursor = cq(element, ".color-picker-h-cursor");
    const colorHexInput = cq(element, ".color-picker-hex-input");
    const sv = cq(element, ".color-picker-s-v");
    const svCursor = cq(element, ".color-picker-s-v-cursor");

    let preservedHue = 0;
    let lastS = 1;

    function resetToColor(colorF, skipHexInput) {

        let colorHex = rgbf2hex(...colorF);
        let colorHsv = rgbf2hsv(...colorF);

        if (colorHsv[1] == 0 || lastS == 0) {
            colorHsv[0] = preservedHue;
            colorF = hsv2rgbf(...colorHsv);
            colorHex = rgbf2hex(...colorF);
        }
        if (colorHsv[1] != 0) {
            preservedHue = colorHsv[0];
        }
        if (lastS == 0) {
            setter(colorF);
        }
        lastS = colorHsv[1];
    
        const hueRgb = hsv2rgbf(colorHsv[0], 1, 1);
        const hueHex = rgbf2hex(...hueRgb);
    
        colorPreview.style.backgroundColor = colorHex;

        if (!skipHexInput) {
            colorHexInput.value = colorHex.toLowerCase();
        }
    
        hueCursor.style.backgroundColor = hueHex;
        hueCursor.style.left = -6 + colorHsv[0] / 360 * 200 + "px";
    
        sv.style.background = "linear-gradient(transparent 0%, #000000 100%), linear-gradient(to left, transparent 0%, #ffffff 100%), " + hueHex;
    
        svCursor.style.backgroundColor = colorHex;
        svCursor.style.left = -10 + colorHsv[1] * 200 + "px";
        svCursor.style.top = -10 + (1 - colorHsv[2]) * 200 + "px";

    }

    const defaultColorFloat = getter();

    resetToColor(defaultColorFloat);

    colorHexInput.oninput = () => resetToColor(hex2rgbf(colorHexInput.value), true);

    function updateHue(newHue) {

        const currentColor = getter();
        const currentColorHsv = rgbf2hsv(...currentColor);

        newHue = Math.min(Math.max(newHue, 0), 0.9999); // 0.9999 so it doesn't loop back around, which is unsatisfying
        newHue = Math.floor(newHue * 360);

        preservedHue = newHue;

        const newColor = hsv2rgbf(newHue, currentColorHsv[1], currentColorHsv[2]);
        
        setter(newColor);
        resetToColor(newColor);
        
    }

    function updateSv(newS, newV) {

        const currentColor = getter();
        const currentColorHsv = rgbf2hsv(...currentColor);

        newS = Math.min(Math.max(newS, 0), 1);
        newV = 1 - Math.min(Math.max(newV, 0), 1);

        const newColor = hsv2rgbf(currentColorHsv[0], newS, newV);
        
        setter(newColor);
        resetToColor(newColor);

    }

    let hueClicked = false;
    let svClicked = false;
    
    hue.onmousedown = evt => {
        if (evt.button == 0) {
            hueClicked = true;
            const rect = hue.getBoundingClientRect();
            updateHue((evt.clientX - rect.x) / 200);
        }
    };
    
    sv.onmousedown = evt => {
        if (evt.button == 0) {
            svClicked = true;
            const rect = sv.getBoundingClientRect();
            updateSv((evt.clientX - rect.x) / 200, (evt.clientY - rect.y) / 200);
        }
    };

    document.addEventListener("mouseup", evt => {
        if (evt.button == 0) {
            hueClicked = false;
            svClicked = false;
        }
    });

    document.addEventListener("mousemove", evt => {
        if (hueClicked) {
            const rect = hue.getBoundingClientRect();
            updateHue((evt.clientX - rect.x) / 200);
        }
        if (svClicked) {
            const rect = sv.getBoundingClientRect();
            updateSv((evt.clientX - rect.x) / 200, (evt.clientY - rect.y) / 200);
        }
    });

}

const canvas = q("#canvas");
const colorPreviewCanvas = q("#color-preview");
const context = canvas.getContext("webgpu");
const colorPreviewContext = colorPreviewCanvas.getContext("webgpu");
const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
    device,
    format: presentationFormat
});

colorPreviewContext.configure({
    device,
    format: presentationFormat
});

let resolutionX = 500;
let resolutionY = 500;
let particleCount = 1_000_000;
let particleIntensity = 0.3;
let timeGPU = true;
let iters = 20;
let discs = 2;
let startRange = 2;
let a = 2;
let b = 2;
let c = 1;
let d = -1;
let panX = 0;
let panY = 0;
let zoom = 0.33;

let gradientColorsUsed = 3;
let gradientColors = [ 
    0., 0., 0.0, 1.,
    0.4, 0.4, 0.8, 1.,
    1., 1., 1., 1.
];
let gradientPositions = [ 0, 0.15, 0.9 ];
let gradientBiases = [ 0.4, 0.25 ];

let canDraw = false;

setupNumberInput("value-a", () => a ?? 0, v => { a = v ?? a; draw(); });
setupNumberInput("value-b", () => b ?? 0, v => { b = v ?? b; draw(); });
setupNumberInput("value-c", () => c ?? 0, v => { c = v ?? c; draw(); });
setupNumberInput("value-d", () => d ?? 0, v => { d = v ?? d; draw(); });

setupNumberInput("value-particle-intensity", () => particleIntensity ?? 1, v => { particleIntensity = v ?? particleIntensity; draw(); }, true, 0, 1);
setupNumberInput("value-particle-count", () => particleCount ?? 1000, v => { particleCount = v ?? particleCount; draw(); }, false);
setupNumberInput("value-particle-iterations", () => iters ?? 10, v => { iters = v ?? iters; draw(); }, false);
setupNumberInput("value-iter-discards", () => discs ?? 2, v => { discs = v ?? discs; draw(); }, false);

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

let someColorWhatever = [ 0.4, 0.6, 0.9 ];
setupColorPicker("gradient-color-picker", () => someColorWhatever, v => { someColorWhatever = v; });

canvas.width = resolutionX;
canvas.height = resolutionY;

var mouseX = 0;
var mouseY = 0;
var mouseRightClicked = false;

function updateMouseCoords(evt) {
    const rect = evt.target.getBoundingClientRect();
    mouseX = (2 * (evt.clientX - rect.left) - canvas.clientWidth) / canvas.clientWidth;
    mouseY = -(2 * (evt.clientY - rect.top) - canvas.clientHeight) / canvas.clientHeight;
    mouseX = mouseX / zoom + panX;
    mouseY = mouseY / zoom + panY;
}

function onZoom(evt) {
    evt.preventDefault();
    const z = Math.exp(-evt.deltaY / 500);
    updateMouseCoords(evt);
    panX = mouseX + (panX - mouseX) / z;
    panY = mouseY + (panY - mouseY) / z;
    zoom *= z;
    draw();
}

function mouseDown(evt) {
    if (evt.button == 2) {
        mouseRightClicked = true;
    }
    updateMouseCoords(evt);
}

function mouseUp(evt) {
    if (evt.button == 2) {
        mouseRightClicked = false;
    }
}

function mouseMove(evt) {
    if (mouseRightClicked) {

        const oldX = mouseX;
        const oldY = mouseY;
        updateMouseCoords(evt);
        panX += oldX - mouseX;
        panY += oldY - mouseY;
        updateMouseCoords(evt);

        draw();
    }
}

canvas.onwheel = onZoom;
canvas.onmousedown = mouseDown;
document.addEventListener("mouseup", mouseUp);
canvas.onmousemove = mouseMove;
canvas.oncontextmenu = evt => evt.preventDefault();

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
    size: 48,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

const colorizationUniformBuffer = device.createBuffer({
    size: 208,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

const colorPreviewUniformBuffer = device.createBuffer({
    size: 208,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

// --- uniform utility stuff ---

const particleUniformsValues = new ArrayBuffer(48);
const particleUniformsViews = {
    size: new Uint32Array(particleUniformsValues, 0, 2),
    iters: new Uint32Array(particleUniformsValues, 8, 1),
    discs: new Uint32Array(particleUniformsValues, 12, 1),
    startRange: new Uint32Array(particleUniformsValues, 16, 1),
    a: new Float32Array(particleUniformsValues, 20, 1),
    b: new Float32Array(particleUniformsValues, 24, 1),
    c: new Float32Array(particleUniformsValues, 28, 1),
    d: new Float32Array(particleUniformsValues, 32, 1),
    zoom: new Float32Array(particleUniformsValues, 36, 1),
    pan: new Float32Array(particleUniformsValues, 40, 2)
};

const colorizationUniformsValues = new ArrayBuffer(208);
const colorizationUniformsViews = {
    size: new Uint32Array(colorizationUniformsValues, 0, 2),
    colorsUsed: new Uint32Array(colorizationUniformsValues, 8, 1),
    particleIntensity: new Float32Array(colorizationUniformsValues, 12, 1),
    gradientColors: new Float32Array(colorizationUniformsValues, 16, 32),
    gradientPositions: new Float32Array(colorizationUniformsValues, 144, 8),
    gradientBiases: new Float32Array(colorizationUniformsValues, 176, 8)
};

const colorPreviewUniformsValues = new ArrayBuffer(208);
const colorPreviewUniformsViews = {
    colorsUsed: new Uint32Array(colorPreviewUniformsValues, 0, 1),
    gradientColors: new Float32Array(colorPreviewUniformsValues, 16, 32),
    gradientPositions: new Float32Array(colorPreviewUniformsValues, 144, 8),
    gradientBiases: new Float32Array(colorPreviewUniformsValues, 176, 8)
};

// --- modules --- 

async function createShaderModule(label, filename) {

    async function constructCode(filename) {

        const code = await (
            await fetch(filename)
        ).text();
        let newCode = code;

        for (const line of code.split("\n")) {
            if (line.startsWith("//#include ")) {
                newCode = newCode.replace(line, await constructCode(line.split("//#include ")[1]));
            }
        }

        return newCode;

    }

    return device.createShaderModule({
        label,
        code: await constructCode(filename)
    });

}

const particleModule = await createShaderModule("particle attractor module", "shaders/core/particles.wgsl");
const colorizationModule = await createShaderModule("colorization module", "shaders/core/colorization.wgsl");
const colorPreviewModule = await createShaderModule("color preview module", "shaders/core/color_preview.wgsl");

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

const colorPreviewPipeline = device.createRenderPipeline({
    label: "color preview pipeline",
    layout: "auto",
    primitive: { 
        topology: "triangle-strip"
    },
    vertex: {
        module: colorPreviewModule
    },
    fragment: {
        module: colorPreviewModule,
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


const colorPreviewBindGroup = device.createBindGroup({
    label: "color preview bind group",
    layout: colorPreviewPipeline.getBindGroupLayout(0),
    entries: [
        { 
            binding: 0, 
            resource: colorPreviewUniformBuffer 
        }
    ]
});

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
    particleUniformsViews.pan[0] = panX;
    particleUniformsViews.pan[1] = panY;
    particleUniformsViews.zoom[0] = zoom;
    particleUniformsViews.a[0] = a;
    particleUniformsViews.b[0] = b;
    particleUniformsViews.c[0] = c;
    particleUniformsViews.d[0] = d;

    colorizationUniformsViews.particleIntensity[0] = particleIntensity;
    
    colorizationUniformsViews.colorsUsed[0] = gradientColorsUsed;

    for (let c = 0; c < gradientColorsUsed; c++) {

        colorizationUniformsViews.gradientColors[4 * c] = gradientColors[4 * c];
        colorizationUniformsViews.gradientColors[4 * c + 1] = gradientColors[4 * c + 1];
        colorizationUniformsViews.gradientColors[4 * c + 2] = gradientColors[4 * c + 2];
        colorizationUniformsViews.gradientColors[4 * c + 3] = gradientColors[4 * c + 3];

        colorizationUniformsViews.gradientPositions[c] = gradientPositions[c];

        colorizationUniformsViews.gradientBiases[c] = gradientBiases[c];
        
    }

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

function drawColorPreview() {

    colorPreviewUniformsViews.colorsUsed[0] = gradientColorsUsed;

    for (let c = 0; c < gradientColorsUsed; c++) {

        colorPreviewUniformsViews.gradientColors[4 * c] = gradientColors[4 * c];
        colorPreviewUniformsViews.gradientColors[4 * c + 1] = gradientColors[4 * c + 1];
        colorPreviewUniformsViews.gradientColors[4 * c + 2] = gradientColors[4 * c + 2];
        colorPreviewUniformsViews.gradientColors[4 * c + 3] = gradientColors[4 * c + 3];

        colorPreviewUniformsViews.gradientPositions[c] = gradientPositions[c];

        colorPreviewUniformsViews.gradientBiases[c] = gradientBiases[c];
        
    }

    device.queue.writeBuffer(colorPreviewUniformBuffer, 0, colorPreviewUniformsValues);

    const encoder = device.createCommandEncoder({ label: "color preview command encoder" });

    const renderPass = encoder.beginRenderPass({
        label: "color preview pass",
        colorAttachments: [
            {
                view: colorPreviewContext.getCurrentTexture().createView(),
                clearValue: [0, 0, 0, 0],
                loadOp: "clear",
                storeOp: "store"
            }
        ]
    });

    renderPass.setPipeline(colorPreviewPipeline);
    renderPass.setBindGroup(0, colorPreviewBindGroup);
    renderPass.draw(4);
    renderPass.end();

    device.queue.submit([ encoder.finish() ]);

}

colorPreviewCanvas.onresize = () => {
    const rect = colorPreviewCanvas.getBoundingClientRect();
    colorPreviewCanvas.width = Math.floor(rect.width);
    colorPreviewCanvas.height = Math.floor(rect.height);
}

canDraw = true;
draw();
drawColorPreview();