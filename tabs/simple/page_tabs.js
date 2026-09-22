/* 
  Last updated: 22/09/2026

  Remember the page_tabs.css file

  Mostly a clone of tab_window.js but a bit simpler.
  This one allows you to link tabs like: "www.example.com/home#tab-5".

  you can change the active tab like this:

    const myPageTabs = document.querySelector("page-tabs#my-page-tabs");
    myPageTabs.activeTab = "tab-2";

    ⚠️ NOTE: this WON'T set the #hash in the URL. Set it using location.hash = "#..." ⚠️


  Format:

    <page-tabs data-default-tab="TAB_ID" class="(horizontal | vertical) +reverse">

      <ol class="tab-list" data-scroll-step="50 (OPTIONAL)">

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

class PageTabs extends HTMLElement {
  // I'm completely new to this (web components). can probably be improved

  constructor() {
    super();
  }

  #initialized = false;
  #timeoutId = null;
  #activeTabId = null;

  tabList = null; tabHeaders = null; tabBodies = null;

  #normalizeId(id) {
    return id.startsWith("#") ? id.substring(1) : id;
  }

  getTab(id) {
    const normalizedId = this.#normalizeId(id);
    const header = this.querySelector(`.tab-list .tab:has( a[href="#${ normalizedId }"] )`);
    const body = this.querySelector(`.tab-content .tab-body#${ normalizedId }`);

    if (!body) {
      throw new TypeError(`Tab button [id: "${id}"] does not have an associated tab`);
    }

    return { header, body, id: normalizedId };
  }

  get activeTab() {
    return this.#activeTabId;
  }
  
  set activeTab(id) {
    const tab = this.getTab(id);
    this.#activeTabId = tab.id; // tab.id === normalizeId(id)

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
      const defaultTabId = this.#normalizeId( this.dataset.defaultTab );

      if (!defaultTabId) {
        throw new TypeError(
          `<${elemName}> element must contain a data-default-tab attribute with a .tab-body's id. e.g. data-default-tab="tab-1"`
        );
      }

      const locationHash = this.#normalizeId(location.hash);
      const selectedTab = this.querySelector(`.tab-list .tab:has( a[href="#${ locationHash }"] )`);

      if (selectedTab) { // If there is a selected tab (by the url #hash), select that tab's header thing
        this.activeTab = locationHash;
      } else { // and if there isn't, use the provided default
        this.activeTab = defaultTabId;
      }
    }

    { // Throw error if both .horizontal and .vertical class included
      const hrz = this.classList.contains("horizontal");
      const vrt =  this.classList.contains("vertical");

      if (hrz && vrt){
        throw new TypeError(
          `<${elemName}> can only contain .horizontal OR .vertical, but not both. Got: [${[ ...pageTab.classList ]}]`
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

    { // handle other #hashes
      const hash = location.hash;

      if (hash) {
        // any tabs with a targeted element?
        const tab = this.querySelector(`.tab-content .tab-body:has(${hash})`);

        if (tab) {
          this.activeTab = tab.id;
          document.querySelector(hash).scrollIntoView();
          this.getTab(tab.id).header.scrollIntoView();
        }
      }
    }

    // Main behaviour

    this.tabHeaders.forEach(tabHeader => {
      tabHeader.ariaSelected ||= false;

      const tabHeaderAnchor = tabHeader.querySelector("a");
      const tabHeaderAnchorId = this.#normalizeId( tabHeaderAnchor.hash );

      tabHeaderAnchor.addEventListener("click", () => this.activeTab = tabHeaderAnchorId);
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

customElements.define(elemName, PageTabs);
