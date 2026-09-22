/* 
  Last updated: 22/09/2026

  Remember the tab_window.css file


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

const elemName = "tab-window";
const tabWindows = document.querySelectorAll(elemName);

const activeClass = "active";
const tabIdAttr = "data-tab-id";
const activeTabDataAttr = "activeTab";

function initTabs() {

  tabWindows.forEach(tabWindow => {
    
    const tabList = tabWindow.querySelector(".tab-list");
    const tabHeaders = tabWindow.querySelectorAll(".tab-list .tab");
    const tabBodies = tabWindow.querySelectorAll(".tab-content .tab-body");

    function getTab(tabId) {
      const header = tabWindow.querySelector(`.tab-list .tab[${tabIdAttr}="${tabId}"]`);
      const body = tabWindow.querySelector(`.tab-content .tab-body[${tabIdAttr}="${tabId}"]`);

      if (!body) {
        throw new TypeError(`Tab button [id: "${tabId}"] does not have an associated tab`);
      }

      return { header, body, id: tabId };
    }

    function setTab(tabId) {
      const tab = getTab(tabId);

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

      tabWindow.dataset[activeTabDataAttr] = tabId;
    }

    { // Basic a11y, set roles
      tabList.role = "tablist";
      tabHeaders.forEach(tabHeader => tabHeader.role = "tab");
      tabBodies.forEach(tabBody => tabBody.role = "tabpanel");
    }

    { // Set default tab
      const defaultTab = tabWindow.dataset.defaultTab;

      if (!defaultTab) {
        throw new TypeError(
          `<${elemName}> element must contain a data-default-tab attribute with a tabId. e.g. data-default-tab="1"`
        );
      }

      setTab(defaultTab);
    }

    { // Throw error if both .horizontal and .vertical class included
      const hrz = tabWindow.classList.contains("horizontal");
      const vrt =  tabWindow.classList.contains("vertical");

      if (hrz && vrt){
        throw new TypeError(
          `<${elemName}> can only contain .horizontal OR .vertical, but not both. Got: [${[ ...tabWindow.classList ]}]`
        );
      }
    }

    { // Horizontal scrolling for the tab bar
      if (tabWindow.classList.contains("horizontal")) {
        const scrollStep = Number(tabList.dataset.scrollStep) || 50;

        tabList.addEventListener("wheel", event => {
          event.preventDefault();
          tabList.scrollLeft += event.deltaY > 0 ? scrollStep : -scrollStep;
        });
      }
    }

    { // handle #hashes
      const hash = location.hash;

      if (hash) {
        // any tabs with a targeted element?
        const tab = tabWindow.querySelector(`.tab-content .tab-body:has(${hash})`);
        
        if (tab) {
          setTab(tab.dataset.tabId);
          document.querySelector(hash).scrollIntoView();
          getTab(tab.dataset.tabId).header.scrollIntoView();
        }
      }
    }

    // Main behaviour

    tabHeaders.forEach(tabHeader => {
      tabHeader.ariaSelected ||= false;

      tabHeader.querySelector("button").addEventListener("click", () => {
        const selectedTabId = tabHeader.dataset.tabId;
        
        setTab(selectedTabId);
      });
    });
    
  }); 
}

export default initTabs;
