"use strict";

import { animateFavicon, generateURIs } from "./animate_favicon.js";

animateFavicon( generateURIs("./favicon_frames/", "frame_%n.png", "%n", 16), 4);
