# strange attractors

a small project to render strange attractors on the gpu using webgpu with high performance, with a focus on appearance and art.

# todo list

- a seperate option for the background color? and only apply the gradient to the particles
- on the color gradient editor, an exponential view mode (because otherwise often all is mostly squashed to the left)
- in the color editor, restrict dragging stops beyond the next/previous stop
- in the color editor, clamp user inputted values to 0-1
- a way to downscale the preview, like i want to see what i am exporting but not have it all over my screen
- proper export section (rendering in multiple steps, storage buffer remains filled, just do multiple compute passes instead of 1 big one to not fry the gpu)
- make the ui look a bit nicer, it just feels a bit unpolished
- url preset exporting
- try to figure out how to reduce noise
- option for exponential/logarithmic? intensity scaling, because just adjusting the colormap isn't enough sometimes (especially with the "difficult" attractors, like bad hair day)
- single-particle mode (will allow to enable gumowski-mira and hopalong, and i suspect it will heavily reduce noisiness on some attractors)