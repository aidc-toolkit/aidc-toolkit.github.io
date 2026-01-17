import {
    type ClassDescriptor,
    type FunctionLocalization,
    Generator,
    type MethodDescriptor,
    Multiplicities
} from "@aidc-toolkit/app-extension";
import { I18nEnvironments } from "@aidc-toolkit/core";
import fs from "node:fs";
import type { DefaultTheme } from "vitepress/theme";
import { type DocLocaleResources, i18nDocInit, i18nextDoc } from "./locale/i18n.js";

/**
 * Function node.
 */
interface FunctionNode {
    /**
     * Function localizations map, keyed on locale.
     */
    readonly functionLocalizationsMap: ReadonlyMap<string, FunctionLocalization>;
}

/**
 * Category node.
 */
interface CategoryNode {
    /**
     * Category localizations map, keyed on locale.
     */
    readonly categoryLocalizationsMap: ReadonlyMap<string, string>;

    /**
     * Function nodes.
     */
    readonly functionNodes: FunctionNode[];
}

/**
 * Namespace node.
 */
interface NamespaceNode {
    /**
     * Namespace.
     */
    readonly namespace: string | undefined;

    /**
     * Category nodes.
     */
    readonly categoryNodes: CategoryNode[];
}

/**
 * Documentation as structured in locale resources.
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
     * Documentation resources.
     */
    readonly #documentationResources: DocumentationResource[] = [];

    /**
     * Namespace nodes.
     */
    readonly #namespaceNodes: NamespaceNode[] = [];

    /**
     * Current namespace node.
     */
    #currentNamespaceNode!: NamespaceNode;

    /**
     * Current category node.
     */
    #currentCategoryNode!: CategoryNode;

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
    protected override initialize(): void {
        for (const locale of this.locales) {
            this.#documentationResources.push({
                locale,
                ...i18nextDoc.t("Documentation", {
                    lng: locale,
                    returnObjects: true
                })
            });

            const rootPath = this.#pathOf(true, locale);

            // Remove previously generated contents.
            fs.rmSync(rootPath, {
                recursive: true,
                force: true
            });

            // Recreate directory.
            fs.mkdirSync(rootPath, {
                recursive: true
            });
        }
    }

    /**
     * @inheritDoc
     */
    protected override createNamespace(namespace: string | undefined): void {
        this.#currentNamespaceNode = {
            namespace,
            categoryNodes: []
        };

        this.#namespaceNodes.push(this.#currentNamespaceNode);

        // Create locale namespace directories.
        for (const locale of this.locales) {
            fs.mkdirSync(this.#pathOf(true, locale, namespace), {
                recursive: true
            });

            const f = fs.createWriteStream(this.#pathOf(true, locale, namespace, "index.md"));

            f.write("---\noutline: false\nnavbar: false\n---\n\n");

            f.write(`# ${i18nextDoc.t(namespace === undefined ? "Documentation.rootNamespace" : "Documentation.namespace", {
                lng: locale,
                namespace
            })}\n\n`);

            f.write(`${i18nextDoc.t("Documentation.introduction")}\n`);
        }
    }

    /**
     * @inheritDoc
     */
    protected override createCategory(_namespace: string | undefined, _category: string, categoryLocalizationsMap: ReadonlyMap<string, string>): void {
        this.#currentCategoryNode = {
            categoryLocalizationsMap,
            functionNodes: []
        };

        this.#currentNamespaceNode.categoryNodes.push(this.#currentCategoryNode);
    }

    /**
     * @inheritDoc
     */
    protected override createProxyObject(): void {
    }

    /**
     * @inheritDoc
     */
    protected override createProxyFunction(classDescriptor: ClassDescriptor, methodDescriptor: MethodDescriptor, functionLocalizationsMap: ReadonlyMap<string, FunctionLocalization>): void {
        // Hidden methods are not documented.
        if (methodDescriptor.isHidden !== true) {
            const namespace = classDescriptor.namespace;

            this.#currentCategoryNode.functionNodes.push({
                functionLocalizationsMap
            });

            // Localize functions documentation.
            for (const documentationResource of this.#documentationResources) {
                const locale = documentationResource.locale;

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed by Generator class.
                const functionLocalization = functionLocalizationsMap.get(locale)!;

                const f = fs.createWriteStream(this.#pathOf(true, locale, namespace, `${functionLocalization.name}.md`));

                f.write("---\noutline: false\nnavbar: false\n---\n\n");

                f.write(`# ${namespace === undefined ? "" : `${namespace}.`}${functionLocalization.name}\n\n`);

                f.write(`${functionLocalization.description}\n`);

                let anyArrayParameter = false;
                let anyMatrixParameter = false;
                let drivingParameterName: string | undefined = undefined;

                if (methodDescriptor.parameterDescriptors.length !== 0) {
                    f.write(`\n## ${documentationResource.parameters}\n\n`);

                    const parametersDocumentation: ParameterDocumentation[] = methodDescriptor.parameterDescriptors.map((parameterDescriptor) => {
                        const parameterName = parameterDescriptor.name;

                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed by Generator class.
                        const parameterLocalization = functionLocalization.parametersMap.get(parameterName)!;

                        let parameterNameSuffix: string;

                        if (parameterDescriptor.multiplicity === Multiplicities.Singleton) {
                            parameterNameSuffix = "";
                        } else {
                            if (parameterDescriptor.multiplicity !== Multiplicities.Matrix) {
                                parameterNameSuffix = "<sup>*</sup>";
                                anyArrayParameter = true;
                            } else {
                                parameterNameSuffix = "<sup>**</sup>";
                                anyMatrixParameter = true;
                            }

                            if (parameterDescriptor.multiplicity !== Multiplicities.SingletonArray) {
                                if (drivingParameterName !== undefined) {
                                    throw new Error(`Parameters ${drivingParameterName} and ${parameterName} both identified as driving parameters`);
                                }

                                drivingParameterName = parameterName;
                            }
                        }

                        return {
                            name: `${parameterName}${parameterNameSuffix}`,
                            description: parameterLocalization.description,
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

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Value is modified in callback.
                    if (anyArrayParameter) {
                        f.write(`\n${i18nextDoc.t("Documentation.parameterAcceptsArray")}\n`);
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Value is modified in callback.
                    if (anyMatrixParameter) {
                        f.write(`\n${i18nextDoc.t("Documentation.parameterAcceptsMatrix")}\n`);
                    }

                    if (methodDescriptor.multiplicity === Multiplicities.Array) {
                        f.write(`\n${i18nextDoc.t("Documentation.functionReturnsArray")}\n`);
                    } else if (methodDescriptor.multiplicity === Multiplicities.Matrix) {
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Value is modified in callback.
                        if (drivingParameterName === undefined) {
                            f.write(`\n${i18nextDoc.t("Documentation.functionReturnsMatrix")}\n`);
                        } else {
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Value is modified in callback.
                            f.write(`\n${i18nextDoc.t(!anyMatrixParameter ? "Documentation.functionReturnsArrayMatrix" : "Documentation.functionReturnsMatrixMatrix", {
                                drivingParameterName
                            })}\n`);
                        }
                    }
                }

                f.end();
            }
        }
    }

    /**
     * @inheritDoc
     */
    protected override finalize(success: boolean): void {
        if (success) {
            for (const locale of this.locales) {
                const rootSidebarItems: DefaultTheme.SidebarItem[] = [];

                for (const namespaceNode of this.#namespaceNodes) {
                    const namespace = namespaceNode.namespace;

                    let namespaceSidebarItems: DefaultTheme.SidebarItem[];

                    if (namespace === undefined) {
                        namespaceSidebarItems = rootSidebarItems;
                    } else {
                        namespaceSidebarItems = [];

                        rootSidebarItems.push({
                            text: namespace,
                            collapsed: false,
                            items: namespaceSidebarItems
                        });
                    }

                    for (const categoryNode of namespaceNode.categoryNodes) {
                        const categorySidebarItems: DefaultTheme.SidebarItem[] = [];

                        namespaceSidebarItems.push({
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed by Generator class.
                            text: categoryNode.categoryLocalizationsMap.get(locale)!,
                            collapsed: true,
                            items: categorySidebarItems
                        });

                        for (const functionNode of categoryNode.functionNodes) {
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed by Generator class.
                            const functionLocalizedName = functionNode.functionLocalizationsMap.get(locale)!.name;

                            categorySidebarItems.push({
                                text: functionLocalizedName,
                                link: this.#pathOf(false, locale, namespace, `${functionLocalizedName}.md`)
                            });
                        }
                    }
                }

                fs.writeFileSync(`${this.#pathOf(true, locale)}app-extension-sidebar.json`, JSON.stringify(rootSidebarItems, null, 2));
            }
        }
    }
}

const generator = new DocumentationGenerator();

i18nDocInit(I18nEnvironments.CLI).then(async () =>
    generator.generate()
).catch((e: unknown) => {
    generator.logger.error(e);
    process.exit(1);
});
