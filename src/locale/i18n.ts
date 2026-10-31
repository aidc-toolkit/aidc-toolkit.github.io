import { i18nAppExtensionInit } from "@aidc-toolkit/app-extension";
import { i18nCoreInit, i18nInit } from "@aidc-toolkit/core";
import type { i18n, ParseKeys, Resource, TFunction } from "i18next";
import enLocaleResources from "./en/locale-resources.js";
import frLocaleResources from "./fr/locale-resources.js";

/**
 * Documentation add-on extension namespace.
 */
export const docNS = "aidct_doc";

/**
 * Locale resources type is extracted from the English locale resources object.
 */
export type DocLocaleResources = typeof enLocaleResources;

/**
 * Core locale resources augmentation.
 */
declare module "@aidc-toolkit/core" {
    /**
     * Internationalization locale resources.
     */
    export interface I18nLocaleResources {
        /**
         * Documentation locale resources.
         */
        [docNS]: DocLocaleResources;
    }
}

/**
 * Documentation parse keys.
 */
export type DocParseKeys = ParseKeys<typeof docNS>;

/**
 * Documentation resource bundle.
 */
export const docResourceBundle: Resource = {
    en: {
        [docNS]: enLocaleResources
    },
    fr: {
        [docNS]: frLocaleResources
    }
};

/**
 * Documentation i18next translator function.
 */
export let i18nextDocT: TFunction<typeof docNS>;

/**
 * Initialize internationalization.
 *
 * @param i18next
 * Internationalization instance.
 *
 * @param debug
 * Debug setting.
 *
 * @returns
 * Documentation resource bundle.
 */
export async function i18nDocInit(i18next: i18n, debug = false): Promise<Resource> {
    // Bind translator function to i18next.
    i18nextDocT = i18next.getFixedT(null, docNS);

    return i18nInit(i18next, debug, docResourceBundle, i18nCoreInit, i18nAppExtensionInit);
}
