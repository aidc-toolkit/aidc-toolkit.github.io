---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "AIDC Toolkit"
  tagline: "A comprehensive set of libraries for integrating Automatic Identification and Data Capture (AIDC) functionality into web-based applications"
  image:
    src: "resource/icon-512.png"
    alt: "AIDC Toolkit"
---

# Overview

> [!WARNING]
> 
> **This software is in beta**, with production release is scheduled for 2025Q4. To follow the status of this and other projects, go to the AIDC Toolkit [projects](https://github.com/orgs/aidc-toolkit/projects) page.

The AIDC Toolkit is a comprehensive set of libraries for integrating Automatic Identification and Data Capture (AIDC) functionality into web-based applications. The libraries are published as [npm packages](https://www.npmjs.com/search?q=%40aidc-toolkit) and full source code is available on [GitHub](https://github.com/aidc-toolkit).

> [!TIP]
> 
> Skip the boring stuff! Go straight to the [demo](demo/){target="_self"} or the [API documentation](api/).

## Roadmap

| Release | Date   | Features                                                                                                     |
|---------|--------|--------------------------------------------------------------------------------------------------------------| 
| 1.0.0   | 2025Q4 | * Utility library<br>* GS1 library<br>* Full-featured demo application<br>* English and French localization  |
| 1.1.0   | 2026Q1 | * Microsoft Excel add-in integration<br>* Google Sheets add-on integration                                   |
| 1.2.0   | 2026Q1 | * GS1 element string generation and parsing<br>* GS1 Digital Link generation and parsing                     |
| 2.0.0   | 2026Q2 | Top secret (but it's going to be big)                                                                        |

## Packages

The AIDC Toolkit is broken up into a number of packages, each of which builds on the ones that come before. It's not necessary to have a full understanding of all packages in order to use develop code using the AIDC Toolkit, and where critical "must know" information is presented, it's called out.

### [dev](https://github.com/aidc-toolkit/dev)

Shared development artefacts. If you're not developing or maintaining the AIDC Toolkit, this package may be ignored.

### [core](api/Core/)

Core functionality. Specifically, this package is responsible for internationalization and simplifies the use of [i18next](https://www.i18next.com) across multiple packages and applications. Applications that don't use internationalization or that have their own internationalization framework may ignore this package, but are still required to initialize internationalization via the packages they use.

### [utility](api/Utility/)

Foundational utilities. This package provides classes to manipulate integers and strings, independently of any AIDC problem domain.

### [gs1](api/GS1/)

GS1 AIDC Toolkit. This package is essentially an implementation of the identification portions of the [GS1 General Specifications](https://www.gs1.org/genspecs) A working knowledge of the GS1 identification system is necessary to use this package.
