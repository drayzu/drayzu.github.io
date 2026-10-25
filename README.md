<p align="center">
  <a href="https://drayzu.github.io/"><picture><source type="image/avif" srcset="media/vuelo.avif"><img src="media/vuelo.webp" width="100%" alt="One camera flight through the series: out of Potencias, past a star being wrapped in a Dyson swarm, along the cone of Tiempo, into the galaxy of Civilización, and back out to the map."></picture></a>
</p>

<p align="center">
  <a href="https://drayzu.github.io/"><picture><source media="(prefers-color-scheme: dark)" srcset="media/link-dark.svg"><img src="media/link-light.svg" width="49%" alt="Enter drayzu.github.io"></picture></a>
</p>

<details>
<summary><sub>How it's made</sub></summary>
<br>

- One continuous camera flight in Three.js: scrolling moves the camera between the four pieces of the series.
- Pieces still in progress are nebulae that condense as you approach; entering a live piece dives into it.
- Everything is particles and shaders, with bloom, a little grain, and a plain list for browsers without WebGL.
- English and Spanish. `npm install`, `npm run dev`; pushing to `main` deploys to GitHub Pages, and `npm run deploy:dcc` publishes the same site at users.dcc.uchile.cl/~direyes.
- The clip above is recorded from the site itself: `python tools/readme.py`.

</details>
