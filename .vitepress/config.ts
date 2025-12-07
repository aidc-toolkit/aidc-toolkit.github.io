import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import type { DefaultTheme } from "vitepress/theme";
import apiSidebar from "../site/api/typedoc-sidebar.json" with { type: "json" };

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
    title: "AIDC Toolkit",
    description: "A comprehensive set of libraries for integrating Automatic Identification and Data Capture (AIDC) functionality into web-based applications",

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
            "/demo/": apiDemoSidebar
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
