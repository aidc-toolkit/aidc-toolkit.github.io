import { i18nAppExtensionInit } from "@aidc-toolkit/app-extension";
import { i18nCoreInit, i18nInit, type I18nLanguageDetector } from "@aidc-toolkit/core";
import i18next, { type i18n, type Resource } from "i18next";
import enLocaleResources from "./en/locale-resources.js";
import frLocaleResources from "./fr/locale-resources.js";

export const docNS = "aidct_doc";

/**
 * Locale strings type is extracted from the English locale strings object.
 */
export type DocLocaleResources = typeof enLocaleResources;

/**
 * Documentation resource bundle.
 */
export const docResourceBundle: Resource = {
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
 * @param languageDetector
 * Language detector.
 *
 * @param debug
 * Debug setting.
 *
 * @returns
 * Documentation resource bundle.
 */
export async function i18nDocInit(languageDetector: I18nLanguageDetector, debug = false): Promise<Resource> {
    return i18nInit(i18nextDoc, languageDetector, debug, docNS, docResourceBundle, i18nCoreInit, i18nAppExtensionInit);
}
