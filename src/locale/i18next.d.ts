import type { I18nLocaleResources } from "@aidc-toolkit/core";

/**
 * Internationalization module augmentation.
 */
declare module "i18next" {
    /**
     * Custom type options for this package.
     */
    interface CustomTypeOptions {
        /**
         * Resources override.
         */
        resources: I18nLocaleResources;
    }
}
