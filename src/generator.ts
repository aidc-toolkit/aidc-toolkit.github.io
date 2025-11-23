/* eslint-disable no-console -- Console application. */

import {
    Generator,
    type Localization,
    type ProxyFunctionDescriptor,
    type ProxyObjectDescriptor
} from "@aidc-toolkit/app-generator";
import { I18nEnvironment } from "@aidc-toolkit/core";
import type { ParseKeys } from "i18next";
import fs from "node:fs";
import type { DefaultTheme } from "vitepress/theme";
import { type DocLocaleStrings, docResources, i18nDocInit, i18nextDoc } from "./locale/i18n.ts";

/**
 * Documentation as structured in locale strings.
 */
type Documentation = DocLocaleStrings["Documentation"];

/**
 * Documentation resource.
 */
interface DocumentationResource extends Documentation {
    /**
     * Locale.
     */
    locale: string;
}

/**
 * Parameter documentation.
 */
interface ParameterDocumentation {
    /**
     * Name.
     */
    name: string;

    /**
     * Type.
     */
    type: string;

    /**
     * Description.
     */
    description: string;
}

/**
 * Generator for documentation.
 */
class DocumentationGenerator extends Generator {
    /**
     * Output path.
     */
    private static readonly OUTPUT_PATH = "app-extension/";

    /**
     * Dummy object for missing localization; should never be required.
     */
    private static readonly MISSING_LOCALIZATION: Localization = {
        name: "*** MISSING LOCALIZATION ***",
        description: "** MISSING LOCALIZATION ***"
    };

    /**
     * Documentation resources.
     */
    private readonly _documentationResources: DocumentationResource[] = [];

    /**
     * Function names mapped by namespace.
     */
    private readonly _namespaceFunctionNamesMap = new Map<string | undefined, string[]>();

    /**
     * Current function names reference while building function names mapped by namespace.
     * @private
     */
    private _currentFunctionNames!: string[];

    /**
     * Get the path of a locale, optional namespace, and optional file name.
     *
     * @param relative
     * If true, path is relative. Absolute is for web path generation.
     *
     * @param locale
     * Locale. If the default, ignored in the construction of the path.
     *
     * @param namespace
     * Namespace. If undefined, ignored in the construction of the path.
     *
     * @param fileName
     * File name. If undefined, ignored in the construction of the path.
     *
     * @returns
     * Path.
     */
    private pathOf(relative: boolean, locale: string, namespace: string | undefined = undefined, fileName: string | undefined = undefined): string {
        return `${relative ? "site/" : "/"}${locale === this.defaultLocale ? "" : `${locale}/`}${DocumentationGenerator.OUTPUT_PATH}${namespace === undefined ? "" : `${namespace}/`}${fileName ?? ""}`;
    }

    /**
     * @inheritDoc
     */
    protected initialize(): void {
        for (const locale of this.locales) {
            this._documentationResources.push({
                locale,
                ...i18nextDoc.t("Documentation", {
                    lng: locale,
                    returnObjects: true
                })
            });

            // Remove previously generated contents.
            fs.rmSync(this.pathOf(true, locale), {
                recursive: true,
                force: true
            });
        }
    }

    /**
     * @inheritDoc
     */
    protected createProxyObject(proxyObjectDescriptor: ProxyObjectDescriptor): void {
        const namespace = proxyObjectDescriptor.namespace;

        let currentFunctionNames = this._namespaceFunctionNamesMap.get(namespace);

        if (currentFunctionNames === undefined) {
            currentFunctionNames = [];

            this._namespaceFunctionNamesMap.set(namespace, currentFunctionNames);

            // Create locale namespace directory if it doesn't exist.
            for (const locale of Object.keys(docResources)) {
                const localeNamespacePath = this.pathOf(true, locale, namespace);

                fs.mkdirSync(localeNamespacePath, {
                    recursive: true
                });
            }
        }

        this._currentFunctionNames = currentFunctionNames;
    }

    /**
     * @inheritDoc
     */
    protected createProxyFunction(proxyFunctionDescriptor: ProxyFunctionDescriptor): void {
        const {
            namespace,
            functionName,
            proxyParameterDescriptors
        } = proxyFunctionDescriptor;

        this._currentFunctionNames.push(functionName);

        // Localize functions JSON file.
        for (const documentationResource of this._documentationResources) {
            const locale = documentationResource.locale;

            const functionLocalization = proxyFunctionDescriptor.localizationsMap.get(locale) ?? DocumentationGenerator.MISSING_LOCALIZATION;

            const f = fs.createWriteStream(this.pathOf(true, locale, namespace, `${functionLocalization.name}.md`));

            f.write("---\noutline: false\nnavbar: false\n---\n\n");

            f.write(`# ${namespace === undefined ? "" : `${namespace}.`}${functionLocalization.name}\n\n`);

            f.write(`${functionLocalization.description}\n`);

            if (proxyParameterDescriptors.length !== 0) {
                f.write(`\n## ${documentationResource.parameters}\n\n`);

                const parametersDocumentation: ParameterDocumentation[] = proxyParameterDescriptors.map((proxyParameterDescriptor) => {
                    const parameterLocalization = proxyParameterDescriptor.localizationsMap.get(locale) ?? DocumentationGenerator.MISSING_LOCALIZATION;

                    return {
                        ...parameterLocalization,
                        type: documentationResource.types[proxyParameterDescriptor.parameterDescriptor.type]
                    };
                });

                const maximumNameLength = Math.max(documentationResource.name.length, ...parametersDocumentation.map(parameterDocumentation => parameterDocumentation.name.length));
                const maximumTypeLength = Math.max(documentationResource.type.length, ...parametersDocumentation.map(parameterDocumentation => parameterDocumentation.type.length));
                const maximumDescriptionLength = Math.max(documentationResource.description.length, ...parametersDocumentation.map(parameterDocumentation => parameterDocumentation.description.length));

                f.write(`| ${documentationResource.name.padEnd(maximumNameLength)} | ${documentationResource.type.padEnd(maximumTypeLength)} | ${documentationResource.description.padEnd(maximumDescriptionLength)} |\n`);
                f.write(`|-${"".padEnd(maximumNameLength, "-")}-|-${"".padEnd(maximumTypeLength, "-")}-|-${"".padEnd(maximumDescriptionLength, "-")}-|\n`);

                for (const parameterDocumentation of parametersDocumentation) {
                    f.write(`| ${parameterDocumentation.name.padEnd(maximumNameLength)} | ${parameterDocumentation.type.padEnd(maximumTypeLength)} | ${parameterDocumentation.description.padEnd(maximumDescriptionLength)} |\n`);
                }
            }

            f.end();
        }
    }

    /**
     * @inheritDoc
     */
    protected finalize(success: boolean): void {
        if (success) {
            for (const locale of this.locales) {
                const lngOption = {
                    lng: locale
                };

                const rootSidebarItems: DefaultTheme.SidebarItem[] = [];

                for (const [namespace, functionNames] of this._namespaceFunctionNamesMap.entries()) {
                    let currentSidebarItems: DefaultTheme.SidebarItem[];

                    if (namespace === undefined) {
                        currentSidebarItems = rootSidebarItems;
                    } else {
                        currentSidebarItems = [];

                        rootSidebarItems.push({
                            text: namespace,
                            collapsed: true,
                            items: currentSidebarItems
                        });
                    }

                    for (const functionName of functionNames) {
                        const functionLocalizedKeyPrefix = `Functions.${namespace === undefined ? "" : `${namespace}.`}${functionName}`;

                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Locale key exists.
                        const functionLocalizedName = i18nextDoc.t(`${functionLocalizedKeyPrefix}.name` as ParseKeys, lngOption);

                        currentSidebarItems.push({
                            text: functionLocalizedName,
                            link: this.pathOf(false, locale, namespace, `${functionLocalizedName}.md`)
                        });
                    }
                }

                fs.writeFileSync(`${this.pathOf(true, locale)}app-extension-sidebar.json`, JSON.stringify(rootSidebarItems, null, 2));
            }
        }
    }
}

i18nDocInit(I18nEnvironment.CLI).then(async () => {
    await new DocumentationGenerator().generate();
}).catch((e: unknown) => {
    console.error(e);
    process.exit(1);
});
