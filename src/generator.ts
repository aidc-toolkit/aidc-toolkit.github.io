import { type ClassDescriptor, type MethodDescriptor, Multiplicities } from "@aidc-toolkit/app-extension";
import { type FunctionLocalization, Generator } from "@aidc-toolkit/app-extension/generator";
import { I18nLanguageDetectors } from "@aidc-toolkit/core";
import * as fs from "node:fs";
import type { DefaultTheme } from "vitepress/theme";
import packageConfiguration from "../package.json" with { type: "json" };
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
     * Write documentation to a file.
     *
     * @param path
     * Path.
     *
     * @param lines
     * Lines of documentation.
     */
    static #writeDocumentation(path: string, lines: string[]): void {
        fs.writeFileSync(path, `${lines.join("\n")}\n`);
    }

    /**
     * Constructor.
     */
    constructor() {
        super(packageConfiguration.version);
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
        for (const documentationResource of this.#documentationResources) {
            const locale = documentationResource.locale;

            fs.mkdirSync(this.#pathOf(true, locale, namespace), {
                recursive: true
            });

            DocumentationGenerator.#writeDocumentation(this.#pathOf(true, locale, namespace, "index.md"), [
                "---",
                "outline: false",
                "navbar: false",
                "---",
                "",
                `# ${namespace === undefined ? documentationResource.rootNamespaceTitle : documentationResource.namespaceTitle.replaceAll("{{namespace}}", namespace)}`,
                "",
                documentationResource.introduction
            ]);
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
    protected override createClassProxy(): void {
    }

    /**
     * @inheritDoc
     */
    protected override createMethodProxy(classDescriptor: ClassDescriptor, methodDescriptor: MethodDescriptor, functionLocalizationsMap: ReadonlyMap<string, FunctionLocalization>): void {
        // Hidden methods are not documented.
        if (methodDescriptor.isHidden !== true) {
            const namespace = classDescriptor.namespace;

            this.#currentCategoryNode.functionNodes.push({
                functionLocalizationsMap
            });

            let googleSheetsFunctionName: string | undefined = undefined;

            // Localize functions documentation.
            for (const documentationResource of this.#documentationResources) {
                const locale = documentationResource.locale;

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed by Generator class.
                const functionLocalization = functionLocalizationsMap.get(locale)!;

                // Google Sheets doesn't support localization so work with the default (first) locale only.
                googleSheetsFunctionName ??= `Google Sheets: aidct${namespace ?? ""}${functionLocalization.titleCaseName}`;

                const callParameters = `(${methodDescriptor.parameterDescriptors.map((parameterDescriptor) => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed by Generator class.
                    const parameterName = functionLocalization.parametersMap.get(parameterDescriptor.name)!.name;

                    return parameterDescriptor.isRequired ? parameterName : `*${parameterName}*`;
                }).join(", ")})`;

                const functionLines = [
                    "---",
                    "outline: false",
                    "navbar: false",
                    "---",
                    "",
                    `# ${functionLocalization.name}`,
                    "",
                    "::: info Implementations",
                    `Microsoft Excel: AIDCT.${namespace === undefined ? "" : `${namespace}.`}${functionLocalization.name}${callParameters}`,
                    "",
                    `Google Sheets: ${googleSheetsFunctionName}${callParameters}`,
                    ":::",
                    "",
                    functionLocalization.description
                ];

                const functionReturnsIndex = functionLines.length;

                let anyOptional = false;
                let anyArrayParameter = false;
                let anyMatrixParameter = false;
                let drivingParameterName: string | undefined = undefined;

                if (methodDescriptor.parameterDescriptors.length !== 0) {
                    functionLines.push(
                        "",
                        `## ${documentationResource.parameters}`,
                        ""
                    );

                    const parametersDocumentation: ParameterDocumentation[] = methodDescriptor.parameterDescriptors.map((parameterDescriptor) => {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed by Generator class.
                        const parameterLocalization = functionLocalization.parametersMap.get(parameterDescriptor.name)!;

                        const parameterName = parameterLocalization.name;

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

                        anyOptional ||= !parameterDescriptor.isRequired;

                        const nameMarkup = parameterDescriptor.isRequired ? "" : "*";

                        return {
                            name: `${nameMarkup}${parameterName}${nameMarkup}${parameterNameSuffix}`,
                            description: parameterLocalization.description,
                            type: documentationResource.types[parameterDescriptor.type]
                        };
                    });

                    const maximumNameLength = Math.max(documentationResource.name.length, ...parametersDocumentation.map(parameterDocumentation => parameterDocumentation.name.length));
                    const maximumTypeLength = Math.max(documentationResource.type.length, ...parametersDocumentation.map(parameterDocumentation => parameterDocumentation.type.length));
                    const maximumDescriptionLength = Math.max(documentationResource.description.length, ...parametersDocumentation.map(parameterDocumentation => parameterDocumentation.description.length));

                    functionLines.push(
                        `| ${documentationResource.name.padEnd(maximumNameLength)} | ${documentationResource.type.padEnd(maximumTypeLength)} | ${documentationResource.description.padEnd(maximumDescriptionLength)} |`,
                        `|-${"".padEnd(maximumNameLength, "-")}-|-${"".padEnd(maximumTypeLength, "-")}-|-${"".padEnd(maximumDescriptionLength, "-")}-|`
                    );

                    for (const parameterDocumentation of parametersDocumentation) {
                        functionLines.push(`| ${parameterDocumentation.name.padEnd(maximumNameLength)} | ${parameterDocumentation.type.padEnd(maximumTypeLength)} | ${parameterDocumentation.description.padEnd(maximumDescriptionLength)} |`);
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Value is modified in callback.
                    if (anyOptional) {
                        functionLines.push(
                            "",
                            documentationResource.parametersAreOptional
                        );
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Value is modified in callback.
                    if (anyArrayParameter) {
                        functionLines.push(
                            "",
                            documentationResource.parameterAcceptsArray
                        );
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Value is modified in callback.
                    if (anyMatrixParameter) {
                        functionLines.push(
                            "",
                            documentationResource.parameterAcceptsMatrix
                        );
                    }

                    let functionReturns: string | undefined = undefined;

                    if (methodDescriptor.multiplicity === Multiplicities.Array) {
                        functionReturns = documentationResource.functionReturnsArray;
                    } else if (methodDescriptor.multiplicity === Multiplicities.Matrix) {
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Value is modified in callback.
                        if (drivingParameterName === undefined) {
                            functionReturns = documentationResource.functionReturnsMatrix;
                        } else {
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Value is modified in callback.
                            functionReturns = (!anyMatrixParameter ? documentationResource.functionReturnsArrayMatrix : documentationResource.functionReturnsMatrixMatrix).replaceAll("{{drivingParameterName}}", drivingParameterName);
                        }
                    }

                    if (functionReturns !== undefined) {
                        functionLines.splice(functionReturnsIndex, 0, "",
                            "",
                            functionReturns
                        );
                    }
                }

                DocumentationGenerator.#writeDocumentation(this.#pathOf(true, locale, namespace, `${functionLocalization.name}.md`), functionLines);
            }
        }
    }

    /**
     * @inheritDoc
     */
    protected override finalize(success: boolean): void {
        if (success) {
            for (const documentationResource of this.#documentationResources) {
                const locale = documentationResource.locale;
                const rootSidebarItems: DefaultTheme.SidebarItem[] = [];

                for (const namespaceNode of this.#namespaceNodes) {
                    const namespace = namespaceNode.namespace;

                    let namespaceSidebarItems: DefaultTheme.SidebarItem[];

                    if (namespace === undefined) {
                        rootSidebarItems.push({
                            text: documentationResource.top,
                            link: this.#pathOf(false, locale, namespace)
                        });

                        namespaceSidebarItems = rootSidebarItems;
                    } else {
                        namespaceSidebarItems = [];

                        rootSidebarItems.push({
                            text: namespace,
                            link: this.#pathOf(false, locale, namespace),
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

i18nDocInit(I18nLanguageDetectors.CLI).then(async () =>
    generator.generate()
).catch((e: unknown) => {
    generator.logger.error(e);
    process.exit(1);
});
