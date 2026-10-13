/* 
  Last updated: 13/10/2026

  Remember the tab_window.css file

  you can change the active tab like this:

    const myTabWindow = document.querySelector("tab-window#my-tab-window");
    myTabWindow.activeTab = "3";


  Format:

    <tab-window
      default-tab="TAB_ID"
      tab-mode="(horizontal | vertical) +reverse" (e.g. tab-mode="vertical reverse", tab-mode="horizontal")
      scroll-step="50" (OPTIONAL)
    >
    
    <ol class="tab-list">

        <li class="tab" tab-id="TAB_ID">
          <button>
            <img src="ICON" class="tab-icon" /> (OPTIONAL)
            <span class="tab-title">TAB TITLE</span>
          </button>
        </li>

      </ol>


      <div class="tab-content">

        <div class="tab-body" tab-id="TAB_ID">
          TAB CONTENT
          <h1 style="color: orange; background: cyan;">Any HTML here</h1>
        </div>

      </div>

    </tab-window>

*/

"use strict";

const elemName = "tab-window"; // set the element's name e.g. <tab-window>! remember to update the CSS

const activeClass = "active";
const tabWindowAttrNames = {
  tabId: "tab-id",
  scrollStep: "scroll-step",
  tabMode: "tab-mode",
  defaultTab: "default-tab"
};

class TabWindow extends HTMLElement {
  // I'm completely new to this (web components). can probably be improved

  constructor() {
    super();
  }

  #initialized = false;
  #timeoutId = null;
  #activeTabId = null;
  #currentTabIndex = null;

  tabList = null; tabHeaders = null; tabBodies = null;
  tabs = [];

  
  // tab-mode attribute

  static get observedAttributes() { return [ tabWindowAttrNames.tabMode ]; }

  get tabMode() { return this.getAttribute( tabWindowAttrNames.tabMode ); }
  set tabMode(value) { if (value) this.setAttribute( tabWindowAttrNames.tabMode, value ); }

  attributeChangedCallback(name, prevValue, newValue) {
    if (prevValue === newValue) return;

    switch (name) {
      case tabWindowAttrNames.tabMode: {
        this.#switchTabMode(newValue);
      } break;
    
      default: break;
    }
  }

  #scrollHandler = (event) => {
    event.preventDefault();
    
    const scrollStep = Number(this.scrollStep) || 50;
    this.tabList.scrollLeft += event.deltaY > 0 ? scrollStep : -scrollStep;
  }

  #switchTabMode(tabMode) {
    if (!this.tabList) return;

    const modes = ["horizontal", "horizontal-reverse", "vertical", "vertical-reverse"];
    if ( !modes.includes(tabMode) ) {
      throw new TypeError(
        // `[${tabModeAttr}] should only be one of:\n  [\n    "${modes.join('",\n    "')}"\n  ]\nGot: "${tabMode}"\n`
        `[${tabWindowAttrNames.tabMode}] should only be one of: [${modes.join(", ")}].\nGot: "${tabMode}"\n`
      );
    }

    if ( tabMode.includes("horizontal") ) {
      this.tabList.addEventListener("wheel", this.#scrollHandler);
    } else {
      this.tabList.removeEventListener("wheel", this.#scrollHandler);
    }
  }


  // default-tab attribute

  get defaultTab() { return this.getAttribute( tabWindowAttrNames.defaultTab ); }
  set defaultTab(value) { if (value) this.setAttribute( tabWindowAttrNames.defaultTab, value ); }


  // scroll-step attribute

  get scrollStep() { return this.getAttribute( tabWindowAttrNames.scrollStep ); }
  set scrollStep(value) { if (value) this.setAttribute( tabWindowAttrNames.scrollStep, value ); }


  // main stuff

  getTab(tabId) {
    const header = this.querySelector(`.tab-list > .tab[${tabWindowAttrNames.tabId}="${tabId}"]`);
    const body = this.querySelector(`.tab-content > .tab-body[${tabWindowAttrNames.tabId}="${tabId}"]`);

    if (!body) {
      throw new TypeError(`Tab button [id: "${tabId}"] does not have an associated tab.\nCheck if you've set the default tab properly`);
    }

    return { header, body, id: tabId };
  }

  #setTab(tab) { // expects { header, body, id: normalizedId }
    // sets .active class and does all the aria stuff

    // Remove .active from all .tab & .tab-body
    for (const tabHeader of this.tabHeaders) {
      tabHeader.ariaSelected = false;
      tabHeader.classList.remove(activeClass);
    }
    for (const tabBody of this.tabBodies) tabBody.classList.remove(activeClass);
    
    // Add .active to selected .tab & .tab-body
    tab.header.classList.add(activeClass);
    tab.header.ariaSelected = true;
    tab.body.classList.add(activeClass);
  }

  // activeTabIndex
  
  get activeTabIndex() {
    return this.#currentTabIndex;
  }

  set activeTabIndex(tabIndex) {
    this.#currentTabIndex = tabIndex;

    const tab = this.getTab( this.tabs[tabIndex] );

    this.#setTab(tab);
  }

  // active tab

  get activeTab() {
    return this.#activeTabId;
  }

  set activeTab(tabId) {
    this.#activeTabId = tabId;

    const tab = this.getTab(tabId);

    this.#setTab(tab);

    // set tab index
    this.activeTabIndex = [...this.tabHeaders].indexOf(tab.header);
  }

  // navigation methods

  shiftTab(relativePos) {
    if (relativePos == null) throw new TypeError("Missing `relativePos` argument");

    this.activeTab = this.tabs.at(
      (this.activeTabIndex + relativePos) % this.tabs.length
    );

    return this.activeTab;
  }

  nextTab() {
    return this.shiftTab(1);
  }

  prevTab() {
    return this.shiftTab(-1);
  }

  init() { // Main code

    this.tabList = this.querySelector(".tab-list");
    this.tabHeaders = this.querySelectorAll(".tab-list > .tab");
    this.tabBodies = this.querySelectorAll(".tab-content > .tab-body");

    { // setup .tab[tab-id] and .tab-body[tab-id]
      for (const tabHeader of this.tabHeaders) {
        Object.defineProperty(tabHeader, "tabId", {
          get() { return this.getAttribute(tabWindowAttrNames.tabId); },
          set(value) { if (value) this.setAttribute(tabWindowAttrNames.tabId, value); },
          configurable: true
        });
      }

      for (const tabBody of this.tabBodies) {
        Object.defineProperty(tabBody, "tabId", {
          get() { return this.getAttribute(tabWindowAttrNames.tabId); },
          set(value) { if (value) this.setAttribute(tabWindowAttrNames.tabId, value); },
          configurable: true
        });
      }
    }

    { // collect tab IDs
      for (const tabHeader of this.tabHeaders) this.tabs.push(tabHeader.tabId);

      /* 
        this only collects the IDs of tabs that are possible to access.
        if there are extra tab bodies, their IDs will not be added to this.tabs
      */
    }

    { // Basic a11y, set roles
      this.tabList.role = "tablist";
      for (const tabHeader of this.tabHeaders) tabHeader.role = "tab";
      for (const tabBody of this.tabBodies) tabBody.role = "tabpanel";
    }

    { // Set default tab
      if (!this.defaultTab) {
        throw new TypeError(
          `<${elemName}> element must contain a ${tabWindowAttrNames.defaultTab} attribute with a tabId. e.g. ${tabWindowAttrNames.defaultTab}="tab-1"\n`
        );
      }

      this.activeTab = this.defaultTab;
    }

    { // handle #hashes
      const hash = location.hash;

      if (hash) {
        // any tabs with a targeted element?
        const tab = this.querySelector(`.tab-content > .tab-body:has(${hash})`);
        
        if (tab) {
          this.activeTab = tab.tabId;
          document.querySelector(hash).scrollIntoView();
          this.getTab(tab.tabId).header.scrollIntoView();
        }
      }
    }

    // Main behaviour

    for (const tabHeader of this.tabHeaders) {
      tabHeader.ariaSelected ||= false;

      tabHeader.querySelector("button").addEventListener("click", () => {
        const selectedTabId = tabHeader.tabId;

        this.activeTab = selectedTabId;
      });
    }

    
    this.#timeoutId = null; // put at end

    this.#switchTabMode(this.tabMode);
  }

  // other stuffs

  connectedCallback() {
    if (this.#initialized) return; // only set up once

    this.#timeoutId = setTimeout(() => this.init(), 0); 
    // ^^ this waits for it to load idk how. please trus me

    this.#initialized = true;
  }

  disconnectedCallback() {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }

    // space to cleanup event listeners, which I'm not going to do. (yet)
  }
}

customElements.define(elemName, TabWindow);
