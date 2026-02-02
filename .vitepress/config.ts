import { ALPHA_URL, parseVersion, websiteURL } from "@aidc-toolkit/core";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import type { DefaultTheme } from "vitepress/theme";
import apiSidebar from "../site/api/typedoc-sidebar.json" with { type: "json" };
import appExtensionSidebar from "../site/app-extension/app-extension-sidebar.json" with { type: "json" };
import frAppExtensionSidebar from "../site/fr/app-extension/app-extension-sidebar.json" with { type: "json" };
import { VERSION } from "../src/version.js";

const parsedVersion = parseVersion(VERSION);
const productionPath = parsedVersion.preReleaseIdentifier === undefined ? `/v${parsedVersion.majorVersion}.${parsedVersion.minorVersion}` : "";

/**
 * Rewrites sidebar to include the prepended path.
 *
 * @param sidebar
 * Sidebar to rewrite.
 *
 * @returns
 * Rewritten sidebar.
 */
function rewriteSidebar<TSidebar extends DefaultTheme.Sidebar>(sidebar: TSidebar): TSidebar extends DefaultTheme.SidebarItem[] ? DefaultTheme.SidebarItem[] : DefaultTheme.SidebarMulti {
    let rewrittenSidebar: DefaultTheme.Sidebar;

    if (productionPath !== "") {
        if (Array.isArray(sidebar)) {
            rewrittenSidebar = sidebar.map((sidebarItem) => {
                const rewrittenSidebarItem = {
                    ...sidebarItem
                };

                if (sidebarItem.link !== undefined) {
                    rewrittenSidebarItem.link = `${productionPath}${sidebarItem.link}`;
                }

                if (sidebarItem.items !== undefined) {
                    rewrittenSidebarItem.items = rewriteSidebar(sidebarItem.items);
                }

                return rewrittenSidebarItem;
            });
        } else {
            rewrittenSidebar = Object.fromEntries(Object.entries(sidebar).map(([key, multiEntry]) =>
                [key, Array.isArray(multiEntry) ?
                    rewriteSidebar(multiEntry) :
                    {
                        base: `${productionPath}${multiEntry.base}`,
                        items: multiEntry.items
                    }]
            ));
        }
    } else {
        rewrittenSidebar = sidebar;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type is determined above.
    return rewrittenSidebar as TSidebar extends DefaultTheme.SidebarItem[] ? DefaultTheme.SidebarItem[] : DefaultTheme.SidebarMulti;
}

// Sitemap hostname must include trailing '/'.
const sitemapHostname = `${websiteURL(VERSION, false, await ALPHA_URL)}/`;

// Extract base from sitemap hostname.
const base = sitemapHostname.substring(sitemapHostname.indexOf("/", sitemapHostname.indexOf("://") + 3));

// Output directory is based on base.
const outDir = `.vitepress/dist${base}`;

const demoItem: DefaultTheme.SidebarItem & DefaultTheme.NavItem = {
    text: "Demo",
    link: "/demo/",
    target: "_self"
};

const apiDemoSidebar: DefaultTheme.Sidebar = [
    {
        text: "API",
        items: rewriteSidebar(apiSidebar)
    },
    demoItem
];

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfig({
    // https://vitejs.dev/config/
    vite: {
        plugins: [
            viteStaticCopy({
                targets: [
                    {
                        src: "../../core/resource/icon-256.png",
                        dest: "resource"
                    },
                    {
                        src: "../../core/resource/icon-256.png",
                        dest: `${productionPath}/resource`.substring(1)
                    },
                    {
                        src: "../../demo/dist/**/*",
                        dest: "demo"
                    },
                    {
                        src: "../../microsoft-add-in/dist/**/*",
                        dest: `${productionPath}/microsoft-add-in`.substring(1)
                    }
                ]
            })
        ],

        build: {
            chunkSizeWarningLimit: 1024
        }
    },

    title: "AIDC Toolkit",
    description: "A comprehensive set of libraries for integrating Automatic Identification and Data Capture (AIDC) functionality into web-based applications",

    base,
    outDir,

    sitemap: {
        hostname: sitemapHostname
    },

    srcDir: "./site",

    head: [
        ["link", {
            rel: "icon",
            href: "/resource/icon-256.png"
        }]
    ],

    rewrites: {
        "api/:slug*": `${productionPath}/api/:slug*`.substring(1),
        "app-extension/:slug*": `${productionPath}/app-extension/:slug*`.substring(1),
        "fr/app-extension/:slug*": `${productionPath}/fr/app-extension/:slug*`.substring(1)
    },

    // https://vitepress.dev/reference/default-theme-config
    themeConfig: {
        logo: "/resource/icon-256.png",

        nav: [
            {
                text: "Home",
                link: "/"
            },
            {
                text: "API",
                link: `${productionPath}/api/`
            },
            demoItem
        ],

        sidebar: Object.fromEntries([
            [`${productionPath}/api/`, apiDemoSidebar],
            ["demo", apiDemoSidebar],
            [`${productionPath}/app-extension/`, rewriteSidebar(appExtensionSidebar)],
            [`${productionPath}/fr/app-extension/`, rewriteSidebar(frAppExtensionSidebar)]
        ]),

        socialLinks: [
            {
                icon: "github",
                link: "https://github.com/aidc-toolkit"
            }
        ],

        docFooter: {
            prev: false,
            next: false
        }
    }

    // locales: {
    //     root: {
    //         label: "English",
    //         lang: "en"
    //     },
    //     fr: {
    //         label: "Français",
    //         lang: "fr"
    //     }
    // }
}));
