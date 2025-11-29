import type { AppExtensionLocaleResources } from "@aidc-toolkit/app-extension";
import type { DocLocaleResources } from "./i18n";

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
            aidct_app_extension: AppExtensionLocaleResources;
            aidct_doc: DocLocaleResources;
        };
    }
}
