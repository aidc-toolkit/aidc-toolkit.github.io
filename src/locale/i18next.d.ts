import type { AppExtensionLocaleStrings } from "@aidc-toolkit/app-extension";
import type { DocLocaleStrings } from "./i18n.js";

/**
 * Internationalization module.
 */
declare module "i18next" {
    /**
     * Custom type options for this package.
     */
    interface CustomTypeOptions {
        defaultNS: "aidct_doc";
        resources: {
            aidct_app_extension: AppExtensionLocaleStrings;
            aidct_doc: DocLocaleStrings;
        };
    }
}
