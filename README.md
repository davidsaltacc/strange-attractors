# strange attractors

a small project to render strange attractors on the gpu using webgpu with high performance, with a focus on appearance and art.

# todo list

- !!!! the integer over/underflow/??? issue still hasn't been fixed, the pixels at the very right of the render (just outside) appear on the leftmost column instead
- configurable particle splat size?
- custom colors (customizable gradient colormap, and different coloring options besides linear/exp)
- more attractors besides de jong
- button to reset the camera view
- make all the number inputs aligned to the right instead of all being centered and wonky
- a way to downscale the preview, like i want to see what i am exporting but not have it all over my screen
- proper export section (rendering in multiple steps, storage buffer remains filled, just do multiple compute passes instead of 1 big one to not fry the gpu)
- make the ui look a bit nicer, it just feels a bit unpolished
- fix panning at non-square aspect ratios (and then implement the same fix for chromablossom)