import getDevEmailAdapter from "./consoleLog";
import { getResendAdapter } from "./resend";

export function getSelectedEmailAdapter() {
    const adapter = process.env.MAIL_ADAPTER;

    if (adapter === 'resend') {
        return getResendAdapter()
    }

    // Default to dev adapter (console logging)
    return getDevEmailAdapter()
}









