/* eslint-disable no-console -- Console application. */

import {
    appExtensionNS,
    expandParameterDescriptor,
    type MethodDescriptor,
    Type
} from "@aidc-toolkit/app-extension";
import { Generator } from "@aidc-toolkit/app-generator";
import { I18nEnvironment } from "@aidc-toolkit/core";
import type { ParseKeys } from "i18next";
import fs from "node:fs";
import type { DefaultTheme } from "vitepress/theme";
import { docResources, i18nDocInit, i18nextDoc } from "./locale/i18n.ts";

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
    private static readonly LOCALES = Object.keys(docResources);

    private static readonly DEFAULT_LOCALE = DocumentationGenerator.LOCALES[0];

    private static readonly OUTPUT_PATH = "app-extension/";

    private readonly _namespaceFunctionNamesMap = new Map<string | undefined, string[]>();

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
    private static pathOf(relative: boolean, locale: string, namespace: string | undefined = undefined, fileName: string | undefined = undefined): string {
        return `${relative ? "site/" : "/"}${locale === DocumentationGenerator.DEFAULT_LOCALE ? "" : `${locale}/`}${DocumentationGenerator.OUTPUT_PATH}${namespace === undefined ? "" : `${namespace}/`}${fileName ?? ""}`;
    }

    /**
     * @inheritDoc
     */
    protected initialize(): void {
        for (const locale of DocumentationGenerator.LOCALES) {
            // Remove previously generated contents.
            fs.rmSync(DocumentationGenerator.pathOf(true, locale), {
                recursive: true,
                force: true
            });
        }
    }

    /**
     * @inheritDoc
     */
    protected createProxyObject(namespace: string | undefined, _className: string, _namespaceClassName: string, _objectName: string): void {
        let currentFunctionNames = this._namespaceFunctionNamesMap.get(namespace);

        if (currentFunctionNames === undefined) {
            currentFunctionNames = [];

            this._namespaceFunctionNamesMap.set(namespace, currentFunctionNames);

            // Create locale namespace directory if it doesn't exist.
            for (const locale of Object.keys(docResources)) {
                const localeNamespacePath = DocumentationGenerator.pathOf(true, locale, namespace);

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
    protected createProxyFunction(namespace: string | undefined, _className: string, _namespaceClassName: string, _objectName: string, functionName: string, _namespaceFunctionName: string, methodDescriptor: MethodDescriptor): void {
        console.log(namespace, _className, _namespaceClassName, _objectName, functionName, _namespaceFunctionName);

        this._currentFunctionNames.push(functionName);

        // Localize functions JSON file.
        for (const locale of Object.keys(docResources)) {
            const lngOption = {
                lng: locale
            };

            const appExtensionNSLngOption = {
                ns: appExtensionNS as typeof appExtensionNS,
                lng: locale
            };

            const functionLocalizedKeyPrefix = `Functions.${namespace === undefined ? "" : `${namespace}.`}${functionName}`;

            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Locale key exists.
            const functionLocalizedName = i18nextDoc.t(`${functionLocalizedKeyPrefix}.name` as ParseKeys<typeof appExtensionNS>, appExtensionNSLngOption);

            const f = fs.createWriteStream(DocumentationGenerator.pathOf(true, locale, namespace, `${functionLocalizedName}.md`));

            f.write("---\noutline: false\nnavbar: false\n---\n\n");

            f.write(`# ${namespace === undefined ? "" : `${namespace}.`}${functionLocalizedName}\n\n`);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Locale key exists.
            f.write(`${i18nextDoc.t(`${functionLocalizedKeyPrefix}.description` as ParseKeys<typeof appExtensionNS>, appExtensionNSLngOption)}\n`);

            if (methodDescriptor.parameterDescriptors.length !== 0) {
                f.write(`\n## ${i18nextDoc.t("Documentation.parameters", lngOption)}\n\n`);

                const nameTitle = i18nextDoc.t("Documentation.name", lngOption);
                const typeTitle = i18nextDoc.t("Documentation.type", lngOption);
                const descriptionTitle = i18nextDoc.t("Documentation.description", lngOption);

                const parametersDocumentation: ParameterDocumentation[] = methodDescriptor.parameterDescriptors.map((parameterDescriptor) => {
                    const expandedParameterDescriptor = expandParameterDescriptor(parameterDescriptor);

                    const parameterLocalizedKeyPrefix = `Parameters.${expandedParameterDescriptor.name}.`;

                    return {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Locale key exists.
                        name: i18nextDoc.t(`${parameterLocalizedKeyPrefix}name` as ParseKeys<typeof appExtensionNS>, appExtensionNSLngOption),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Locale key exists.
                        type: i18nextDoc.t(`Documentation.type${Type[expandedParameterDescriptor.type]}` as ParseKeys, lngOption),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Locale key exists.
                        description: i18nextDoc.t(`${parameterLocalizedKeyPrefix}description` as ParseKeys<typeof appExtensionNS>, appExtensionNSLngOption)
                    };
                });

                const maximumNameLength = Math.max(nameTitle.length, ...parametersDocumentation.map(parameterDocumentation => parameterDocumentation.name.length));
                const maximumTypeLength = Math.max(typeTitle.length, ...parametersDocumentation.map(parameterDocumentation => parameterDocumentation.type.length));
                const maximumDescriptionLength = Math.max(descriptionTitle.length, ...parametersDocumentation.map(parameterDocumentation => parameterDocumentation.description.length));

                f.write(`| ${nameTitle.padEnd(maximumNameLength)} | ${typeTitle.padEnd(maximumTypeLength)} | ${descriptionTitle.padEnd(maximumDescriptionLength)} |\n`);
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
            for (const locale of DocumentationGenerator.LOCALES) {
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
                            link: DocumentationGenerator.pathOf(false, locale, namespace, `${functionLocalizedName}.md`)
                        });
                    }
                }

                fs.writeFileSync(`${DocumentationGenerator.pathOf(true, locale)}app-extension-sidebar.json`, JSON.stringify(rootSidebarItems, null, 2));
            }
        }
    }
}

i18nDocInit(I18nEnvironment.CLI).then(async () => {
    await new DocumentationGenerator().generate();
}).catch((e: unknown) => {
    console.error(e);
});
