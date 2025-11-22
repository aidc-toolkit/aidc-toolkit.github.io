import { appExtensionResources, i18nAppExtensionInit } from "@aidc-toolkit/app-extension";
import { i18nAssertValidResources, i18nCoreInit, type I18nEnvironment } from "@aidc-toolkit/core";
import i18next, { type i18n, type Resource } from "i18next";
import { localeStrings as enLocaleStrings } from "./en/locale-strings.js";
import { localeStrings as frLocaleStrings } from "./fr/locale-strings.js";

export const docNS = "aidct_doc";

/**
 * Locale strings type is extracted from the English locale strings object.
 */
export type DocLocaleStrings = typeof enLocaleStrings;

i18nAssertValidResources(enLocaleStrings, "fr", frLocaleStrings);

/**
 * Documentation resources.
 */
export const docResources: Resource = {
    en: {
        aidct_doc: enLocaleStrings
    },
    fr: {
        aidct_doc: frLocaleStrings
    }
};

// Explicit type is necessary to work around bug in type discovery with linked packages.
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
