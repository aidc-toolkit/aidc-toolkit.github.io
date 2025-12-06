import { appExtensionResources, i18nAppExtensionInit } from "@aidc-toolkit/app-extension";
import { i18nCoreInit, type I18nEnvironment } from "@aidc-toolkit/core";
import i18next, { type i18n, type Resource } from "i18next";
import enLocaleResources from "./en/locale-resources";
import frLocaleResources from "./fr/locale-resources";

export const docNS = "aidct_doc";

/**
 * Locale strings type is extracted from the English locale strings object.
 */
export type DocLocaleResources = typeof enLocaleResources;

/**
 * Documentation resources.
 */
export const docResources: Resource = {
    en: {
        aidct_doc: enLocaleResources
    },
    fr: {
        aidct_doc: frLocaleResources
    }
};

// Explicit type is necessary because type can't be inferred without additional references.
export const i18nextDoc: i18n = i18next.createInstance();

/**
 * Initialize internationalization.
 *
 * @param environment
 * Environment in which the application is running.
 *
 * @param debug
 * Debug setting.
 *
 * @returns
 * Void promise.
 */
export async function i18nDocInit(environment: I18nEnvironment, debug = false): Promise<void> {
    await i18nAppExtensionInit(environment, debug);
    await i18nCoreInit(i18nextDoc, environment, debug, docNS, appExtensionResources, docResources);
}
