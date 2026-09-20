/* 
  Last updated: 20/09/2026

  Mostly a clone of tab_window.js but a bit simpler.
  This one allows you to link tabs like: "www.example.com/home#tab-5".


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

const elemName = "page-tabs";
const pageTabs = document.querySelectorAll(elemName);

const activeClass = "active";
const activeTabDataAttr = "activeTab";

function initTabs() {
  
  pageTabs.forEach(pageTab => {
    
    const tabList = pageTab.querySelector(".tab-list");
    const tabHeaders = pageTab.querySelectorAll(".tab-list .tab");
    const tabBodies = pageTab.querySelectorAll(".tab-content .tab-body");

    function normalizeId(id) {
      return id.startsWith("#") ? id.substring(1) : id;
    }

    function getTab(id) {
      const normalizedId = normalizeId(id);
      const header = pageTab.querySelector(`.tab-list .tab:has( a[href="#${ normalizedId }"] )`);
      const body = pageTab.querySelector(`.tab-content .tab-body#${ normalizedId }`);

      return { header, body, id: normalizedId };
    }

    function setTab(id) {
      const tab = getTab(id);

      // Remove .active from all .tab & .tab-body
      tabHeaders.forEach(tabHeader => {
        tabHeader.ariaSelected = false;
        tabHeader.classList.remove(activeClass);
      });

      tabBodies.forEach(tabBody => tabBody.classList.remove(activeClass));

      // Add .active to selected .tab & .tab-body
      tab.header.classList.add(activeClass);
      tab.header.ariaSelected = true;
      tab.body.classList.add(activeClass);

      pageTab.dataset[activeTabDataAttr] = tab.id; // tab.id === normalizeId(id)
    }

    { // Basic a11y, set roles
      tabList.role = "tablist";
      tabHeaders.forEach(tabHeader => tabHeader.role = "tab");
      tabBodies.forEach(tabBody => tabBody.role = "tabpanel");
    }

    { // Set default tab
      const defaultTabId = normalizeId(pageTab.dataset.defaultTab);

      if (!defaultTabId) {
        throw new TypeError(
          `<${elemName}> element must contain a data-default-tab attribute with a .tab-body's id. e.g. data-default-tab="tab-1"`
        );
      }

      const locationHash = normalizeId(location.hash);
      const selectedTab = pageTab.querySelector(`.tab-list .tab:has( a[href="#${ locationHash }"] )`);

      if (selectedTab) { // If there is a selected tab (by the url #hash), select that tab's header thing
        setTab(locationHash)
      } else { // and if there isn't, use the provided default
        setTab(defaultTabId);
      }
    }

    { // Throw error if both .horizontal and .vertical class included
      const hrz = pageTab.classList.contains("horizontal");
      const vrt =  pageTab.classList.contains("vertical");

      if (hrz && vrt){
        throw new TypeError(
          `<${elemName}> can only contain .horizontal OR .vertical, but not both. Got: [${[ ...pageTab.classList ]}]`
        );
      }
    }

    { // Horizontal scrolling for the tab bar
      if (pageTab.classList.contains("horizontal")) {
        const scrollStep = Number(tabList.dataset.scrollStep) || 50;

        tabList.addEventListener("wheel", event => {
          event.preventDefault();
          tabList.scrollLeft += event.deltaY > 0 ? scrollStep : -scrollStep;
        });
      }
    }

    { // handle other #hashes
      const hash = location.hash;

      if (hash) {
        const tab = pageTab.querySelector(`.tab-content .tab-body:has(${hash})`);

        if (tab) {
          setTab(tab.id);
          document.querySelector(hash).scrollIntoView();
          getTab(tab.id).header.scrollIntoView();
        }
      }
    }

    // Main behaviour

    tabHeaders.forEach(tabHeader => {
      tabHeader.ariaSelected ||= false;

      const tabHeaderAnchor = tabHeader.querySelector("a");
      const tabHeaderAnchorId = normalizeId( tabHeaderAnchor.hash );

      tabHeaderAnchor.addEventListener("click", () => setTab(tabHeaderAnchorId));
    });

  });

}

export default initTabs;
