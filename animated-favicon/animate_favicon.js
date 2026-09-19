/*
  Last updated: 18/09/2026
*/

"use strict";

function animateFavicon(frames, loopTime) {
  const favicon = document.querySelector("link[rel='shortcut icon']") || (() => {
    // and if that doesn't exist, make one:
    const link = document.createElement("link");
      link.rel = "shortcut icon";
      link.type = "image/x-icon";
    
    document.head.appendChild(link);
    return link;
  })();

  let currentIndex = -1;
  const msPerFrame = (loopTime / frames.length) * 1000;

  setInterval(() => { // main loop. maybe should use requestAnimationFrame but cba
    if (currentIndex === frames.length - 1) {
      currentIndex = 0;
    } else currentIndex++;

    favicon.href = frames[ currentIndex ];
  }, msPerFrame);
}


// helper function that makes a list of where the images are at

function generateURIs(path, templateFileName, templateToken, frameCount) {
  const URIs = [];
  const normalisedPath = path.endsWith("/") ? path : path + "/";
  const padLength = String(frameCount).length;

  for (let i = 1; i <= frameCount; i++) {
    URIs.push(
      normalisedPath
       + templateFileName.replaceAll(
          templateToken,
          String(i).padStart(padLength, "0")
        )); // makes the filename and adds padding e.g. frame_1.png ❌ -> frame_01.png
  }

  return URIs;
}

export { animateFavicon, generateURIs };
