import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import type { DefaultTheme } from "vitepress/theme";
import apiSidebar from "../site/api/typedoc-sidebar.json" with { type: "json" };
import appExtensionSidebar from "../site/app-extension/app-extension-sidebar.json" with { type: "json" };
import frAppExtensionSidebar from "../site/fr/app-extension/app-extension-sidebar.json" with { type: "json" };

const demoItem: DefaultTheme.SidebarItem & DefaultTheme.NavItem = {
    text: "Demo",
    link: "/demo/",
    target: "_self"
};

const apiDemoSidebar: DefaultTheme.Sidebar = [
    {
        text: "API",
        items: apiSidebar
    },
    demoItem
];

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfig({
    // https://vitejs.dev/config/
    vite: {
        build: {
            chunkSizeWarningLimit: 1024
        }
    },

    title: "AIDC Toolkit",
    description: "A comprehensive set of libraries for integrating Automatic Identification and Data Capture (AIDC) functionality into web-based applications",

    sitemap: {
        hostname: "https://aidc-toolkit.com",
        transformItems(items) {
            // Preview path is for development and testing only.
            return items.filter(item => !item.url.startsWith("preview/"));
        }
    },

    srcDir: "./site",

    head: [
        ["link", {
            rel: "icon",
            href: "/resource/icon-256.png"
        }]
    ],

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
                link: "/api/"
            },
            demoItem
        ],

        sidebar: {
            "/api/": apiDemoSidebar,
            "/demo/": apiDemoSidebar,
            "/app-extension/": appExtensionSidebar,
            "/fr/app-extension/": frAppExtensionSidebar
        },

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
