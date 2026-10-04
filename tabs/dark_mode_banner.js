"use strict";

const $banner = document.createElement("div");
  $banner.classList.add("banner");
  $banner.innerHTML = `
    <span>I haven't made the styles work well for dark mode, sorry!</span>
    <span>You might have to change how <code>img.tab-icon</code> works</span>
  `;

Object.assign($banner.style, {
  backgroundColor: "blueviolet",
  color: "white",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "10px 14px",
  marginBottom: "20px",
  borderRadius: "6px"
});

function banner(mediaQueryListEvent) {
  if (mediaQueryListEvent.matches) { // dark mode on
    document.body.prepend($banner);
  } else { // dark mode off
    $banner.remove();
  }
}

const query = "(prefers-color-scheme: dark)";

banner(matchMedia(query));

matchMedia(query)
  .addEventListener("change", (e) => banner(e));

/*
  <tab-window | page-tabs> {
    --text-color: #B4C7D9;
    --tab-body-color: #152F56;
    --border-color: #1F3C67;

    --selected-tab-dormant-color: #152F56;
    --selected-tab-hover-color: #152F56;
    --selected-tab-active-color: #152F56;

    --unselected-tab-dormant-color: #1F3C67;
    --unselected-tab-hover-color: #2A466F;
    --unselected-tab-active-color: #2A466F;

    --tab-list-background-color: #1F3C67;
    --tab-height: 2.3em;
    --corner-radius: 6px;
  }

  (yes these colours are from e621, I was lazy)
*/
  