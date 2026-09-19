/* 
  Last updated: 18/09/2026


  Format:

    <tab-window data-default-tab="TAB_ID" class="(horizontal | vertical) +reverse">

      <ol class="tab-list" data-scroll-step="50 (OPTIONAL)"> (e.g. class="vertical reverse", class="horizontal")

        <li class="tab" data-tab-id="TAB_ID">
          <button>
            <img src="ICON" class="tab-icon"> (OPTIONAL)
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

const tabWindows = document.querySelectorAll("tab-window");

const activeClass = "active";
const tabIdAttr = "data-tab-id";

function initTabs() {

  tabWindows.forEach(tabWindow => {
    
    const tabList = tabWindow.querySelector(".tab-list");
    const tabHeaders = tabWindow.querySelectorAll(".tab-list .tab");
    const tabBodies = tabWindow.querySelectorAll(".tab-content .tab-body");

    { // Basic a11y, set roles
      tabList.role = "tablist";
      tabHeaders.forEach(tabHeader => tabHeader.role = "tab");
      tabBodies.forEach(tabBody => tabBody.role = "tabpanel");
    }

    { // Set default tab
      const defaultTab = tabWindow.dataset.defaultTab;

      if (!defaultTab) {
        throw new TypeError(
          `<tab-window> element must contain a data-default-tab attribute with a tabId. e.g. data-default-tab="1"`
        );
      }

      const defaultTabHeader = tabWindow.querySelector(`.tab-list .tab[${tabIdAttr}="${defaultTab}"]`);
      const defaultTabBody = tabWindow.querySelector(`.tab-content .tab-body[${tabIdAttr}="${defaultTab}"]`);
        
      defaultTabHeader.classList.add(activeClass);
      defaultTabHeader.ariaSelected = true;
      defaultTabBody.classList.add(activeClass);
    }

    { // Throw error if both .horizontal and .vertical class included
      const hrz = tabWindow.classList.contains("horizontal");
      const vrt =  tabWindow.classList.contains("vertical");

      if (hrz && vrt){
        throw new TypeError(
          `<tab-window> can only contain .horizontal OR .vertical, but not both. Got: [${[ ...tabWindow.classList ]}]`
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

    // Main behaviour

    tabHeaders.forEach(tabHeader => {
      tabHeader.ariaSelected ||= false;

      tabHeader.querySelector("button").addEventListener("click", () => {
        const selectedTabName = tabHeader.dataset.tabId;
        const associatedTab = tabWindow.querySelector(`.tab-content .tab-body[${tabIdAttr}="${selectedTabName}"]`);

        // Remove .active from all .tab & .tab-body
        tabHeaders.forEach(tabHeader => {
          tabHeader.ariaSelected = false;
          tabHeader.classList.remove(activeClass);
        });

        tabBodies.forEach(tabBody => tabBody.classList.remove(activeClass));

        // Add .active to selected .tab & .tab-body
        tabHeader.classList.add(activeClass);
        tabHeader.ariaSelected = true;
        associatedTab.classList.add(activeClass);
      });
    });
    
  }); 
}

export default initTabs;
