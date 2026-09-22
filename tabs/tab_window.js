/* 
  Last updated: 22/09/2026

  Remember the tab_window.css file

  you can change the active tab like this:

    const myTabWindow = document.querySelector("tab-window#my-tab-window");
    myTabWindow.activeTab = "3";


  Format:

    <tab-window data-default-tab="TAB_ID" class="(horizontal | vertical) +reverse"> (e.g. class="vertical reverse", class="horizontal")
    
    <ol class="tab-list" data-scroll-step="50 (OPTIONAL)">

        <li class="tab" data-tab-id="TAB_ID">
          <button>
            <img src="ICON" class="tab-icon" /> (OPTIONAL)
            <span class="tab-title">TAB TITLE</span>
          </button>
        </li>

      </ol>


      <div class="tab-content">

        <div class="tab-body" data-tab-id="TAB_ID">
          TAB CONTENT
          <h1 style="color: orange; background: cyan;">Any HTML here</h1>
        </div>

      </div>

    </tab-window>

*/

"use strict";

const elemName = "tab-window"; // set the element's name e.g. <tab-window>! remember to update the CSS

const activeClass = "active";
const tabIdAttr = "data-tab-id";

class TabWindow extends HTMLElement {
  // I'm completely new to this (web components). can probably be improved

  constructor() {
    super();
  }

  #initialized = false;
  #timeoutId = null;
  #activeTabId = null;

  tabList = null; tabHeaders = null; tabBodies = null;

  getTab(tabId) {
    const header = this.querySelector(`.tab-list .tab[${tabIdAttr}="${tabId}"]`);
    const body = this.querySelector(`.tab-content .tab-body[${tabIdAttr}="${tabId}"]`);

    if (!body) {
      throw new TypeError(`Tab button [id: "${tabId}"] does not have an associated tab`);
    }

    return { header, body, id: tabId };
  }

  get activeTab() {
    return this.#activeTabId;
  }

  set activeTab(tabId) {
    this.#activeTabId = tabId;

    const tab = this.getTab(tabId);

    // Remove .active from all .tab & .tab-body
    this.tabHeaders.forEach(tabHeader => {
      tabHeader.ariaSelected = false;
      tabHeader.classList.remove(activeClass);
    });

    this.tabBodies.forEach(tabBody => tabBody.classList.remove(activeClass));

    // Add .active to selected .tab & .tab-body
    tab.header.classList.add(activeClass);
    tab.header.ariaSelected = true;
    tab.body.classList.add(activeClass);
  }

  init() { // Main code

    this.tabList = this.querySelector(".tab-list");
    this.tabHeaders = this.querySelectorAll(".tab-list .tab");
    this.tabBodies = this.querySelectorAll(".tab-content .tab-body");

    { // Basic a11y, set roles
      this.tabList.role = "tablist";
      this.tabHeaders.forEach(tabHeader => tabHeader.role = "tab");
      this.tabBodies.forEach(tabBody => tabBody.role = "tabpanel");
    }

    { // Set default tab
      const defaultTab = this.dataset.defaultTab;

      if (!defaultTab) {
        throw new TypeError(
          `<${elemName}> element must contain a data-default-tab attribute with a tabId. e.g. data-default-tab="1"`
        );
      }

      this.activeTab = defaultTab;
    }

    { // Throw error if both .horizontal and .vertical class included
      const hrz = this.classList.contains("horizontal");
      const vrt =  this.classList.contains("vertical");

      if (hrz && vrt){
        throw new TypeError(
          `<${elemName}> can only contain .horizontal OR .vertical, but not both. Got: [${[ ...this.classList ]}]`
        );
      }
    }

    { // Horizontal scrolling for the tab bar
      if (this.classList.contains("horizontal")) {
        const scrollStep = Number(this.tabList.dataset.scrollStep) || 50;

        this.tabList.addEventListener("wheel", event => {
          event.preventDefault();
          this.tabList.scrollLeft += event.deltaY > 0 ? scrollStep : -scrollStep;
        });
      }
    }

    { // handle #hashes
      const hash = location.hash;

      if (hash) {
        // any tabs with a targeted element?
        const tab = this.querySelector(`.tab-content .tab-body:has(${hash})`);
        
        if (tab) {
          this.activeTab = tab.dataset.tabId;
          document.querySelector(hash).scrollIntoView();
          this.getTab(tab.dataset.tabId).header.scrollIntoView();
        }
      }
    }

    // Main behaviour

    this.tabHeaders.forEach(tabHeader => {
      tabHeader.ariaSelected ||= false;

      tabHeader.querySelector("button").addEventListener("click", () => {
        const selectedTabId = tabHeader.dataset.tabId;

        this.activeTab = selectedTabId;
      });
    });

    
    this.#timeoutId = null; // put at end
  }

  // other stuffs

  connectedCallback() {
    if (this.#initialized) return; // only set up once

    this.#timeoutId = setTimeout(() => {
      this.init();
    }, 0); // this waits for it to load idk how. please trus me

    this.#initialized = true;
  }

  disconnectedCallback() {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }

    // space to cleanup event listeners, which I'm not going to do.
  }
}

customElements.define(elemName, TabWindow);
