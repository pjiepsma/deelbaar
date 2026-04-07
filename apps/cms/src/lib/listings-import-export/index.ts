import type { Config, Plugin } from "payload";
import { exportEndpoint } from "./endpoints/exportEndpoint";
import { importEndpoint } from "./endpoints/importEndpoint";

export const listingsImportExport = (): Plugin => (incomingConfig: Config) => {
    const config: Config = {
        ...incomingConfig,
        admin: {
            ...incomingConfig.admin,
            components: {
                ...incomingConfig.admin?.components || {},
                views: {
                    ...incomingConfig.admin?.components?.views || {},
                    Export: {
                        path: '/listings/export',
                        Component: 'src/lib/listings-import-export/views/export-view/index.tsx#ExportView',
                    },
                    Import: {
                        path: '/listings/import',
                        Component: 'src/lib/listings-import-export/views/import-view/index.tsx#ImportView',
                    },
                },
                afterNavLinks: [
                    ...incomingConfig?.admin?.components?.afterNavLinks || [],
                    'src/lib/listings-import-export/components/import-export-links/importExportLinks.tsx#ListingsImportExportLinks',
                ]
            }
        },
        endpoints: [
            ...incomingConfig.endpoints || [],
            exportEndpoint,
            importEndpoint,
        ]
    }

    return config;
}

