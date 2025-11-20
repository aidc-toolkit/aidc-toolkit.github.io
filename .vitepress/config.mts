import { defineConfig } from "vitepress";
import type { DefaultTheme } from "vitepress/theme";
import apiSidebar from "../site/api/typedoc-sidebar.json";

const apiDemoSidebar: DefaultTheme.Sidebar = [
    {
        text: "API",
        items: apiSidebar
    },
    {
        text: "Demo",
        link: "/demo"
    }
];

// https://vitepress.dev/reference/site-config
export default defineConfig({
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
                text: "Demo",
                link: "/demo/"
            },
            {
                text: "API",
                link: "/api/"
            }
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
});
