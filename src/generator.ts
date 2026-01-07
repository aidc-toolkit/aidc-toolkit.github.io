/* eslint-disable no-console -- Console application. */

import {
    type ClassDescriptor,
    type FunctionLocalization,
    Generator,
    type Localization,
    type MethodDescriptor
} from "@aidc-toolkit/app-extension";
import { I18nEnvironments } from "@aidc-toolkit/core";
import fs from "node:fs";
import type { DefaultTheme } from "vitepress/theme";
import { type DocLocaleResources, docResources, i18nDocInit, i18nextDoc } from "./locale/i18n.js";

/**
 * Documentation as structured in locale strings.
 */
type Documentation = DocLocaleResources["Documentation"];

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
    static readonly #OUTPUT_PATH = "app-extension/";

    /**
     * Dummy object for missing localization; should never be required.
     */
    static readonly #MISSING_LOCALIZATION: Localization = {
        name: "*** MISSING LOCALIZATION ***",
        description: "** MISSING LOCALIZATION ***"
    };

    /**
     * Dummy object for missing function localization; should never be required.
     */
    static readonly #MISSING_FUNCTION_LOCALIZATION: FunctionLocalization = {
        ...DocumentationGenerator.#MISSING_LOCALIZATION,
        documentationURL: "*** MISSING LOCALIZATION ***",
        parametersMap: new Map()
    };

    /**
     * Documentation resources.
     */
    readonly #documentationResources: DocumentationResource[] = [];

    /**
     * Function names mapped by namespace.
     */
    readonly #namespaceFunctionNamesMap = new Map<string | undefined, string[]>();

    /**
     * Current function names reference while building function names mapped by namespace.
     */
    #currentFunctionNames!: string[];

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
    // eslint-disable-next-line @typescript-eslint/no-useless-default-assignment -- Undefined is necessary to allow bypass of namespace.
    #pathOf(relative: boolean, locale: string, namespace: string | undefined = undefined, fileName?: string): string {
        return `${relative ? "site/" : "/"}${locale === this.defaultLocale ? "" : `${locale}/`}${DocumentationGenerator.#OUTPUT_PATH}${namespace === undefined ? "" : `${namespace}/`}${fileName ?? ""}`;
    }

    /**
     * @inheritDoc
     */
    protected initialize(): void {
        for (const locale of this.locales) {
            this.#documentationResources.push({
                locale,
                ...i18nextDoc.t("Documentation", {
                    lng: locale,
                    returnObjects: true
                })
            });

            // Remove previously generated contents.
            fs.rmSync(this.#pathOf(true, locale), {
                recursive: true,
                force: true
            });
        }
    }

    /**
     * @inheritDoc
     */
    protected createProxyObject(classDescriptor: ClassDescriptor): void {
        const namespace = classDescriptor.namespace;

        let currentFunctionNames = this.#namespaceFunctionNamesMap.get(namespace);

        if (currentFunctionNames === undefined) {
            currentFunctionNames = [];

            this.#namespaceFunctionNamesMap.set(namespace, currentFunctionNames);

            // Create locale namespace directory if it doesn't exist.
            for (const locale of Object.keys(docResources)) {
                const localeNamespacePath = this.#pathOf(true, locale, namespace);

                fs.mkdirSync(localeNamespacePath, {
                    recursive: true
                });
            }
        }

        this.#currentFunctionNames = currentFunctionNames;
    }

    /**
     * @inheritDoc
     */
    protected createProxyFunction(classDescriptor: ClassDescriptor, methodDescriptor: MethodDescriptor, functionLocalizationsMap: ReadonlyMap<string, FunctionLocalization>): void {
        const namespace = classDescriptor.namespace;
        const functionName = methodDescriptor.functionName;

        this.#currentFunctionNames.push(functionName);

        // Localize functions JSON file.
        for (const documentationResource of this.#documentationResources) {
            const locale = documentationResource.locale;

            const functionLocalization = functionLocalizationsMap.get(locale) ?? DocumentationGenerator.#MISSING_FUNCTION_LOCALIZATION;

            const f = fs.createWriteStream(this.#pathOf(true, locale, namespace, `${functionLocalization.name}.md`));

            f.write("---\noutline: false\nnavbar: false\n---\n\n");

            f.write(`# ${namespace === undefined ? "" : `${namespace}.`}${functionLocalization.name}\n\n`);

            f.write(`${functionLocalization.description}\n`);

            if (methodDescriptor.parameterDescriptors.length !== 0) {
                f.write(`\n## ${documentationResource.parameters}\n\n`);

                const parametersDocumentation: ParameterDocumentation[] = methodDescriptor.parameterDescriptors.map((parameterDescriptor) => {
                    const parameterLocalization = functionLocalization.parametersMap.get(parameterDescriptor.name) ?? DocumentationGenerator.#MISSING_LOCALIZATION;

                    return {
                        ...parameterLocalization,
                        type: documentationResource.types[parameterDescriptor.type]
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
                const rootSidebarItems: DefaultTheme.SidebarItem[] = [];

                for (const [namespace, functionNames] of this.#namespaceFunctionNamesMap.entries()) {
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
                        const functionLocalizedName = this.getFunctionLocalization(locale, `${namespace === undefined ? "" : `${namespace}.`}${functionName}`).name;

                        currentSidebarItems.push({
                            text: functionLocalizedName,
                            link: this.#pathOf(false, locale, namespace, `${functionLocalizedName}.md`)
                        });
                    }
                }

                fs.writeFileSync(`${this.#pathOf(true, locale)}app-extension-sidebar.json`, JSON.stringify(rootSidebarItems, null, 2));
            }
        }
    }
}

i18nDocInit(I18nEnvironments.CLI).then(async () =>
    new DocumentationGenerator().generate()
).catch((e: unknown) => {
    console.error(e);
    process.exit(1);
});
