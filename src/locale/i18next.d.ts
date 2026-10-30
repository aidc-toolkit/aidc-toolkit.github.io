import type { CoreLocaleResources } from "@aidc-toolkit/core";
import type { AppExtensionLocaleResources } from "@aidc-toolkit/app-extension";
import type { DocLocaleResources } from "./i18n.js";

/**
 * Internationalization module.
 */
declare module "i18next" {
    /**
     * Custom type options for this package.
     */
    interface CustomTypeOptions {
        /**
         * Resources override.
         */
        resources: {
            /**
             * Core locale resources.
             */
            aidct_core: CoreLocaleResources;

            /**
             * Application extension locale resources.
             */
            aidct_app_extension: AppExtensionLocaleResources;

            /**
             * Documentation locale resources.
             */
            aidct_doc: DocLocaleResources;
        };
    }
}
