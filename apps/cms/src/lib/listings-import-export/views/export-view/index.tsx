import { DefaultTemplate } from "@payloadcms/next/templates";
import { AdminViewServerProps } from "payload";
import { ExportDashboard } from "./dashboard";
import { redirect } from "next/navigation";

export function ExportView({
    initPageResult,
    params,
    searchParams,
}: AdminViewServerProps) {
    const {
        req: { user },
    } = initPageResult;

    if (!user || user.role !== "admin") {
        redirect("/admin/login");
    }

    return (
        <DefaultTemplate
            i18n={initPageResult.req.i18n}
            locale={initPageResult.locale}
            params={params}
            payload={initPageResult.req.payload}
            permissions={initPageResult.permissions}
            searchParams={searchParams}
            user={initPageResult.req.user || undefined}
            visibleEntities={initPageResult.visibleEntities}
        >
            <ExportDashboard />
        </DefaultTemplate>
    );
}
