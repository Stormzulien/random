/* 
  Last updated: 13/10/2026

  Remember the page_tabs.css file

  Mostly a clone of tab_window.js but a bit simpler.
  This one allows you to link tabs like: "www.example.com/home#tab-5".

  you can change the active tab like this:

    const myPageTabs = document.querySelector("page-tabs#my-page-tabs");
    myPageTabs.activeTab = "tab-2";

    ⚠️ NOTE: this WON'T set the #hash in the URL. Set it using location.hash = "#..." ⚠️


  Format:

    <page-tabs
      default-tab="TAB_ID"
      tab-mode="(horizontal | vertical) +reverse" (e.g. tab-mode="vertical reverse", tab-mode="horizontal")
      scroll-step="50" (OPTIONAL)
    >

      <ol class="tab-list">

        <li class="tab">
          <a href="#TAB_ID">
            <img src="ICON" class="tab-icon" />  (OPTIONAL)
            <span class="tab-title">TAB TITLE</span>
          </a>
        </li>

      </ol>


      <div class="tab-content">

        <div class="tab-body" id="TAB_ID">
          TAB CONTENT
          <h1 style="color: orange; background: cyan;">Any HTML here</h1>
        </div>

      </div>

    </page-tabs>

*/


"use strict";

const elemName = "page-tabs"; // set the element's name e.g. <page-tabs>! remember to update the CSS

const activeClass = "active";
const tabWindowAttrNames = {
  scrollStep: "scroll-step",
  tabMode: "tab-mode",
  defaultTab: "default-tab"
};

class PageTabs extends HTMLElement {
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

  #normalizeId(id) {
    return id.startsWith("#") ? id.substring(1) : id;
  }

  getTab(id) {
    const normalizedId = this.#normalizeId(id);
    const header = this.querySelector(`.tab-list > .tab:has( a[href="#${ normalizedId }"] )`);
    const body = this.querySelector(`.tab-content > .tab-body#${ normalizedId }`);

    if (!body) {
      throw new TypeError(`Tab button [id: "${id}"] does not have an associated tab`);
    }

    return { header, body, id: normalizedId };
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

  // activeTab

  get activeTab() {
    return this.#activeTabId;
  }
  
  set activeTab(id) {
    const tab = this.getTab(id);
    
    this.#activeTabId = tab.id; // tab.id === normalizeId(id)

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

    { // collect tab IDs
      for (const tabHeader of this.tabHeaders) this.tabs.push(tabHeader.querySelector("a").hash);

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
      const defaultTabId = this.#normalizeId( this.defaultTab );

      if (!defaultTabId) {
        throw new TypeError(
          `<${elemName}> element must contain a data-default-tab attribute with a .tab-body's id. e.g. data-default-tab="tab-1"`
        );
      }

      const locationHash = this.#normalizeId(location.hash);
      const selectedTab = this.querySelector(`.tab-list > .tab:has( a[href="#${ locationHash }"] )`);

      if (selectedTab) { // If there is a selected tab (by the url #hash), select that tab's header thing
        this.activeTab = locationHash;
      } else { // and if there isn't, use the provided default
        this.activeTab = defaultTabId;
      }
    }

    { // handle other #hashes
      const hash = location.hash;

      if (hash) {
        // any tabs with a targeted element?
        const tab = this.querySelector(`.tab-content > .tab-body:has(${hash})`);

        if (tab) {
          this.activeTab = tab.id;
          document.querySelector(hash).scrollIntoView();
          this.getTab(tab.id).header.scrollIntoView();
        }
      }
    }

    // Main behaviour

    for (const tabHeader of this.tabHeaders) {
      tabHeader.ariaSelected ||= false;

      const tabHeaderAnchor = tabHeader.querySelector("a");
      const tabHeaderAnchorId = this.#normalizeId( tabHeaderAnchor.hash );

      tabHeaderAnchor.addEventListener("click", () => this.activeTab = tabHeaderAnchorId);
    }

    this.#timeoutId = null; // put at end!

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

    // space to cleanup event listeners, which I'm not going to do.
  }
}

customElements.define(elemName, PageTabs);
