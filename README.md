# strange attractors

a small project to render strange attractors on the gpu using webgpu with high performance, with a focus on appearance and art.

# todo list

- configurable particle splat size?
- on the color gradient editor, an exponential view mode (because otherwise often all is mostly squashed to the left)
- in the color editor, restrict dragging stops beyond the next/previous stop
- in the color editor, clamp user inputted values to 0-1
- more attractors besides de jong
- a way to downscale the preview, like i want to see what i am exporting but not have it all over my screen
- proper export section (rendering in multiple steps, storage buffer remains filled, just do multiple compute passes instead of 1 big one to not fry the gpu)
- make the ui look a bit nicer, it just feels a bit unpolished