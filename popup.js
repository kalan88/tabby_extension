const browserAPI = window.browser ?? {
    tabs: {
        query: (queryInfo) => new Promise((resolve) => chrome.tabs.query(queryInfo, resolve)),
        create: (createProperties) => chrome.tabs.create(createProperties)
    },
    storage: {
        local: {
            get: (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve)),
            set: (items) => new Promise((resolve) => chrome.storage.local.set(items, resolve))
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const saveBtn = document.getElementById("save");
    saveBtn.addEventListener("click", saveFunc);

    browserAPI.storage.local.get("tabGroups").then(result => {
        const tabGroups = result.tabGroups || {};
        for (const [groupName, tabs] of Object.entries(tabGroups)) {
            renderGroup(groupName, tabs);
        }
    });
});

async function getTabs() {
    return await browserAPI.tabs.query({});
}

async function saveFunc() {
    const Tabs = await getTabs();
    const groupName = document.getElementById("groupName").value.trim();

    if (!groupName) {
        alert("Please enter a group name.");
        return;
    }

    const validTabs = Tabs.filter(tab => tab.url.startsWith("http")).map(tab => ({
        title: tab.title,
        url: tab.url
    }));

    const result = await browserAPI.storage.local.get("tabGroups");
    const tabGroups = result.tabGroups || {};
    tabGroups[groupName] = validTabs;

    await browserAPI.storage.local.set({ tabGroups });
    renderGroup(groupName, validTabs);
}

function renderGroup(groupName, tabs) {
    const Parent = document.getElementById("allSaves");

    const dropdown = document.createElement("div");
    dropdown.classList.add("dropdown");

    const btn_container = document.createElement("div");
    btn_container.classList.add("btn-container");

    const dropbtn = document.createElement("button");
    dropbtn.classList.add("dropbtn");
    dropbtn.textContent = groupName;
    dropbtn.addEventListener("click", () => {
        tabs.forEach(tab => browserAPI.tabs.create({ url: tab.url }));
    });

    const delbtn = document.createElement("button");
    delbtn.classList.add("delbtn");
    delbtn.textContent = "Delete";
    delbtn.addEventListener("click", async () => {
        const result = await browserAPI.storage.local.get("tabGroups");
        const tabGroups = result.tabGroups || {};
        delete tabGroups[groupName];
        await browserAPI.storage.local.set({ tabGroups });
        dropdown.remove();
    });

    btn_container.appendChild(dropbtn);
    btn_container.appendChild(delbtn);
    dropdown.appendChild(btn_container);

    const content = document.createElement("div");
    content.classList.add("dropdown-content");

    tabs.forEach(tab => {
        const aLink = document.createElement("a");
        aLink.textContent = tab.title;
        aLink.href = tab.url;
        aLink.target = "_blank";
        content.appendChild(aLink);
    });

    dropdown.appendChild(content);
    Parent.appendChild(dropdown);
}
