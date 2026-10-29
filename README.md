<p align="center">
  <a href="https://drayzu.github.io/"><picture><source type="image/avif" srcset="media/vuelo.avif"><img src="media/vuelo.webp" width="100%" alt="One camera flight through the series: out of Espacio, past the Atlas (a star being wrapped in a Dyson swarm, the library beside the route), along the cone of Tiempo, into the galaxy of Destino, on to Infinito, and back out to the map."></picture></a>
</p>

<p align="center">
  <a href="https://drayzu.github.io/"><picture><source media="(prefers-color-scheme: dark)" srcset="media/link-dark.svg"><img src="media/link-light.svg" width="49%" alt="Enter drayzu.github.io"></picture></a>
</p>

<details>
<summary><sub>How it's made</sub></summary>
<br>

- One continuous camera flight in Three.js: scrolling moves the camera between the four pieces of the series: Espacio, Tiempo, Destino and Infinito. The Atlas, the library that serves them, shines beside the route and is always one click away.
- Each piece is drawn in particles at its stop, and entering one dives into it.
- Everything is particles and shaders, with bloom, a little grain, and a plain list for browsers without WebGL.
- English and Spanish, with the controls of the other pieces. Keys: `A` autoplay (the camera travels the series by itself and ends on the map), `L` language; the arrows go stop by stop.
- `npm install`, `npm run dev`; pushing to `main` deploys to GitHub Pages, and `npm run deploy:dcc` publishes the same site at users.dcc.uchile.cl/~direyes.
- The clip above is recorded from the site itself: `python tools/readme.py`.

</details>
