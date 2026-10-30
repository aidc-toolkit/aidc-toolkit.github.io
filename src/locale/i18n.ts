import { i18nAppExtensionInit } from "@aidc-toolkit/app-extension";
import { i18nCoreInit, i18nextInstance, i18nInit, type I18nLanguageDetector } from "@aidc-toolkit/core";
import type { ParseKeys, Resource } from "i18next";
import enLocaleResources from "./en/locale-resources.js";
import frLocaleResources from "./fr/locale-resources.js";

/**
 * Documentation add-on extension namespace.
 */
export const docNS = "aidct_doc";

/**
 * Documentation parse keys.
 */
export type DocParseKeys = ParseKeys<typeof docNS>;

/**
 * Locale resources type is extracted from the English locale strings object.
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

/**
 * Documentation i18next translator function.
 */
export const i18nextDocT = i18nextInstance.getFixedT(null, docNS);

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
    return i18nInit(languageDetector, debug, docResourceBundle, i18nCoreInit, i18nAppExtensionInit);
}
